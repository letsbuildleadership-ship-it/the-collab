// Owner-only IP analysis: every guided IP with its structure, language and usage,
// the portfolio view, and ranked recommendations from content, member activity and
// member feedback. Each recommendation can be decided on (and stays visible until
// it is). GET returns the analysis; GET ?quest=key returns that IP's full questions;
// POST { id, status, note } records a decision.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { quests } = require('./lib/quests');
const { catalog, portfolio } = require('./lib/ip-audit');
const { computeInsights } = require('./lib/ip-insights');

const STATUSES = ['new', 'considering', 'planned', 'done', 'declined'];
const SEVERITY = { high: 0, medium: 1, low: 2 };

const { isAdmin: authorized } = require('./lib/admin-auth');

async function analyze() {
  const [customers, feedback, statuses] = await Promise.all([store.listCustomers(), store.opsList('ip-feedback'), store.opsList('ip-reco-status')]);
  const insights = computeInsights(customers);
  const usageByKey = new Map(insights.perQuest.map((p) => [p.key, p]));
  const fbByKey = {};
  feedback.forEach((f) => { (fbByKey[f.questKey] = fbByKey[f.questKey] || []).push(f); });

  const items = catalog().map((i) => {
    const u = usageByKey.get(i.key);
    const fb = fbByKey[i.key] || [];
    return { ...i, usage: { started: u ? u.started : 0, completed: u ? u.completed : 0, completionRate: u ? u.completionRate : null }, feedback: { total: fb.length, unclear: fb.filter((f) => f.unclear).length } };
  });
  const port = portfolio(items);

  const recs = [
    ...items.flatMap((i) => (i.audit ? i.audit.findings : [])),
    ...port.recommendations,
    ...insights.suggestions.map((s) => ({ id: `usage-${s.id}`, ip: 'Member activity', severity: 'medium', source: 'usage', text: s.text, evidence: 'Anonymous counts from member activity' })),
    ...Object.entries(fbByKey).filter(([, list]) => list.filter((f) => f.unclear).length >= 2).map(([key, list]) => ({
      id: `feedback-unclear-${key}`, ip: key, severity: 'high', source: 'feedback',
      text: `${list.filter((f) => f.unclear).length} members said something in ${(quests.get(key) || {}).title || key} was unclear or missing. Review their notes and revise the question.`,
      evidence: list.filter((f) => f.unclear).slice(0, 2).map((f) => f.unclear.slice(0, 120)).join(' | '),
    })),
  ];
  const byId = new Map(statuses.map((s) => [s.id, s]));
  const withStatus = recs.map((r) => ({ ...r, status: (byId.get(r.id) || {}).status || 'new', note: (byId.get(r.id) || {}).note || null, decidedAt: (byId.get(r.id) || {}).decidedAt || null }));
  withStatus.sort((a, b) => (a.status === 'new' ? 0 : 1) - (b.status === 'new' ? 0 : 1) || SEVERITY[a.severity] - SEVERITY[b.severity]);

  return { generatedAt: new Date().toISOString(), catalog: items, portfolio: { matrix: port.matrix, freeByPhase: port.freeByPhase, phaseTotals: port.phaseTotals, oe: port.oe }, recommendations: withStatus, insights: { note: insights.note, enoughData: insights.enoughData, sampleSize: insights.sampleSize, completedQuests: insights.completedQuests, phaseGaps: insights.phaseGaps }, awaiting: withStatus.filter((r) => r.status === 'new').length };
}

exports.analyze = analyze;

exports.handler = async (event) => {
  if (!authorized(event)) return json(401, { error: 'Unauthorized.' });
  if (event.httpMethod === 'GET') {
    const key = (event.queryStringParameters || {}).quest;
    if (key) {
      const q = quests.get(key);
      return q ? json(200, { quest: q }) : json(404, { error: 'No guided questions for that IP yet.' });
    }
    return json(200, await analyze());
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const status = String(body.status || '');
  const note = String(body.note || '').trim().slice(0, 1000) || null;
  const id = String(body.id || '').slice(0, 200);
  if (!id) return json(400, { error: 'Missing id.' });
  if (!STATUSES.includes(status)) return json(400, { error: 'Unknown status.' });
  if (status === 'declined' && !note) return json(400, { error: 'Add a short note on why, so the decision is remembered.' });
  await store.opsPut('ip-reco-status', id, { id, status, note, decidedAt: status === 'new' ? null : new Date().toISOString() });
  return json(200, { ok: true });
};
