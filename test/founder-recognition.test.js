const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const pricing = require('../netlify/functions/lib/pricing');
const { _shouldApplyFounderDiscount: shouldApplyFounderDiscount } = require('../netlify/functions/checkout-create');

const FOUNDER_PRICE = 'price_1TjpMwAK6n3ctuR9UEPmFzwk'; // founder ($350)
const LEGACY_FOUNDER_PRICE = 'price_1TjpktAK6n3ctuR9GTGot6Be'; // legacy-founder ($1,000)
const STRENGTH_MAP_PRICE = 'price_1U31dIAK6n3ctuR9P3oaWUqY'; // ordinary one-time product

test.beforeEach(() => fakeStore.reset());

test('pricing.js exposes all four Founder levels, ordered bottom to top', () => {
  const keys = pricing.founderTierKeys();
  assert.deepEqual(keys, ['friends-family', 'premium-friends-family', 'founder', 'legacy-founder']);
  assert.equal(pricing.founderLevelLabelForKey('friends-family'), 'Friends & Family');
  assert.equal(pricing.founderLevelLabelForKey('premium-friends-family'), 'Premium Friends & Family');
  assert.equal(pricing.founderLevelLabelForKey('founder'), 'Founder');
  assert.equal(pricing.founderLevelLabelForKey('legacy-founder'), 'Legacy Founder');
  assert.ok(pricing.founderRankForKey('premium-friends-family') > pricing.founderRankForKey('friends-family'));
  assert.ok(pricing.founderRankForKey('founder') > pricing.founderRankForKey('premium-friends-family'));
  assert.ok(pricing.founderRankForKey('legacy-founder') > pricing.founderRankForKey('founder'));
  assert.equal(pricing.isFounderDiscountExempt('friends-family'), true);
  assert.equal(pricing.isFounderDiscountExempt('premium-friends-family'), true);
  assert.equal(pricing.isFounderDiscountExempt('founder'), true);
  assert.equal(pricing.isFounderDiscountExempt('legacy-founder'), true);
  assert.equal(pricing.isFounderDiscountExempt('strength-map'), false);
});

test('a Founder purchase assigns a sequential Founder Number and recognizes the level', async () => {
  const session = {
    id: 'cs_founder_1',
    customer_details: { email: 'founder1@example.com', name: 'Ada Founder' },
    customer: 'cus_f1',
    amount_total: 35000,
    currency: 'usd',
  };
  const result = await fulfillCheckoutSession(session, [FOUNDER_PRICE]);
  assert.ok(result.record.founder);
  assert.equal(result.record.founder.founderNumber, 'F-00001');
  assert.equal(result.record.founder.level, 'founder');
  assert.equal(result.record.founder.levelLabel, 'Founder');
  assert.equal(result.record.founder.name, 'Ada Founder');
  assert.ok(result.record.founder.recognizedAt);
});

test('Founder Numbers are unique and sequential across different Founders', async () => {
  const s1 = { id: 'cs_f_a', customer_details: { email: 'a@example.com' }, amount_total: 35000 };
  const s2 = { id: 'cs_f_b', customer_details: { email: 'b@example.com' }, amount_total: 100000 };
  const r1 = await fulfillCheckoutSession(s1, [FOUNDER_PRICE]);
  const r2 = await fulfillCheckoutSession(s2, [LEGACY_FOUNDER_PRICE]);
  assert.equal(r1.record.founder.founderNumber, 'F-00001');
  assert.equal(r2.record.founder.founderNumber, 'F-00002');
  assert.notEqual(r1.record.founder.founderNumber, r2.record.founder.founderNumber);
});

test('a later, higher Founder tier upgrades the level but keeps the same Founder Number and original recognition date', async () => {
  const email = 'upgrader@example.com';
  const s1 = { id: 'cs_up_1', customer_details: { email }, amount_total: 35000 };
  const r1 = await fulfillCheckoutSession(s1, [FOUNDER_PRICE]);
  const originalNumber = r1.record.founder.founderNumber;
  const originalRecognizedAt = r1.record.founder.recognizedAt;
  assert.equal(r1.record.founder.level, 'founder');

  const s2 = { id: 'cs_up_2', customer_details: { email }, amount_total: 100000 };
  const r2 = await fulfillCheckoutSession(s2, [LEGACY_FOUNDER_PRICE]);
  assert.equal(r2.record.founder.founderNumber, originalNumber, 'Founder Number must be permanent');
  assert.equal(r2.record.founder.recognizedAt, originalRecognizedAt, 'original recognition date must not change');
  assert.equal(r2.record.founder.level, 'legacy-founder', 'level upgrades to the higher tier');
  assert.deepEqual(r2.record.founder.levels, ['founder', 'legacy-founder']);
});

