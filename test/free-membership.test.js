const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const { verifyPassword } = require('../netlify/functions/lib/password');
const { buildAccountView } = require('../netlify/functions/lib/account-view');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const signup = require('../netlify/functions/signup');
const admin = require('../netlify/functions/admin-customers');

const post = (body) => signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

test.beforeEach(() => fakeStore.reset());

test('free sign-up creates a free member with a password and signs them in', async () => {
  const res = await post({ email: 'New@Example.com', password: 'free-pass-1', name: 'Rae' });
  assert.equal(res.statusCode, 201);
  assert.match(res.headers['Set-Cookie'], /collab_token=/);
  const view = JSON.parse(res.body);
  assert.equal(view.memberType, 'free');
  assert.equal(view.freeTools.length, 16);
  assert.ok(view.membershipOffer && view.membershipOffer.plans.length);
  assert.ok(view.locked.length > 0 && view.locked.every((l) => l.price_display && l.payment_link));
  const token = await fakeStore.getTokenByEmail('new@example.com');
  const record = await fakeStore.getCustomerByToken(token);
  assert.equal(record.signupSource, 'free');
  assert.ok(verifyPassword('free-pass-1', record.passwordHash));
});

test('sign-up never takes over an existing account', async () => {
  await fakeStore.getOrCreateCustomerByEmail('buyer@example.com');
  const res = await post({ email: 'buyer@example.com', password: 'whatever-123' });
  assert.equal(res.statusCode, 409);
  assert.equal(JSON.parse(res.body).exists, true);
});

test('sign-up validates email and password length', async () => {
  assert.equal((await post({ email: 'nope', password: 'long-enough' })).statusCode, 400);
  assert.equal((await post({ email: 'a@b.co', password: 'short' })).statusCode, 400);
});

test('a free member who buys becomes a member; Membership hides the offer and snapshots', async () => {
  await post({ email: 'grow@example.com', password: 'free-pass-1' });
  const product = pricing.registry.products.find((p) => p.key === 'strength-map');
  let r = await fulfillCheckoutSession({ id: 'cs_a', customer_details: { email: 'grow@example.com' }, amount_total: 1 }, [product.stripe_price_id]);
  let view = buildAccountView(r.record);
  assert.equal(view.memberType, 'member');
  assert.ok(view.owned.some((o) => o.key === 'strength-map'));
  assert.ok(!view.locked.some((l) => l.key === 'strength-map'));
  assert.ok(view.membershipOffer);
  const plan = pricing.registry.memberships.find((m) => m.key === 'membership').plans[0];
  r = await fulfillCheckoutSession({ id: 'cs_b', customer_details: { email: 'grow@example.com' }, subscription: 'sub_x', amount_total: 1 }, [plan.stripe_price_id]);
  view = buildAccountView(r.record);
  assert.equal(view.membershipOffer, null);
  assert.equal(view.locked.length, 0);
  assert.equal(view.freeTools.length, 16);
});

test('admin list counts free and paying members', async () => {
  process.env.ADMIN_TOKEN = 'test-admin';
  await post({ email: 'f1@example.com', password: 'free-pass-1' });
  await post({ email: 'f2@example.com', password: 'free-pass-1' });
  const product = pricing.registry.products.find((p) => p.key === 'strength-map');
  await fulfillCheckoutSession({ id: 'cs_c', customer_details: { email: 'paid@example.com' }, amount_total: 1 }, [product.stripe_price_id]);
  const res = await admin.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'test-admin' }, queryStringParameters: {} });
  const { stats, customers } = JSON.parse(res.body);
  assert.deepEqual(stats, { total: 3, free: 2, paying: 1, joinedFree: 2 });
  assert.equal(customers.filter((c) => c.free).length, 2);
  delete process.env.ADMIN_TOKEN;
});

test('Founders snapshots are never marked as included with Membership', async () => {
  const res = await post({ email: 'look@example.com', password: 'free-pass-1' });
  const view = JSON.parse(res.body);
  const founders = view.locked.filter((l) => pricing.founderRankForKey(l.key));
  assert.ok(founders.length > 0);
  assert.ok(founders.every((l) => l.includedWithMembership === false));
  assert.ok(view.locked.filter((l) => !pricing.founderRankForKey(l.key)).every((l) => l.includedWithMembership));
});
