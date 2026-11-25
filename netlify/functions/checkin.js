// The 30, 90 and 365-day check-ins on each quest commitment. GET lists the member's
// check-ins (due first); POST { questKey, day, status, note } records what happened.
// Replies stay in the member's own record; the owner only ever sees anonymous counts.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { checkinView, recordCheckin } = require('./lib/member-ip');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });
  if (event.httpMethod === 'GET') return json(200, { checkins: checkinView(record) }, { 'Cache-Control': 'private, no-store' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const r = recordCheckin(record, String(body.questKey || ''), body.day, body);
  if (r.error) return json(400, { error: r.error });
  await store.saveCustomer(record);
  return json(200, { reply: r.reply, checkins: checkinView(record) });
};
