// Guided quests for the member portal. GET returns a quest plus the member's
// saved progress; GET ?pdf=1 returns their completed report; POST saves
// answers, and with { complete: true } (Membership only for free-tool and open quests) builds the outcome and stores it in the
// member's record so the report lives in their portal.
// Quests are engagement only — they never touch entitlements or downloads.
const store = require('./lib/store');
const membershipStatus = require('./lib/membership-status');
const { resolveAccess } = require('./lib/access');
const freeToolKeys = new Set(require('../../content/free-tools.json').tools.map((t) => t.key));
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests, publicQuest, validateAnswers, cleanNotes, outcomeFor, previewFor } = require('./lib/quests');
const { buildQuestPdf } = require('./lib/quest-pdf');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const isGet = event.httpMethod === 'GET';
  let body = {};
  if (!isGet) {
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  }
  const qs = event.queryStringParameters || {};
  const key = String((isGet ? qs.key : body.key) || '');
  const quest = quests.get(key);
  if (!quest) return json(404, { error: 'Quest not found.' });

  // Free-tool quests are open to every member; a product's quest needs the product
  // (same entitlement check as its PDF download).
  const access = await resolveAccess(record);
  const isProductQuest = !quest.open && !freeToolKeys.has(key);
  const owned = new Set(membershipStatus.effectiveEntitlements(access));
  const ownsIt = owned.has(key) || membershipStatus.catalogUnlockKeys(access).includes(key);
  // Paid IP is only for paid members: a product's quest needs the product or Membership (same
  // entitlement check as its PDF download).
  if (isProductQuest && !ownsIt) return json(403, { error: 'You do not have access to this quest.' });
  // Free members work the quests on the free tools and get an Infrastructure Snapshot™. The full Infrastructure Analysis™,
  // outcomes and report are a Membership benefit (owning a product covers its own quest).
  const canAnalyze = membershipStatus.hasFullCatalog(access) || (isProductQuest && ownsIt);

  record.quests = record.quests || {};
  const saved = record.quests[key] || null;

  if (isGet && qs.pdf) {
    if (!saved || saved.status !== 'done') return json(404, { error: 'Finish the quest to get your report.' });
    const bytes = await buildQuestPdf({ quest, record, result: saved });
    const name = `${quest.title.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}-Quest-Report.pdf`;
    return {
      statusCode: 200,
      isBase64Encoded: true,
      headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'private, no-store' },
      body: bytes.toString('base64'),
    };
  }

  if (isGet) return json(200, { quest: publicQuest(quest), saved, canAnalyze });

  const complete = body.complete === true;
  const v = validateAnswers(quest, body.answers, { complete });
  if (!v.ok) return json(400, { error: v.error });

  if (complete && !canAnalyze) {
    if (saved && saved.status === 'done') return json(200, { saved });
    const preview = previewFor(outcomeFor(quest, v.answers));
    record.quests[key] = { status: 'draft', answers: v.answers, notes: cleanNotes(quest, body.notes), readyForAnalysis: true, preview };
    await store.saveCustomer(record);
    return json(200, { saved: record.quests[key], analysisLocked: true, preview });
  }

  if (complete) {
    record.quests[key] = { status: 'done', answers: v.answers, notes: cleanNotes(quest, body.notes), outcome: outcomeFor(quest, v.answers), completedAt: new Date().toISOString() };
  } else if (saved && saved.status === 'done') {
    return json(200, { saved }); // drafts never overwrite a finished report
  } else {
    record.quests[key] = { status: 'draft', answers: v.answers, notes: cleanNotes(quest, body.notes) };
  }
  await store.saveCustomer(record);
  return json(200, { saved: record.quests[key] });
};
