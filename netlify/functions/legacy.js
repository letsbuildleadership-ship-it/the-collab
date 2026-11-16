// The member's Phase Readiness and Legacy Statement (GET), assembled from their own
// finished quests. Nothing is invented: every line is the member's own answer.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { legacyView } = require('./lib/legacy-view');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });
  return json(200, { name: record.name || null, ...legacyView(record) }, { 'Cache-Control': 'private, no-store' });
};
