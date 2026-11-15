// Owner-only, idempotent Stripe setup so Founders Organization payments work like
// Partnership payments (card or ACH):
//  1. turns on ACH Direct Debit (us_bank_account) in the default payment method configuration,
//  2. adds checkout.session.async_payment_succeeded/failed to this site's webhook endpoint,
//  3. sets every existing Founders Payment Link to card + ACH, like the Partnership links.
// On-site checkouts and new links use the same list.
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
      const want = pricing.FOUNDERS_PAYMENT_METHODS;
      if (current && current.length === want.length && want.every((m) => current.includes(m))) { results.push({ key: t.key, status: 'already_card_ach' }); continue; }
      if (dry) { results.push({ key: t.key, status: 'would_update', from: current || 'automatic' }); continue; }
      await stripe.paymentLinks.update(link.id, { payment_method_types: want });
      results.push({ key: t.key, status: 'updated' });
    }
    startingAfter = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (startingAfter);
  for (const t of byUrl.values()) results.push({ key: t.key, status: 'not_found', url: t.url });
  return results;
}

const ASYNC_EVENTS = ['checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed'];

async function enableAch(stripe, { dry = false } = {}) {
  const configs = await stripe.paymentMethodConfigurations.list({ limit: 100 });
  const cfg = configs.data.find((c) => c.is_default && !c.parent) || configs.data.find((c) => c.is_default) || null;
  if (!cfg) return { status: 'no_default_configuration' };
  const ach = cfg.us_bank_account || {};
  if (ach.available) return { status: 'already_on', id: cfg.id };
  if (dry) return { status: 'would_turn_on', id: cfg.id };
  const updated = await stripe.paymentMethodConfigurations.update(cfg.id, { us_bank_account: { display_preference: { preference: 'on' } } });
  return { status: updated.us_bank_account && updated.us_bank_account.available ? 'turned_on' : 'requested', id: cfg.id };
}

async function addWebhookEvents(stripe, { dry = false } = {}) {
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  const ep = list.data.find((e) => /\/\.netlify\/functions\/stripe-webhook/.test(e.url) && e.status === 'enabled');
  if (!ep) return { status: 'endpoint_not_found' };
  const events = ep.enabled_events || [];
  if (events.includes('*')) return { status: 'already_all_events', id: ep.id };
  const missing = ASYNC_EVENTS.filter((e) => !events.includes(e));
  if (!missing.length) return { status: 'already_added', id: ep.id };
  if (dry) return { status: 'would_add', id: ep.id, events: missing };
  await stripe.webhookEndpoints.update(ep.id, { enabled_events: [...events, ...missing] });
  return { status: 'added', id: ep.id, events: missing };
}

exports.enableAch = enableAch;
exports.addWebhookEvents = addWebhookEvents;
exports.foundersLinks = foundersLinks;
exports.applyAch = applyAch;

exports.handler = async (event) => {
  if (!isAdmin(event)) return json(404, { error: 'Not found' });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'STRIPE_SECRET_KEY is not set.' });
  const dry = Boolean(event.queryStringParameters && event.queryStringParameters.dry);
  try {
    const { getStripe } = require('./lib/stripe-client');
    const stripe = getStripe();
    const ach = await enableAch(stripe, { dry });
    const webhook = await addWebhookEvents(stripe, { dry });
    const links = await applyAch(stripe, foundersLinks(pricing.registry), { dry });
    return json(200, { dry, ach, webhook, links });
  } catch (err) {
    return json(500, { error: err.message });
  }
};
