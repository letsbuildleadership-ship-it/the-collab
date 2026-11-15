// Owner-only: switch every existing Founders Organization Payment Link to ACH
// (US bank account) only. New links get ACH from admin-setup-stripe-products,
// and on-site checkouts (give, checkout-create) already request it.
//
//   curl -H "X-Admin-Token: <ADMIN_TOKEN>" https://<site>/.netlify/functions/admin-founders-ach?dry=1
//   (drop ?dry=1 to apply)

const { json } = require('./lib/http');
const pricing = require('./lib/pricing');
const { isAdmin } = require('./lib/admin-auth');

function foundersLinks(registry) {
  return (registry.products || [])
    .filter((p) => p.payment_link && pricing.isFoundersKey(p.key))
    .map((p) => ({ key: p.key, url: p.payment_link }));
}

async function applyAch(stripe, targets, { dry = false } = {}) {
  const byUrl = new Map(targets.map((t) => [t.url, t]));
  const results = [];
  let startingAfter;
  do {
    const page = await stripe.paymentLinks.list({ active: true, limit: 100, starting_after: startingAfter });
    for (const link of page.data) {
      const t = byUrl.get(link.url);
      if (!t) continue;
      byUrl.delete(link.url);
      const current = link.payment_method_types || null;
      if (current && current.length === 1 && current[0] === 'us_bank_account') { results.push({ key: t.key, status: 'already_ach' }); continue; }
      if (dry) { results.push({ key: t.key, status: 'would_update', from: current || 'automatic' }); continue; }
      await stripe.paymentLinks.update(link.id, { payment_method_types: pricing.FOUNDERS_PAYMENT_METHODS });
      results.push({ key: t.key, status: 'updated' });
    }
    startingAfter = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (startingAfter);
  for (const t of byUrl.values()) results.push({ key: t.key, status: 'not_found', url: t.url });
  return results;
}

exports.foundersLinks = foundersLinks;
exports.applyAch = applyAch;

exports.handler = async (event) => {
  if (!isAdmin(event)) return json(404, { error: 'Not found' });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'STRIPE_SECRET_KEY is not set.' });
  const dry = Boolean(event.queryStringParameters && event.queryStringParameters.dry);
  try {
    const { getStripe } = require('./lib/stripe-client');
    const results = await applyAch(getStripe(), foundersLinks(pricing.registry), { dry });
    return json(200, { dry, results });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
