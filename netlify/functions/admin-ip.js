// Owner-only IP review: member feedback, the improvement backlog, and anonymous usage
// insights. Nothing waits for approval: ideas and feedback are approved as planned when they
// arrive and recorded done once shipped and verified (lib/ip-autopilot.js), with an audit
// trail. GET returns it all; POST { kind, id, status, note, publicNote } lets the owner
// override any item; marking feedback done with a public note adds it to the public changelog.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { computeInsights } = require('./lib/ip-insights');
const { checkinInsights } = require('./lib/member-ip');
const autopilot = require('./lib/ip-autopilot');
const backlog = require('../../content/ip-backlog.json').items;

const STATUSES = ['new', 'considering', 'planned', 'done', 'declined'];

const { isAdmin: authorized } = require('./lib/admin-auth');

async function load() {
  const byId = await autopilot.reconcile('ip-backlog-status', backlog);
  const [feedbackRaw, customers] = await Promise.all([store.opsList('ip-feedback'), store.listCustomers()]);
  // Member feedback is queued automatically too; the owner closes it (done, with an optional public note).
  const feedback = [];
  for (const f of feedbackRaw) {
    if (f.status === 'new') {
      const next = { ...f, status: 'planned', note: 'Queued automatically for the next revision of this IP.', decidedAt: new Date().toISOString() };
      await store.opsPut('ip-feedback', f.id, next);
      await autopilot.log({ collection: 'ip-feedback', id: f.id, from: 'new', to: 'planned', by: 'auto', note: next.note });
      feedback.push(next);
    } else feedback.push(f);
  }
  const items = backlog.map((b) => { const s = byId.get(b.id) || {}; return { ...b, status: s.status || 'planned', note: s.note || null, decidedAt: s.decidedAt || null, by: s.by || null }; });
  feedback.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const trail = await autopilot.auditTrail();
  const founderDecisions = items.filter((b) => b.founderDecision && autopilot.OPEN.includes(b.status));
  return { backlog: items, feedback, insights: { ...computeInsights(customers), checkins: checkinInsights(customers) }, trail, founderDecisions };
}

exports.load = load;

exports.handler = async (event) => {
  if (!authorized(event)) return json(401, { error: 'Unauthorized.' });
  if (event.httpMethod === 'GET') {
    const data = await load();
    return json(200, { ...data, awaiting: data.founderDecisions.length, done: data.backlog.filter((b) => b.status === 'done').length, inProgress: data.backlog.filter((b) => b.status === 'planned').length + data.feedback.filter((f) => f.status === 'planned').length });
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
    const prev = await store.opsGet('ip-backlog-status', body.id);
    await autopilot.setStatus('ip-backlog-status', body.id, status, note, 'owner', {}, prev);
  } else if (body.kind === 'feedback') {
    const item = await store.opsGet('ip-feedback', body.id);
    if (!item) return json(404, { error: 'Not found.' });
    await store.opsPut('ip-feedback', body.id, { ...item, status, note, decidedAt });
    await autopilot.log({ collection: 'ip-feedback', id: body.id, from: item.status, to: status, by: 'owner', note });
    // The public changelog gets only the owner's own words, the IP and the date: never the member or their feedback.
    const publicNote = String(body.publicNote || '').trim().slice(0, 600);
    if (status === 'done' && publicNote) {
      await store.opsPut('ip-changelog', body.id, { id: body.id, date: decidedAt.slice(0, 10), title: `Improved: ${item.questTitle}`, ip: item.questTitle, text: publicNote });
    }
  } else {
    return json(400, { error: 'Unknown kind.' });
  }
  return json(200, { ok: true });
};
