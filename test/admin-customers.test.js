const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const membershipStatus = require('../netlify/functions/lib/membership-status');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const { grantKey, revokeKey, grantableKeys } = require('../netlify/functions/lib/admin-grants');
const admin = require('../netlify/functions/admin-customers');

const ADMIN = 'test-admin-token';
const get = (q = {}) => admin.handler({ httpMethod: 'GET', headers: { 'x-admin-token': ADMIN }, queryStringParameters: q });
const post = (body) => admin.handler({ httpMethod: 'POST', headers: { 'x-admin-token': ADMIN }, body: JSON.stringify(body) });

test.beforeEach(() => {
  fakeStore.reset();
  process.env.ADMIN_TOKEN = ADMIN;
});

test('admin list loads customers through the shared store, with a partnership summary', async () => {
  await fulfillCheckoutSession({ id: 'cs_a1', customer_details: { email: 'plain@example.com' } }, ['price_1U31dIAK6n3ctuR9P3oaWUqY']);
  await fulfillCheckoutSession(
    { id: 'cs_a2', customer_details: { email: 'partner@example.com' }, created: Math.floor(Date.now() / 1000) },
    ['price_1UP1xlAK6n3ctuR9EFyv5jVx']
  );
  const res = await get();
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.customers.length, 2);
  const partner = data.customers.find((c) => c.email === 'partner@example.com');
  assert.equal(partner.partnership.tierLabel, 'Partner');
  assert.equal(partner.partnership.status, 'active');
  assert.equal(data.customers.find((c) => c.email === 'plain@example.com').partnership, null);
});

test('grant list includes memberships, Blueprint issues and bonus items, not partnerships', () => {
  const keys = grantableKeys().map((g) => g.key);
  for (const k of ['membership', 'library-card', 'journal', 'blueprint-complete', 'infrastructure-roadmap', 'strength-map']) {
    assert.ok(keys.includes(k), k);
  }
  assert.ok(!keys.some((k) => k.startsWith('partnership-')));
});

test('granting a membership by hand makes it actually active (catalog + bonus)', async () => {
  const { token } = await fulfillCheckoutSession({ id: 'cs_g1', customer_details: { email: 'comp@example.com' } }, ['price_1U31dIAK6n3ctuR9P3oaWUqY']);
  const res = await post({ action: 'grant', token, key: 'membership' });
  assert.equal(res.statusCode, 200);
  const record = await fakeStore.getCustomerByToken(token);
  assert.ok(membershipStatus.isMembershipActive(record.memberships.membership));
  assert.equal(record.memberships.membership.source, 'admin');
  assert.ok(membershipStatus.hasFullCatalog(record));
  assert.ok(record.entitlements.includes('infrastructure-roadmap'));
});

test('granting a Library Card by hand opens the Legacy Library', async () => {
  const library = require('../netlify/functions/library');
  const { token } = await fulfillCheckoutSession({ id: 'cs_g2', customer_details: { email: 'lib@example.com' } }, ['price_1U31dIAK6n3ctuR9P3oaWUqY']);
  const ev = { httpMethod: 'GET', headers: {}, queryStringParameters: { token } };
  assert.equal((await library.handler(ev)).statusCode, 403);
  await post({ action: 'grant', token, key: 'library-card' });
  assert.equal((await library.handler(ev)).statusCode, 200);
});

test('granting a membership never overwrites an active paid subscription', () => {
  const record = {
    entitlements: ['membership'],
    memberships: { membership: { status: 'active', interval: 'month', subscriptionId: 'sub_1', currentPeriodEnd: null } },
  };
  grantKey(record, 'membership');
  assert.equal(record.memberships.membership.subscriptionId, 'sub_1');
});

test('revoking a subscribed membership warns that Stripe is still billing', () => {
  const record = {
    entitlements: ['membership', 'infrastructure-roadmap'],
    memberships: { membership: { status: 'active', interval: 'month', subscriptionId: 'sub_9', currentPeriodEnd: null } },
  };
  const { warning } = revokeKey(record, 'membership');
  assert.match(warning, /sub_9/);
  assert.ok(!record.entitlements.includes('membership'));
  assert.ok(!record.entitlements.includes('infrastructure-roadmap'));
});

test('revoking one membership keeps a bonus another still provides', () => {
  const record = { entitlements: [], memberships: {} };
  grantKey(record, 'membership');
  grantKey(record, 'library-card');
  revokeKey(record, 'membership');
  assert.ok(record.entitlements.includes('infrastructure-roadmap'));
});

test('admin endpoint rejects requests without the admin token', async () => {
  const res = await admin.handler({ httpMethod: 'GET', headers: {}, queryStringParameters: {} });
  assert.equal(res.statusCode, 401);
});

test('admin list shows a lapsed partnership membership as expired', async () => {
  await fulfillCheckoutSession(
    { id: 'cs_x1', customer_details: { email: 'lapsed@example.com' }, created: Math.floor(Date.UTC(2024, 0, 1) / 1000) },
    ['price_1UP1xlAK6n3ctuR9EFyv5jVx']
  );
  const c = JSON.parse((await get()).body).customers[0];
  assert.equal(c.memberships.membership.status, 'expired');
  assert.equal(c.partnership.status, 'ended');
});
