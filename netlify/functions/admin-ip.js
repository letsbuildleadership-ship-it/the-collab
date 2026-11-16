// Owner-only IP review: member feedback, the improvement backlog, and anonymous
// usage insights, with a decision recorded on every item. GET returns it all;
// POST { kind, id, status, note } records a decision.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { computeInsights } = require('./lib/ip-insights');
const backlog = require('../../content/ip-backlog.json').items;

const STATUSES = ['new', 'considering', 'planned', 'done', 'declined'];

const { isAdmin: authorized } = require('./lib/admin-auth');

async function load() {
  const [feedback, statuses, customers] = await Promise.all([store.opsList('ip-feedback'), store.opsList('ip-backlog-status'), store.listCustomers()]);
  const byId = new Map(statuses.map((s) => [s.id, s]));
  // An idea that has been built ships as done (with what was built) unless the owner decided otherwise.
  const items = backlog.map((b) => { const s = byId.get(b.id) || {}; return { ...b, status: s.status || (b.built ? 'done' : 'new'), note: s.note || (b.built ? b.built.note : null), decidedAt: s.decidedAt || (b.built ? b.built.date : null) }; });
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
    // A public note on a done item is published on the changelog (what changed because of member feedback).
    const publicNote = status === 'done' ? String(body.publicNote || '').replace(/\s+/g, ' ').trim().slice(0, 400) || null : null;
    await store.opsPut('ip-feedback', body.id, { ...item, status, note, decidedAt, publicNote });
  } else {
    return json(400, { error: 'Unknown kind.' });
  }
  return json(200, { ok: true });
};
