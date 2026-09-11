// GET the signed-in member's full Legacy Library™ view: which month is
// open, the full 12-month syllabus merged with their own progress, their
// Marks totals, Phase Crowns, Cycle Rings, and the Order of Distinction
// that adds up to. Gated on an active `library-card` membership — holding
// the Library Card is what enrolls a member in the Legacy Library.
const store = require('./lib/store');
const { tokenFromEvent, json } = require('./lib/http');
const lib = require('./lib/library-content');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const libraryCard = record.memberships && record.memberships['library-card'];
  if (!libraryCard || libraryCard.status !== 'active') {
    return json(403, { error: 'The Legacy Library is available with an active .LLab Library Card™.' });
  }

  const library = lib.ensureLibrary(record);
  const { cycleNumber, monthOrder: currentMonthOrder } = lib.currentCycleAndMonth(library);
  const cycle = lib.ensureCycle(library, cycleNumber);

  // Touch every month up to the current one so recomputeCycleDistinctions
  // has something to check against, then re-derive crowns/ring in case
  // calendar time alone just closed out a phase that was already fully
  // marked (e.g. the member finished HEIRLOOM's marks, but the phase-crown
  // check only reruns when we're here).
  for (let o = 1; o <= currentMonthOrder; o += 1) lib.ensureMonth(cycle, o);
  lib.recomputeCycleDistinctions(cycle);

  const totals = lib.lifetimeTotals(library);
  const orderKey = lib.computeOrder(totals);
  const order = lib.ORDER_BY_KEY.get(orderKey);

  const months = lib.MONTHS.map((m) => {
    const progress = cycle.months[String(m.order)] || lib.emptyMonthProgress();
    let status = 'upcoming';
    if (m.order < currentMonthOrder) status = 'past';
    else if (m.order === currentMonthOrder) status = 'current';
    return {
      order: m.order,
      theme: m.theme,
      title: m.title,
      intent: m.intent,
      phase: m.phase,
      books: m.books,
      scholarly_reading: m.scholarly_reading,
      reflective_practice: m.reflective_practice,
      community_reflection: m.community_reflection,
      status,
      stewarded: lib.isMonthFullyStewarded(progress),
      progress,
    };
  });

  const cycleHistory = Object.keys(library.cycles)
    .map(Number)
    .filter((n) => n < cycleNumber)
    .sort((a, b) => a - b)
    .map((n) => ({ cycleNumber: n, complete: !!library.cycles[String(n)].cycleRing }));

  await store.saveCustomer(record);

  return json(200, {
    memberId: record.memberId,
    onboarded: !!library.onboarded,
    cycleNumber,
    currentMonthOrder,
    order: { key: order.key, name: order.name, description: order.description },
    triarchPhases: lib.PHASES,
    orders: lib.ORDERS,
    marks: lib.MARKS,
    months,
    phaseCrowns: cycle.phaseCrowns,
    phaseCrownsEverEarned: totals.phaseCrownsEverEarned,
    memberships: record.memberships || {},
    marksSummary: {
      book: totals.book,
      research: totals.research,
      practice: totals.practice,
      reflection: totals.reflection,
      community: totals.community,
      phaseCrowns: totals.phaseCrowns,
      cycleRings: totals.cycleRings,
    },
    cycleHistory,
  });
};
