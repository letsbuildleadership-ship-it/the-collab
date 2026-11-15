const test = require('node:test');
const assert = require('node:assert');
const pricing = require('../netlify/functions/lib/pricing');
const { foundersLinks, applyAch } = require('../netlify/functions/admin-founders-ach');

test('Founders Organization keys are ACH only; other products are not', () => {
  assert.deepEqual(pricing.FOUNDERS_PAYMENT_METHODS, ['us_bank_account']);
  for (const k of ['founder-give', 'founder', 'legacy-founder', 'friends-family', 'premium-friends-family']) assert.ok(pricing.isFoundersKey(k), k);
  assert.ok(!pricing.isFoundersKey('strength-map'));
});

test('admin-founders-ach updates only Founders Payment Links, and dry runs change nothing', async () => {
  const targets = foundersLinks(pricing.registry);
  assert.ok(targets.length >= 4 && targets.every((t) => pricing.isFoundersKey(t.key)));
  const updates = [];
  const links = [...targets.map((t, i) => ({ id: `plink_${i}`, url: t.url, payment_method_types: null })), { id: 'plink_other', url: 'https://buy.stripe.com/other' }];
  const stripe = { paymentLinks: { list: async () => ({ data: links, has_more: false }), update: async (id, p) => updates.push([id, p]) } };
  const dry = await applyAch(stripe, targets, { dry: true });
  assert.equal(updates.length, 0);
  assert.ok(dry.every((r) => r.status === 'would_update'));
  await applyAch(stripe, targets);
  assert.equal(updates.length, targets.length);
  assert.ok(updates.every(([id, p]) => id !== 'plink_other' && p.payment_method_types[0] === 'us_bank_account'));
});
