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

test('joining is part of a license or Membership: free accounts cannot join, license holders can', async () => {
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
  assert.ok(sent.some((m) => m.to === 'owner@example.com' && /joined the .LLab Collaborating Companies/.test(m.text)));

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

test('member offers, skill requests and successor flags: optional, member-written, shown publicly', () => {
  const v = validateListing({ ...good, offer: { text: '10% off a brand audit for members', terms: 'Members only, through June 2027' }, requests: 'Volunteer photographers for a spring event', seeking: ['successor', 'nonsense'] });
  assert.deepEqual(v.listing.offer, { text: '10% off a brand audit for members', terms: 'Members only, through June 2027' });
  assert.deepEqual(v.listing.seeking, ['successor']);
  assert.equal(v.listing.requests, 'Volunteer photographers for a spring event');
  assert.match(validateListing({ ...good, offer: { text: 'An offer', terms: '' } }).error, /terms/);
  assert.equal(validateListing(good).listing.offer, null);
});

test('introductions: a member asks, the listed company is emailed with reply-to, only anonymous counts are kept', async () => {
  const intro = require('../netlify/functions/directory-intro');
  const a = await paidMember('a@example.com');
  const b = await paidMember('b@example.com');
  await call(a, 'POST', { ...good, offer: { text: 'A member offer', terms: 'Members only' } });
  const listed = JSON.parse((await admin('GET')).body).listings[0];
  await admin('POST', { memberId: listed.memberId, status: 'approved' });
  sent = [];
  const send = (token, body) => intro.handler({ httpMethod: 'POST', headers: token ? { cookie: `collab_token=${token}` } : {}, body: JSON.stringify(body) });
  assert.equal((await send(null, { listingId: listed.publicId, message: 'We would like to explore a partnership.' })).statusCode, 401);
  assert.equal((await send(a, { listingId: listed.publicId, message: 'We would like to explore a partnership.' })).statusCode, 400);
  assert.equal((await send(b, { listingId: listed.publicId, fromCompany: 'North Co', message: 'short' })).statusCode, 400);
  assert.equal((await send(b, { listingId: listed.publicId, fromCompany: 'North Co', message: 'We would like to explore a partnership.' })).statusCode, 200);
  assert.equal((await send(b, { listingId: listed.publicId, fromCompany: 'North Co', message: 'Tell me more about your member offer.', viaOffer: true })).statusCode, 200);
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, 'a@example.com');
  assert.equal(sent[0].replyTo, 'b@example.com');
  const eco = JSON.parse((await admin('GET')).body).ecosystem;
  const y = new Date().toISOString().slice(0, 4);
  assert.deepEqual(eco.byYear[y], { intro: 1, offer: 1 });
  assert.equal(eco.withOffers, 1);
});