test('a non-Founder purchase never creates Founder recognition', async () => {
  const session = { id: 'cs_ordinary', customer_details: { email: 'ordinary@example.com' }, amount_total: 2000 };
  const result = await fulfillCheckoutSession(session, [STRENGTH_MAP_PRICE]);
  assert.equal(result.record.founder, null);
});

test('checkout-create: Founder discount applies only to signed-in Founders, never to non-Founders', () => {
  const founderRecord = { founder: { founderNumber: 'F-00001', level: 'founder' } };
  const nonFounderRecord = { founder: null };
  assert.equal(shouldApplyFounderDiscount(founderRecord, 'strength-map'), true);
  assert.equal(shouldApplyFounderDiscount(nonFounderRecord, 'strength-map'), false);
  assert.equal(shouldApplyFounderDiscount(null, 'strength-map'), false, 'guest checkout never gets the discount');
});

test('checkout-create: the discount never retroactively applies to the Founder tiers themselves (no stacking on the qualifying purchase)', () => {
  const founderRecord = { founder: { founderNumber: 'F-00001', level: 'founder' } };
  assert.equal(shouldApplyFounderDiscount(founderRecord, 'founder'), false);
  assert.equal(shouldApplyFounderDiscount(founderRecord, 'legacy-founder'), false);
});

test('Founder recognition list groups by level and orders by Founder Number, with no email exposed', async () => {
  const s1 = { id: 'cs_list_1', customer_details: { email: 'first@example.com', name: 'First Founder' }, amount_total: 35000 };
  const s2 = { id: 'cs_list_2', customer_details: { email: 'second@example.com' }, amount_total: 100000 };
  await fulfillCheckoutSession(s1, [FOUNDER_PRICE]);
  await fulfillCheckoutSession(s2, [LEGACY_FOUNDER_PRICE]);

  const founders = await fakeStore.listFounders();
  assert.equal(founders.length, 2);
  founders.forEach((f) => assert.equal('email' in f, false));

  const byLevel = pricing.founderTierKeys().map((key) => ({
    level: key,
    entries: founders.filter((f) => f.level === key).sort((a, b) => (a.founderNumber < b.founderNumber ? -1 : 1)),
  }));
  assert.equal(byLevel.find((g) => g.level === 'founder').entries.length, 1);
  assert.equal(byLevel.find((g) => g.level === 'legacy-founder').entries.length, 1);
  assert.equal(byLevel.find((g) => g.level === 'founder').entries[0].name, 'First Founder');
});

test('re-fulfilling the same Founder session twice (webhook + verify-session race) is idempotent', async () => {
  const session = { id: 'cs_race', customer_details: { email: 'race@example.com' }, amount_total: 35000 };
  const r1 = await fulfillCheckoutSession(session, [FOUNDER_PRICE]);
  const r2 = await fulfillCheckoutSession(session, [FOUNDER_PRICE]);
  assert.equal(r1.record.founder.founderNumber, r2.record.founder.founderNumber);
  assert.deepEqual(r2.record.founder.levels, ['founder']);
});

test('paymentLinkMap resolves the real Founders Organization payment links to the correct keys', () => {
  const map = pricing.paymentLinkMap();
  assert.equal(map['https://buy.stripe.com/bJedR82Iu0FD7tFfpk9ws15'].key, 'friends-family');
  assert.equal(map['https://buy.stripe.com/3cI14m6YK2NL9BNelg9ws16'].key, 'premium-friends-family');
  assert.equal(map['https://buy.stripe.com/dRm9AS1Eq1JH7tF90W9ws0h'].key, 'founder');
  assert.equal(map['https://buy.stripe.com/5kQ7sK3My3RP15helg9ws0i'].key, 'legacy-founder');
});

test('a Friends & Family purchase recognizes the purchaser at the bottom Founder tier', async () => {
  const session = {
    id: 'cs_ff_1',
    customer_details: { email: 'ff1@example.com', name: 'Fran Friend' },
    amount_total: 2000,
    currency: 'usd',
  };
  const result = await fulfillCheckoutSession(session, ['price_1UFiCZAK6n3ctuR9t5qojYuv']);
  assert.ok(result.record.founder);
  assert.equal(result.record.founder.level, 'friends-family');
  assert.equal(result.record.founder.levelLabel, 'Friends & Family');
});
