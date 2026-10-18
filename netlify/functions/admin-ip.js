// Owner-only IP review: member feedback, the improvement backlog, and anonymous
// usage insights, with a decision recorded on every item. GET returns it all;
// POST { kind, id, status, note } records a decision.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { computeInsights } = require('./lib/ip-insights');
const backlog = require('../../content/ip-backlog.json').items;

const STATUSES = ['new', 'considering', 'planned', 'done', 'declined'];

function authorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

async function load() {
  const [feedback, statuses, customers] = await Promise.all([store.opsList('ip-feedback'), store.opsList('ip-backlog-status'), store.listCustomers()]);
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const items = backlog.map((b) => ({ ...b, status: (byId.get(b.id) || {}).status || 'new', note: (byId.get(b.id) || {}).note || null, decidedAt: (byId.get(b.id) || {}).decidedAt || null }));
  feedback.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return { backlog: items, feedback, insights: computeInsights(customers) };
}

exports.load = load;

exports.handler = async (event) => {
  if (!authorized(event)) return json(401, { error: 'Unauthorized.' });
  if (event.httpMethod === 'GET') {
    const data = await load();
    return json(200, { ...data, awaiting: data.backlog.filter((b) => b.status === 'new').length + data.feedback.filter((f) => f.status === 'new').length });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const status = String(body.status || '');
  const note = String(body.note || '').trim().slice(0, 1000) || null;
  if (!STATUSES.includes(status)) return json(400, { error: 'Unknown status.' });
  if (status === 'declined' && !note) return json(400, { error: 'Add a short note on why, so the decision is remembered.' });
  const decidedAt = status === 'new' ? null : new Date().toISOString();
  if (body.kind === 'backlog') {
    if (!backlog.some((b) => b.id === body.id)) return json(404, { error: 'Not found.' });
    await store.opsPut('ip-backlog-status', body.id, { id: body.id, status, note, decidedAt });
  } else if (body.kind === 'feedback') {
    const item = await store.opsGet('ip-feedback', body.id);
    if (!item) return json(404, { error: 'Not found.' });
    await store.opsPut('ip-feedback', body.id, { ...item, status, note, decidedAt });
  } else {
    return json(400, { error: 'Unknown kind.' });
  }
  return json(200, { ok: true });
};
