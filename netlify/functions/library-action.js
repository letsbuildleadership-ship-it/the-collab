// POST: record one unit of stewardship in The Legacy Library™ — marking a
// book read, submitting a research note on the Scholarly Reading,
// completing the Reflective Practice™, submitting a personal reflection,
// or contributing a Community Reflection. Each of these is a Mark; when
// every Mark in a month is earned the month is "fully stewarded," and when
// every month in a TRIARCH phase is stewarded that phase earns its Phase
// Crown™ — none of this ever touches downloads or Stripe entitlements.
const store = require('./lib/store');
const { tokenFromEvent, json } = require('./lib/http');
const lib = require('./lib/library-content');

const TEXT_ACTIONS = new Set(['submit-research', 'submit-practice', 'submit-reflection', 'submit-community']);
const MARK_FIELD = {
  'submit-research': 'research',
  'submit-practice': 'practice',
  'submit-reflection': 'reflection',
  'submit-community': 'community',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const libraryCard = record.memberships && record.memberships['library-card'];
  if (!libraryCard || libraryCard.status !== 'active') {
    return json(403, { error: 'The Legacy Library is available with an active .LLab Library Card™.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  const action = typeof body.action === 'string' ? body.action : '';
  const library = lib.ensureLibrary(record);

  if (action === 'onboard') {
    library.onboarded = true;
    await store.saveCustomer(record);
    return json(200, { onboarded: true });
  }

  const { cycleNumber, monthOrder: currentMonthOrder } = lib.currentCycleAndMonth(library);
  const monthOrder = Number.isInteger(body.monthOrder) ? body.monthOrder : -1;

  if (monthOrder < 1 || monthOrder > 12) return json(400, { error: 'Invalid monthOrder.' });
  if (monthOrder > currentMonthOrder) {
    return json(403, { error: "That month of the cycle hasn't opened yet." });
  }

  const cycle = lib.ensureCycle(library, cycleNumber);
  const progress = lib.ensureMonth(cycle, monthOrder);

  const beforeCrowns = { ...cycle.phaseCrowns };
  const beforeRing = cycle.cycleRing;

  if (action === 'toggle-book') {
    const bookIndex = Number.isInteger(body.bookIndex) ? body.bookIndex : -1;
    if (bookIndex < 0 || bookIndex > 3) return json(400, { error: 'Invalid bookIndex.' });
    progress.books[bookIndex] = !!body.done;
  } else if (TEXT_ACTIONS.has(action)) {
    const field = MARK_FIELD[action];
    const done = !!body.done;
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 4000) : '';
    progress[field] = { done, note: text };

    if (action === 'submit-community') {
      if (done && text) {
        await store.upsertCommunityReflection(monthOrder, record.memberId, text);
      }
      // Withdrawing a community reflection (done:false) is left visible in
      // the community wall by design — a member's stewardship record is
      // theirs to unmark privately, but public contributions aren't
      // silently erased out from under a shared discussion.
    }
  } else {
    return json(400, { error: 'Unknown action.' });
  }

  lib.recomputeCycleDistinctions(cycle);
  await store.saveCustomer(record);

  const newlyEarned = [];
  lib.PHASES.forEach((p) => {
    if (cycle.phaseCrowns[p.key] && !beforeCrowns[p.key]) newlyEarned.push({ type: 'phase-crown', phase: p.key, name: p.name });
  });
  if (cycle.cycleRing && !beforeRing) newlyEarned.push({ type: 'cycle-ring' });

  const totals = lib.lifetimeTotals(library);
  const orderKey = lib.computeOrder(totals);
  const order = lib.ORDER_BY_KEY.get(orderKey);

  return json(200, {
    monthOrder,
    progress,
    stewarded: lib.isMonthFullyStewarded(progress),
    phaseCrowns: cycle.phaseCrowns,
    newlyEarned,
    order: { key: order.key, name: order.name, description: order.description },
    marksSummary: {
      book: totals.book,
      research: totals.research,
      practice: totals.practice,
      reflection: totals.reflection,
      community: totals.community,
      phaseCrowns: totals.phaseCrowns,
      cycleRings: totals.cycleRings,
    },
  });
};
