// One Legacy Statement per member, joined from their own quest answers across The IV Phases™.
// GET returns the suggested draft (from finished quests) and the member's saved statement;
// GET ?pdf=1 returns the saved statement as a PDF; POST saves the member's edited statement.
// Private: only the signed-in member can read or change it. Nothing here is shared or published.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { legacyDraft, draftText, cleanStatement, phaseReadiness } = require('./lib/member-ip');
const { buildLegacyPdf } = require('./lib/quest-pdf');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });
  const qs = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && qs.pdf) {
    const st = record.legacyStatement;
    if (!st || !st.phases || !st.phases.some(Boolean)) return json(404, { error: 'Save your Legacy Statement first.' });
    const bytes = await buildLegacyPdf({ record, statement: st });
    return { statusCode: 200, isBase64Encoded: true, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="My-Legacy-Statement.pdf"', 'Cache-Control': 'private, no-store' }, body: bytes.toString('base64') };
  }
  if (event.httpMethod === 'GET') {
    const draft = legacyDraft(record);
    return json(200, { draft, suggested: draftText(draft), saved: record.legacyStatement || null, readiness: phaseReadiness(record) }, { 'Cache-Control': 'private, no-store' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const st = cleanStatement(body);
  if (!st.phases.some(Boolean)) return json(400, { error: 'Write at least one phase of your statement.' });
  record.legacyStatement = { ...st, updatedAt: new Date().toISOString() };
  await store.saveCustomer(record);
  return json(200, { saved: record.legacyStatement });
};
