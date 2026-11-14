const test = require('node:test');
const assert = require('node:assert/strict');

// Inject the in-memory fake store in place of the real (Netlify Blobs backed)
// store before fulfill.js resolves its `require('./store')` — see
// test/lib/fake-store.js for why (no real Blobs connection outside Netlify).
const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { fulfillCheckoutSession, revokeMembership, reactivateMembership } = require('../netlify/functions/lib/fulfill');

test.beforeEach(() => fakeStore.reset());

test('one-time product purchase grants exactly that product', async () => {
  const session = {
    id: 'cs_test_1',
    customer_details: { email: 'buyer@example.com' },
    customer: 'cus_1',
    amount_total: 2000,
    currency: 'usd',
  };
  const result = await fulfillCheckoutSession(session, ['price_1U31dIAK6n3ctuR9P3oaWUqY']); // strength-map
  assert.deepEqual(result.grantedKeys, ['strength-map']);
  assert.deepEqual(result.record.entitlements, ['strength-map']);
  assert.equal(result.record.stripeCustomerId, 'cus_1');
});

test('membership purchase grants membership + bonus roadmap, unlocking full catalog', async () => {
  const session = {
    id: 'cs_test_2',
    customer_details: { email: 'member@example.com' },
    customer: 'cus_2',
    subscription: 'sub_2',
    amount_total: 15000,
    currency: 'usd',
  };
  const result = await fulfillCheckoutSession(session, ['price_1T1PADAK6n3ctuR9GdRPng9w']); // membership monthly
  assert.ok(result.record.entitlements.includes('membership'));
  assert.ok(result.record.entitlements.includes('infrastructure-roadmap'));
  assert.equal(result.record.memberships.membership.status, 'active');
  assert.equal(result.record.memberships.membership.interval, 'month');
});

test('repeat purchase by the same email reuses the same account/token', async () => {
  const email = 'repeat@example.com';
  const s1 = { id: 'cs_a', customer_details: { email }, customer: 'cus_a' };
  const s2 = { id: 'cs_b', customer_details: { email }, customer: 'cus_a' };
  const r1 = await fulfillCheckoutSession(s1, ['price_1U31dIAK6n3ctuR9P3oaWUqY']);
  const r2 = await fulfillCheckoutSession(s2, ['price_1U34ZvAK6n3ctuR9qPF3Csx4']);
  assert.equal(r1.token, r2.token);
  assert.deepEqual(new Set(r2.record.entitlements), new Set(['strength-map', 'alignment-map']));
});

test('unknown price id in a session is skipped, not fatal', async () => {
  const session = { id: 'cs_test_3', customer_details: { email: 'x@example.com' } };
  const result = await fulfillCheckoutSession(session, ['price_unrelated_product']);
  assert.deepEqual(result.grantedKeys, []);
});

test('revoking a membership removes it and its bonus grant', async () => {
  const session = {
    id: 'cs_test_4',
    customer_details: { email: 'cancels@example.com' },
    subscription: 'sub_4',
  };
  const { token } = await fulfillCheckoutSession(session, ['price_1UD4FWAK6n3ctuR9qqTP6ONI']); // library-card monthly
  let record = await fakeStore.getCustomerByToken(token);
  assert.ok(record.entitlements.includes('infrastructure-roadmap'));

  record = await revokeMembership(token, 'library-card');
  assert.equal(record.memberships['library-card'].status, 'canceled');
  assert.ok(!record.entitlements.includes('library-card'));
  assert.ok(!record.entitlements.includes('infrastructure-roadmap'));
});

test('reactivating a membership restores its bonus grant', async () => {
  const session = { id: 'cs_test_5', customer_details: { email: 'reactivate@example.com' }, subscription: 'sub_5' };
  const { token } = await fulfillCheckoutSession(session, ['price_1UD4FWAK6n3ctuR9qqTP6ONI']);
  await revokeMembership(token, 'library-card');
  const record = await reactivateMembership(token, 'library-card');
  assert.equal(record.memberships['library-card'].status, 'active');
  assert.ok(record.entitlements.includes('library-card'));
  assert.ok(record.entitlements.includes('infrastructure-roadmap'));
});

test('a bonus grant shared by two memberships survives cancelling just one', async () => {
  const email = 'both@example.com';
  const s1 = { id: 'cs_both_1', customer_details: { email }, subscription: 'sub_m' };
  const s2 = { id: 'cs_both_2', customer_details: { email }, subscription: 'sub_l' };
  const r1 = await fulfillCheckoutSession(s1, ['price_1T1PADAK6n3ctuR9GdRPng9w']); // membership
  await fulfillCheckoutSession(s2, ['price_1UD4FWAK6n3ctuR9qqTP6ONI']); // library-card

  const afterCancel = await revokeMembership(r1.token, 'library-card');
  assert.ok(afterCancel.entitlements.includes('membership'));
  assert.ok(afterCancel.entitlements.includes('infrastructure-roadmap'), 'roadmap should survive: membership still active');
  assert.ok(!afterCancel.entitlements.includes('library-card'));
});

