// Guided quests for the member portal. GET returns a quest plus the member's
// saved progress; GET ?pdf=1 returns their completed report; POST saves
// answers, and with { complete: true } builds the outcome and stores it in the
// member's record so the report lives in their portal.
// Quests are engagement only — they never touch entitlements or downloads.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests, publicQuest, validateAnswers, cleanNotes, outcomeFor } = require('./lib/quests');
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

  if (isGet) return json(200, { quest: publicQuest(quest), saved });

  const complete = body.complete === true;
  const v = validateAnswers(quest, body.answers, { complete });
  if (!v.ok) return json(400, { error: v.error });

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
