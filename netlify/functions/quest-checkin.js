// A member's reply to a commitment check-in. GET ?key&d returns the commitment and any
// reply; POST { key, d, status, note } records what happened; POST { off: true|false }
// turns check-in emails off or back on.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests } = require('./lib/quests');
const { MILESTONES, STATUSES, commitmentOf } = require('./lib/checkins');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  let body = {};
  if (event.httpMethod === 'POST') {
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
    if (typeof body.off === 'boolean') {
      record.checkinsOff = body.off;
      await store.saveCustomer(record);
      return json(200, { ok: true, off: record.checkinsOff });
    }
  }
  const src = event.httpMethod === 'GET' ? event.queryStringParameters || {} : body;
  if (event.httpMethod === 'GET' && !src.key) return json(200, { off: !!record.checkinsOff });
  const key = String(src.key || '');
  const d = Number(src.d);
  const saved = (record.quests || {})[key];
  if (!quests.has(key) || !saved || saved.status !== 'done') return json(404, { error: 'That quest is not finished in your portal.' });
  if (!MILESTONES.includes(d)) return json(400, { error: 'Unknown check-in.' });
  const commitment = commitmentOf(key, saved);
  if (event.httpMethod === 'GET') {
    return json(200, { title: quests.get(key).title, commitment, completedAt: saved.completedAt, days: d, checkin: (saved.checkins || {})[d] || null, off: !!record.checkinsOff });
  }
  const status = String(body.status || '');
  if (!STATUSES.includes(status)) return json(400, { error: 'Choose what happened.' });
  const note = String(body.note || '').replace(/\s+/g, ' ').trim().slice(0, 1000);
  saved.checkins = saved.checkins || {};
  saved.checkins[d] = { ...(saved.checkins[d] || {}), status, note, repliedAt: new Date().toISOString() };
  await store.saveCustomer(record);
  return json(200, { ok: true, checkin: saved.checkins[d] });
};
