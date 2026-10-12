const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const { buildAccountView } = require('../netlify/functions/lib/account-view');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');

const buy = (email, id, entry) => fulfillCheckoutSession({ id, customer_details: { email }, amount_total: 100 }, [entry.stripe_price_id]);
const bp = (k) => pricing.registry.blueprint_series.find((b) => b.key === k);
const prod = (k) => pricing.registry.products.find((p) => p.key === k);

test.beforeEach(() => fakeStore.reset());

test('nothing a customer owns is offered in the portal shop', async () => {
  await buy('a@example.com', 'c1', prod('creator-identity-map'));
  const r = (await buy('a@example.com', 'c2', prod('strength-map'))).record;
  const v = buildAccountView(r);
  const offered = new Set(v.locked.map((l) => l.key));
  assert.ok(!offered.has('creator-identity-map') && !offered.has('strength-map'));
  const links = new Set(v.ownedLinks.map((l) => l.href));
  assert.ok(links.has(prod('creator-identity-map').payment_link) && links.has(prod('strength-map').payment_link));
});

test('Blueprint Complete Edition covers the issues, and all issues cover the Complete Edition', async () => {
  let r = (await buy('b@example.com', 'b1', bp('blueprint-complete'))).record;
  let offered = new Set(buildAccountView(r).locked.map((l) => l.key));
  for (const b of pricing.registry.blueprint_series) assert.ok(!offered.has(b.key), b.key);

  const issues = pricing.registry.blueprint_series.filter((b) => b.key !== 'blueprint-complete');
  for (const [i, b] of issues.entries()) r = (await buy('c@example.com', `i${i}`, b)).record;
  offered = new Set(buildAccountView(r).locked.map((l) => l.key));
  assert.ok(!offered.has('blueprint-complete'));
});

test('active memberships, Founder levels at or below theirs, and their Partnership tier are marked owned', async () => {
  const plan = pricing.registry.memberships.find((m) => m.key === 'membership').plans[0];
  await fulfillCheckoutSession({ id: 'm1', customer_details: { email: 'd@example.com' }, subscription: 's1', amount_total: 1 }, [plan.stripe_price_id]);
  await buy('d@example.com', 'f1', prod('founder'));
  const r = (await buy('d@example.com', 'p1', pricing.registry.partnerships.find((t) => t.tier_label === 'Strategic'))).record;
  const v = buildAccountView(r);
  const byHref = new Map(v.ownedLinks.map((l) => [l.href, l.label]));
  assert.equal(byHref.get(plan.payment_link), 'Active');
  assert.equal(byHref.get(prod('friends-family').payment_link), 'Your Founder level');
  assert.ok(!byHref.has(prod('legacy-founder').payment_link), 'higher Founder level still offered');
  const tiers = pricing.registry.partnerships;
  assert.equal(byHref.get(tiers.find((t) => t.tier_label === 'Strategic').payment_link), 'Your Partnership');
  assert.ok(byHref.has(tiers.find((t) => t.tier_label === 'Partner').payment_link));
  assert.ok(!byHref.has(tiers.find((t) => t.tier_label === 'Enterprise').payment_link));
});

test('overlaps: a Partnership counts as Membership and its products are never offered again', async () => {
  const t = pricing.registry.partnerships.find((x) => x.tier_label === 'Strategic');
  const r = (await fulfillCheckoutSession({ id: 'ov1', customer_details: { email: 'e@example.com' }, created: Math.floor(Date.now() / 1000), amount_total: 1 }, [t.stripe_price_id])).record;
  const v = buildAccountView(r);
  assert.equal(v.membershipOffer, null);
  assert.equal(v.partnershipOffers.length, 0);
  const offered = new Set(v.locked.map((l) => l.key));
  for (const k of pricing.partnershipGrantKeysFor(t.key)) assert.ok(!offered.has(k), `granted ${k} offered`);
  for (const k of pricing.fourPhasesKeys()) assert.ok(!offered.has(k), `Four Phases ${k} offered`);
});
