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


test('fixed founding levels record what was paid, and upgrades add up', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const email = 'paid@example.com';
  await fulfillCheckoutSession({ id: 'cs_1', customer_details: { email } }, [pricing.entryForKey('friends-family').stripe_price_id]);
  const r = await fulfillCheckoutSession({ id: 'cs_2', customer_details: { email } }, [pricing.entryForKey('founder').stripe_price_id]);
  assert.equal(r.record.founder.paid, 370);
  assert.equal(pricing.founderPartnershipCredit(r.record), 370);
});



const give = (id, cents, email, extra = {}) => fulfillCheckoutSession({ id, amount_total: cents, customer_details: { email, ...(extra.name ? { name: extra.name } : {}) }, metadata: { purpose: 'founder_give', key: 'founder-give', direct_to: extra.direct || '' }, custom_fields: extra.wall ? [{ key: 'wall_name', type: 'text', text: { value: extra.wall } }] : [] }, ['price_inline_' + id]);

test('every giver becomes a Founder at any amount, at the giving level their total reaches', async () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const r1 = await give('g1', 500, 'five@example.com', { wall: 'Five Dollar Co.' });
  assert.equal(r1.record.founder.level, 'omnidirectional-founder');
  assert.equal(r1.record.founder.levelLabel, 'Omnidirectional Founder');
  assert.equal(r1.record.founder.name, 'Five Dollar Co.');
  assert.ok(r1.record.founder.founderNumber);
  const r2 = await give('g2', 50000, 'five@example.com', { direct: 'nonprofits' });
  assert.equal(r2.record.founder.level, 'patron-founder', '$5 + $500 reaches Patron Founder');
  assert.ok(r2.grantedKeys.includes('legacy-profile'));
  assert.equal(r2.record.founder.paid, 505);
  assert.equal(r2.record.contributions.at(-1).node, 'Nonprofits');
  assert.equal(pricing.founderPartnershipCredit(r2.record), 505);
});

test('giving levels: twelve, lowest first, circles above Legacy Founder', () => {
  const pricing = require('../netlify/functions/lib/pricing');
  const levels = pricing.givingLevels();
  assert.equal(levels.length, 12);
  assert.deepEqual([1, 20, 50, 100, 250, 350, 500, 1000, 2500, 5000, 10000, 25000], levels.map((l) => l.min));
  assert.equal(pricing.founderLevelForAmount(30000), 'visionary-circle');
  assert.equal(pricing.founderLevelLabelForKey('legacy-founder'), 'Legacy Founder');
  for (let i = 1; i < levels.length; i++) assert.ok(levels[i].rank > levels[i - 1].rank, levels[i].key);
});

test('give.js validates the amount and the Omnidirectional area', () => {
  const { parseGift } = require('../netlify/functions/give');
  assert.ok(parseGift({ amount: '0.5' }).error);
  assert.ok(parseGift({ amount: 'abc' }).error);
  assert.equal(parseGift({ amount: '$2,500' }).level, 'benefactor-circle');
  assert.equal(parseGift({ amount: '75', direct: 'Knowledge + IP' }).node, 'Knowledge + IP');
  assert.equal(parseGift({ amount: '75', direct: 'nowhere' }).node, null);
  assert.equal(parseGift({ amount: '12.345' }).cents, 1235);
});
