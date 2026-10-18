const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const pricing = require('../netlify/functions/lib/pricing');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const { validateListing } = require('../netlify/functions/lib/directory');
const signup = require('../netlify/functions/signup');
const directory = require('../netlify/functions/directory');
const adminDirectory = require('../netlify/functions/admin-directory');

let sent = [];
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
  process.env.ADMIN_TOKEN = 'tok';
});
test.afterEach(() => { mailer._setTransportForTests(null); delete process.env.ADMIN_TOKEN; });

const good = {
  companyName: 'Harbor Studio',
  tagline: 'Brand and web for small organizations',
  description: 'We help small organizations build a clear brand and a site that lasts.',
  website: 'https://harborstudio.example.com',
  directions: ['Businesses', 'Creators'],
  offerings: [{ name: 'Brand audit', kind: 'service', description: 'A two-week review', url: 'https://harborstudio.example.com/audit' }],
};

async function freeMember(email) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'free-pass-1' }) });
  return fakeStore.getTokenByEmail(email);
}
async function paidMember(email) {
  const product = pricing.registry.products.find((p) => p.key === 'strength-map');
  await fulfillCheckoutSession({ id: `cs_${email}`, customer_details: { email }, amount_total: 1 }, [product.stripe_price_id]);
  return fakeStore.getTokenByEmail(email);
}
const call = (token, method, body, qs) => directory.handler({ httpMethod: method, headers: token ? { cookie: `collab_token=${token}` } : {}, queryStringParameters: qs || {}, body: body ? JSON.stringify(body) : undefined });
const admin = (method, body) => adminDirectory.handler({ httpMethod: method, headers: { 'x-admin-token': 'tok' }, body: body ? JSON.stringify(body) : undefined });

test('validation: https only, real hosts, needs a way to reach the company, one to three directions', () => {
  assert.ok(validateListing(good).listing);
  assert.match(validateListing({ ...good, website: 'http://x.example.com' }).error, /https/);
  assert.match(validateListing({ ...good, website: 'javascript:alert(1)' }).error, /https/);
  assert.match(validateListing({ ...good, website: 'https://127.0.0.1' }).error, /https/);
  assert.match(validateListing({ ...good, website: '', contactEmail: '' }).error, /website or a contact email/);
  assert.match(validateListing({ ...good, directions: ['Nonsense'] }).error, /direction/);
  assert.match(validateListing({ ...good, offerings: [] }).error, /product or service/);
  assert.equal(validateListing({ ...good, directions: ['Businesses', 'Creators', 'Capital', 'People'] }).listing.directions.length, 3);
});

test('listing is a paid-member benefit: free accounts cannot list, paid members can', async () => {
  const free = await freeMember('free@example.com');
  assert.equal(JSON.parse((await call(free, 'GET', null, { mine: '1' })).body).eligible, false);
  assert.equal((await call(free, 'POST', good)).statusCode, 403);
  assert.equal((await call(null, 'POST', good)).statusCode, 401);

  const paid = await paidMember('paid@example.com');
  assert.equal(JSON.parse((await call(paid, 'GET', null, { mine: '1' })).body).eligible, true);
  const r = await call(paid, 'POST', good);
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse(r.body).listing.status, 'pending');
});

test('nothing is public until approved; the public view hides account details; edits return to review', async () => {
  const paid = await paidMember('owner@example.com');
  await call(paid, 'POST', good);
  assert.equal(JSON.parse((await call(null, 'GET')).body).listings.length, 0, 'pending is hidden');

  const rows = JSON.parse((await admin('GET')).body).listings;
  assert.equal(rows.length, 1);
  assert.equal((await admin('POST', { memberId: rows[0].memberId, status: 'rejected' })).statusCode, 400, 'rejection needs a note');
  assert.equal((await admin('POST', { memberId: rows[0].memberId, status: 'approved' })).statusCode, 200);
  assert.ok(sent.some((m) => m.to === 'owner@example.com' && /listed in the Omnidirectional Enterprise/.test(m.text)));

  const pub = JSON.parse((await call(null, 'GET')).body);
  assert.equal(pub.listings.length, 1);
  const text = JSON.stringify(pub);
  assert.equal(text.includes('owner@example.com'), false);
  assert.equal(text.includes(rows[0].memberId), false);
  assert.equal(text.includes('memberId'), false);

  await call(paid, 'POST', { ...good, tagline: 'Changed tagline' });
  assert.equal(JSON.parse((await call(null, 'GET')).body).listings.length, 0, 'an edit goes back to review');

  await call(paid, 'POST', { action: 'remove' });
  assert.equal(JSON.parse((await admin('GET')).body).listings.length, 0);
});

test('the admin review page is owner-only', async () => {
  const res = await adminDirectory.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'wrong' } });
  assert.equal(res.statusCode, 401);
});