test('Founder levels include their free .LLab product; Community levels do not', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const priceOf = (k) => pricing.entryForKey(k).stripe_price_id;
  const cases = { founder: ['legacy-profile'], 'legacy-founder': ['legacy-map'], 'friends-family': [], 'premium-friends-family': [] };
  for (const [tier, free] of Object.entries(cases)) {
    fakeStore.reset();
    const r = await fulfillCheckoutSession({ id: `cs_${tier}`, customer_details: { email: `${tier}@example.com` } }, [priceOf(tier)]);
    assert.deepEqual(r.grantedKeys, [tier, ...free], tier);
    assert.ok(r.record.founder && r.record.founder.founderNumber, `${tier} gets a Founder Number`);
  }
});

test('a Partnership bought with the Founder credit marks the credit used', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const email = 'credit@example.com';
  await fulfillCheckoutSession({ id: 'cs_f', customer_details: { email } }, [pricing.entryForKey('legacy-founder').stripe_price_id]);
  const tier = pricing.registry.partnerships[0];
  const r = await fulfillCheckoutSession({ id: 'cs_p', customer_details: { email }, metadata: { founder_partnership_credit: '1000' } }, [tier.stripe_price_id]);
  assert.equal(r.record.founder.partnershipCreditUsed.amount, 1000);
  assert.equal(pricing.founderPartnershipCredit(r.record), 0);
});

test('a chosen founding amount is recognized at the level it reaches and credited in full', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const entry = pricing.entryForKey('founder-your-amount');
  assert.ok(entry && entry.custom_amount);
  assert.equal(pricing.founderLevelForAmount(20), 'friends-family');
  assert.equal(pricing.founderLevelForAmount(349), 'premium-friends-family');
  assert.equal(pricing.founderLevelForAmount(500), 'founder');
  assert.equal(pricing.founderLevelForAmount(2500), 'legacy-founder');
  // Simulate the Stripe price the owner's setup creates, then restore.
  const raw = pricing.registry.products.find((p) => p.key === 'founder-your-amount');
  raw.stripe_price_id = 'price_test_custom';
  pricing._resetIndex();
  let r;
  try {
    r = await fulfillCheckoutSession({ id: 'cs_custom', amount_total: 250000, customer_details: { email: 'custom@example.com' } }, ['price_test_custom']);
  } finally {
    delete raw.stripe_price_id;
    pricing._resetIndex();
  }
  assert.equal(r.record.founder.level, 'legacy-founder');
  assert.ok(r.grantedKeys.includes('legacy-map'));
  assert.equal(pricing.founderPartnershipCredit(r.record), 2500);
});

test('fixed founding levels record what was paid, and upgrades add up', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const email = 'paid@example.com';
  await fulfillCheckoutSession({ id: 'cs_1', customer_details: { email } }, [pricing.entryForKey('friends-family').stripe_price_id]);
  const r = await fulfillCheckoutSession({ id: 'cs_2', customer_details: { email } }, [pricing.entryForKey('founder').stripe_price_id]);
  assert.equal(r.record.founder.paid, 370);
  assert.equal(pricing.founderPartnershipCredit(r.record), 370);
});

test('a Founder Contribution of any amount adds to the credit, can raise the level, and records its Omnidirectional area', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const email = 'contrib@example.com';
  await fulfillCheckoutSession({ id: 'cs_c1', customer_details: { email } }, [pricing.entryForKey('founder').stripe_price_id]);
  const raw = pricing.registry.products.find((p) => p.key === 'founder-contribution');
  raw.stripe_price_id = 'price_test_contrib';
  pricing._resetIndex();
  let r;
  try {
    r = await fulfillCheckoutSession({
      id: 'cs_c2', amount_total: 70000, customer_details: { email },
      custom_fields: [{ key: 'direct_to', type: 'dropdown', dropdown: { value: 'nonprofits' } }],
    }, ['price_test_contrib']);
  } finally {
    delete raw.stripe_price_id;
    pricing._resetIndex();
  }
  assert.equal(r.record.founder.paid, 1050);
  assert.equal(r.record.founder.level, 'legacy-founder', '$350 + $700 reaches Legacy Founder');
  assert.ok(r.grantedKeys.includes('legacy-map'));
  assert.deepEqual(r.record.contributions.map((c) => [c.amount, c.node]), [[700, 'Nonprofits']]);
  assert.equal(pricing.founderPartnershipCredit(r.record), 1050);
});

test('anyone can give any amount and is recognized as an Omnidirectional Benefactor; $20+ total makes them a Founder', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const raw = pricing.registry.products.find((p) => p.key === 'founder-contribution');
  raw.stripe_price_id = 'price_test_give';
  pricing._resetIndex();
  try {
    const email = 'giver@example.com';
    const r1 = await fulfillCheckoutSession({ id: 'cs_g1', amount_total: 500, customer_details: { email, name: 'A Giver' } }, ['price_test_give']);
    assert.ok(!r1.record.founder);
    assert.equal(r1.record.benefactor.total, 5);
    assert.deepEqual((await fakeStore.listBenefactors()).map((b) => b.name), ['A Giver']);
    const r2 = await fulfillCheckoutSession({ id: 'cs_g2', amount_total: 2000, customer_details: { email } }, ['price_test_give']);
    assert.equal(r2.record.founder.level, 'friends-family', '$5 + $20 reaches Community Founder');
    assert.equal((await fakeStore.listBenefactors()).length, 0, 'now shown as a Founder instead');
  } finally {
    delete raw.stripe_price_id;
    pricing._resetIndex();
  }
});
