const test = require('node:test');
const assert = require('node:assert/strict');
const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const pricing = require('../netlify/functions/lib/pricing');
const { handler } = require('../netlify/functions/members-wall');

test.beforeEach(() => fakeStore.reset());

test('Membership Legacy Wall: named members by highest standing ever, never removed, no numbers', async () => {
  const partner = pricing.registry.partnerships[0];
  await fulfillCheckoutSession({ id: 'cs_p', customer_details: { email: 'p@example.com', name: 'Partner Co.' } }, [partner.stripe_price_id]);
  const r = await fulfillCheckoutSession({ id: 'cs_s', customer_details: { email: 's@example.com', name: 'Shopper' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  await fulfillCheckoutSession({ id: 'cs_t', livemode: false, customer_details: { email: 't@example.com', name: 'Owner Test' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  await fulfillCheckoutSession({ id: 'cs_n', customer_details: { email: 'n@example.com' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  // a lapsed term never removes anyone
  r.record.memberships = {};
  const body = JSON.parse((await handler({ httpMethod: 'GET' })).body);
  const by = Object.fromEntries(body.groups.map((g) => [g.key, g.members.map((m) => m.displayName)]));
  assert.deepEqual(by.llab, ['Shopper']);
  assert.ok(!('partnership' in by), 'Partners have their own wall');
  const pw = JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { wall: 'partnership' } })).body);
  assert.equal(pw.groups[0].label, 'Omnidirectional Partners', 'highest tier first');
  assert.deepEqual(pw.groups.find((g) => g.key === partner.key).members.map((m) => m.displayName), ['Partner Co.']);
  const fs = require('fs');
  assert.ok(fs.readFileSync('pages/products.html', 'utf8').includes('data-wall="llab"'));
  assert.ok(fs.readFileSync('pages/partnership.html', 'utf8').includes('data-wall="partnership"'));
  assert.ok(!JSON.stringify(body).includes('Owner Test'));
  assert.ok(!/[A-Z]+-\d{5}/.test(JSON.stringify(body)), 'no Member Numbers on the wall');
  assert.ok(!JSON.stringify(body).includes('@'), 'no emails');
});

test('every member has a permanent Member Number and standing on their card', async () => {
  const { buildAccountView } = require('../netlify/functions/lib/account-view');
  const r = await fulfillCheckoutSession({ id: 'cs_c', customer_details: { email: 'card@example.com', name: 'Card Holder' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  const view = buildAccountView(r.record);
  assert.match(view.memberId, /^[A-Z]+-\d{5}$/);
  assert.equal(view.memberStanding.label, '.LLab Members');
  assert.ok(view.memberSince);
});

test('after a purchase, a member can link their wall name to their website; free members cannot', async () => {
  const { cleanWallUrl, canLinkOnWall } = require('../netlify/functions/lib/wall-link');
  assert.equal(cleanWallUrl('yourcompany.com'), 'https://yourcompany.com/');
  assert.equal(cleanWallUrl('http://a.co/x'), 'https://a.co/x');
  assert.equal(cleanWallUrl(''), null);
  for (const bad of ['javascript:alert(1)', 'not a site', 'https://user:pw@a.co', 'ftp://a.co']) assert.ok(cleanWallUrl(bad) && cleanWallUrl(bad).error, bad);
  assert.equal(canLinkOnWall({ signupSource: 'free', emailVerified: true }), false);
  const r = await fulfillCheckoutSession({ id: 'cs_ad', customer_details: { email: 'ad@example.com', name: 'Ad Co.' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  assert.equal(canLinkOnWall(r.record), true);
  r.record.wallUrl = 'https://adco.example/';
  const body = JSON.parse((await handler({ httpMethod: 'GET' })).body);
  assert.equal(body.groups.find((g) => g.key === 'llab').members[0].url, 'https://adco.example/');
});
