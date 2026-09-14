// Public, unauthenticated: the Founder Recognition list shown on
// pages/founders.html — every recognized Founder, grouped by level,
// ordered by their permanent sequential Founder Number. Only ever
// publishes name-or-Member-ID (Member ID is already treated as a public
// handle elsewhere on the site, e.g. Legacy Library™ community
// reflections) — never email, Stripe ids, or purchase history.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

function founderNumberSort(a, b) {
  return a.founderNumber < b.founderNumber ? -1 : a.founderNumber > b.founderNumber ? 1 : 0;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  try {
    const founders = await store.listFounders();
    const levels = pricing.founderTierKeys(); // ascending rank order

    const groups = levels.map((key) => ({
      level: key,
      levelLabel: pricing.founderLevelLabelForKey(key),
      founders: founders
        .filter((f) => f.level === key)
        .sort(founderNumberSort)
        .map((f) => ({
          founderNumber: f.founderNumber,
          displayName: f.name || f.memberId || 'A Co.LLab™ Founder',
          recognizedAt: f.recognizedAt,
        })),
    }));

    return json(200, { total: founders.length, groups }, { 'Cache-Control': 'public, max-age=60' });
  } catch (err) {
    console.error('founders-recognition error', err);
    return json(500, { error: 'Could not load Founder recognition.' });
  }
};
