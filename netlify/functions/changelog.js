// Public changelog: what changed in the IP because of member feedback. Only items the
// owner marked done with a public note appear; no member is ever named.
const store = require('./lib/store');
const { json } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const feedback = await store.opsList('ip-feedback');
  const entries = feedback
    .filter((f) => f.status === 'done' && f.publicNote)
    .map((f) => ({ date: String(f.decidedAt || '').slice(0, 10), ip: f.questTitle, change: f.publicNote }))
    .sort((a, b) => b.date.localeCompare(a.date));
  return json(200, { entries }, { 'Cache-Control': 'public, max-age=300' });
};
