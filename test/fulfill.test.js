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
