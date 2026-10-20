// Owner-only, idempotent setup for products flagged `stripe_pending` in content/pricing.json:
// creates the Stripe product, one-time USD price and Payment Link for each one (reusing anything
// already created for the same key), and returns the price ids and links to paste into pricing.json.
//
//   curl -H "X-Admin-Token: <ADMIN_TOKEN>" https://<site>/.netlify/functions/admin-setup-stripe-products
//   (add ?dry=1 to preview without creating anything)
//
// Then save the JSON and run:  node scripts/apply-stripe-links.mjs links.json
// which writes the ids into pricing.json and clears the stripe_pending flags.

const { json } = require('./lib/http');
const pricing = require('./lib/pricing');
const { isAdmin } = require('./lib/admin-auth');

const KEY_META = 'collab_key';

function pendingItems(registry) {
  return (registry.products || [])
    .filter((p) => p.stripe_pending)
    .map((p) => ({ key: p.key, name: p.name, description: p.description, cents: Math.round(pricing.priceDollars(p) * 100), price_display: p.price_display }));
}

async function findProduct(stripe, key) {
  const found = await stripe.products.search({ query: `metadata['${KEY_META}']:'${key}' AND active:'true'`, limit: 1 });
  return found.data[0] || null;
}

async function findPrice(stripe, productId, cents) {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 100 });
  return prices.data.find((p) => p.type === 'one_time' && p.currency === 'usd' && p.unit_amount === cents) || null;
}

async function findLink(stripe, key) {
  let startingAfter;
  do {
    const page = await stripe.paymentLinks.list({ active: true, limit: 100, starting_after: startingAfter });
    const hit = page.data.find((l) => l.metadata && l.metadata[KEY_META] === key);
    if (hit) return hit;
    startingAfter = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (startingAfter);
  return null;
}

async function createLinks(stripe, items, { origin, dry = false } = {}) {
  const results = [];
  for (const it of items) {
    const r = { key: it.key, name: it.name, price_display: it.price_display };
    if (!Number.isFinite(it.cents) || it.cents <= 0) { results.push({ ...r, status: 'error', error: 'no dollar price' }); continue; }
    if (dry) { results.push({ ...r, status: 'would_create', amount_cents: it.cents }); continue; }
    let product = await findProduct(stripe, it.key);
    if (!product) product = await stripe.products.create({ name: it.name, description: it.description, metadata: { [KEY_META]: it.key } });
    let price = await findPrice(stripe, product.id, it.cents);
    if (!price) price = await stripe.prices.create({ product: product.id, unit_amount: it.cents, currency: 'usd', metadata: { [KEY_META]: it.key } });
    let link = await findLink(stripe, it.key);
    const reused = Boolean(link);
    if (!link) {
      link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        allow_promotion_codes: true,
        customer_creation: 'always',
        after_completion: { type: 'redirect', redirect: { url: `${origin}/pages/account.html` } },
        metadata: { [KEY_META]: it.key },
      });
    }
    results.push({ ...r, status: reused ? 'already_exists' : 'created', stripe_price_id: price.id, payment_link: link.url });
  }
  return results;
}

exports.createLinks = createLinks;
exports.pendingItems = pendingItems;

exports.handler = async (event) => {
  if (!isAdmin(event)) return json(404, { error: 'Not found' });
  const items = pendingItems(pricing.registry);
  if (!items.length) return json(200, { message: 'No products are waiting for Stripe links.', results: [] });
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json(500, { error: 'STRIPE_SECRET_KEY is not set.' });
  const dry = Boolean(event.queryStringParameters && event.queryStringParameters.dry);
  const origin = process.env.URL || 'https://wearethellab.com';
  try {
    const { getStripe } = require('./lib/stripe-client');
    const results = await createLinks(getStripe(), items, { origin, dry });
    return json(200, { mode: key.startsWith('sk_live') ? 'live' : 'test', dry, results, next: 'Save the "results" array as links.json, then run: node scripts/apply-stripe-links.mjs links.json' });
  } catch (err) {
    console.error('admin-setup-stripe-products error', err);
    return json(500, { error: err.message || 'Stripe error creating products.' });
  }
};
