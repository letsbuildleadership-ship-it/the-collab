// Public, unauthenticated: the Founder Recognition list shown on
// pages/founders.html — every recognized Founder, grouped by level,
// ordered by their permanent sequential Founder Number. Only ever
// publishes the name given at checkout, and only for real buyers (no test
// purchases, no placeholders) — never email, Stripe ids, or purchase history.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

function founderNumberSort(a, b) {
  return a.founderNumber < b.founderNumber ? -1 : a.founderNumber > b.founderNumber ? 1 : 0;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  try {
    // Only real people or companies: a name given at checkout, never a test purchase or a placeholder.
    const real = (x) => x.name && String(x.name).trim() && !x.test;
    const founders = (await store.listFounders()).filter(real);
    const levels = pricing.recognitionLevels(); // ascending rank order

    const groups = levels.map(({ key, label }) => ({
      level: key,
      levelLabel: label,
      founders: founders
        .filter((f) => f.level === key)
        .sort(founderNumberSort)
        .map((f) => ({
          founderNumber: f.founderNumber,
          displayName: String(f.name).trim(),
          recognizedAt: f.recognizedAt,
        })),
    }));

    return json(200, { total: founders.length, groups }, { 'Cache-Control': 'public, max-age=60' });
  } catch (err) {
    console.error('founders-recognition error', err);
    return json(500, { error: 'Could not load Founder recognition.' });
  }
};
