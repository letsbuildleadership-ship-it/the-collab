const test = require('node:test');
const assert = require('node:assert');
const pricing = require('../netlify/functions/lib/pricing');
const { foundersLinks, applyAch, enableAch, addWebhookEvents } = require('../netlify/functions/admin-founders-ach');

test('Founders keys are recognized and pay like Partnerships (no payment method override)', () => {
  assert.equal(pricing.FOUNDERS_PAYMENT_METHODS, undefined);
  for (const k of ['founder-give', 'founder', 'legacy-founder', 'friends-family', 'premium-friends-family']) assert.ok(pricing.isFoundersKey(k), k);
  assert.ok(!pricing.isFoundersKey('strength-map'));
});

test('admin-founders-ach updates only Founders Payment Links, and dry runs change nothing', async () => {
  const targets = foundersLinks(pricing.registry);
  assert.ok(targets.length >= 4 && targets.every((t) => pricing.isFoundersKey(t.key)));
  const updates = [];
  const links = [...targets.map((t, i) => ({ id: `plink_${i}`, url: t.url, payment_method_types: ['us_bank_account'] })), { id: 'plink_other', url: 'https://buy.stripe.com/other' }];
  const stripe = { paymentLinks: { list: async () => ({ data: links, has_more: false }), update: async (id, p) => updates.push([id, p]) } };
  const dry = await applyAch(stripe, targets, { dry: true });
  assert.equal(updates.length, 0);
  assert.ok(dry.every((r) => r.status === 'would_update'));
  await applyAch(stripe, targets);
  assert.equal(updates.length, targets.length);
  assert.ok(updates.every(([id, p]) => id !== 'plink_other' && p.payment_method_types === ''));
});

test('admin-founders-ach turns on ACH and adds the async webhook events once', async () => {
  const calls = [];
  const stripe = {
    paymentMethodConfigurations: { list: async () => ({ data: [{ id: 'pmc_1', is_default: true, parent: null, us_bank_account: { available: false } }] }), update: async (id, p) => { calls.push(['pmc', id, p]); return { us_bank_account: { available: true } }; } },
    webhookEndpoints: { list: async () => ({ data: [{ id: 'we_1', url: 'https://wearethellab.com/.netlify/functions/stripe-webhook', status: 'enabled', enabled_events: ['checkout.session.completed'] }] }), update: async (id, p) => calls.push(['we', id, p]) },
  };
  assert.equal((await enableAch(stripe, { dry: true })).status, 'would_turn_on');
  assert.equal((await addWebhookEvents(stripe, { dry: true })).status, 'would_add');
  assert.equal(calls.length, 0);
  assert.equal((await enableAch(stripe)).status, 'turned_on');
  const wh = await addWebhookEvents(stripe);
  assert.equal(wh.status, 'added');
  assert.deepEqual(calls.at(-1)[2].enabled_events, ['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed']);
});

test('deploy-succeeded resets ACH-only Founders links automatically', async () => {
  const { run } = require('../netlify/functions/deploy-succeeded');
  const targets = foundersLinks(pricing.registry);
  const updates = [];
  const stripe = {
    paymentMethodConfigurations: { list: async () => ({ data: [{ id: 'pmc_1', is_default: true, parent: null, us_bank_account: { available: true } }] }) },
    webhookEndpoints: { list: async () => ({ data: [] }) },
    paymentLinks: { list: async () => ({ data: targets.map((t, i) => ({ id: `plink_${i}`, url: t.url, payment_method_types: ['us_bank_account'] })), has_more: false }), update: async (id, p) => updates.push([id, p]) },
  };
  const r = await run(stripe);
  assert.equal(updates.length, targets.length);
  assert.ok(r.links.every((x) => x.status === 'updated'));
});
