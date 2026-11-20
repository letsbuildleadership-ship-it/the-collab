// End-to-end customer journey, run against the real Netlify Functions with an
// in-memory store and a stubbed Stripe client (nothing is charged, nothing
// touches the live store or the Legacy Wall):
// sign up -> confirm email -> portal -> sign out -> forgot password -> reset ->
// sign in -> checkout -> payment confirmed -> membership assigned -> paid files
// unlocked, and the permission checks around each step.
const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

// Stub Stripe: checkout-create gets a hosted URL back, verify-session gets a paid session.
const stripePath = require.resolve('../netlify/functions/lib/stripe-client');
const pricing = require('../content/pricing.json');
const membership = pricing.memberships.find((m) => m.key === 'membership');
const monthly = membership.plans.find((p) => p.interval === 'month');
const created = [];
let paidSession = null;
const fakeStripe = {
  checkout: {
    sessions: {
      create: async (params) => { created.push(params); return { id: 'cs_test_journey', url: 'https://checkout.stripe.com/c/pay/cs_test_journey' }; },
      retrieve: async () => paidSession,
      listLineItems: async () => ({ data: [{ price: { id: monthly.stripe_price_id } }] }),
    },
  },
  customers: { list: async () => ({ data: [] }), create: async () => ({ id: 'cus_test' }) },
  subscriptions: { list: async () => ({ data: [] }), retrieve: async () => ({ id: 'sub_test', status: 'active', items: { data: [] } }) },
  coupons: { create: async () => ({ id: 'coupon_test' }) },
};
require.cache[stripePath] = { id: stripePath, filename: stripePath, loaded: true, exports: { getStripe: () => fakeStripe, getStripeForMode: () => fakeStripe } };
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

const mailer = require('../netlify/functions/lib/mailer');
const fn = (name) => require(`../netlify/functions/${name}`).handler;
const cookieOf = (res) => {
  const h = JSON.stringify(res.headers || {}) + JSON.stringify(res.multiValueHeaders || {});
  const m = /collab_token=([^;"\\]+)/.exec(h);
  return m ? `collab_token=${m[1]}` : null;
};
const post = (name, body, cookie) => fn(name)({ httpMethod: 'POST', headers: cookie ? { cookie } : {}, body: JSON.stringify(body) });
const get = (name, qs, cookie) => fn(name)({ httpMethod: 'GET', headers: cookie ? { cookie, host: 'wearethellab.com' } : { host: 'wearethellab.com' }, queryStringParameters: qs || {} });

let sent;
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  created.length = 0;
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
});
test.after(() => mailer._setTransportForTests(null));

test('full member journey: register, confirm, sign out, recover password, buy Membership, unlock paid IP', async () => {
  const email = 'journey@example.com';

  // 1. Registration creates a free account and signs the browser in.
  const signup = await post('signup', { email, password: 'first-pass-1', name: 'Journey Tester' });
  assert.equal(signup.statusCode, 201, signup.body);
  let cookie = cookieOf(signup);
  assert.ok(cookie, 'signup sets the session cookie');
  assert.equal((await post('signup', { email, password: 'other-pass-1' })).statusCode, 409, 'duplicate email is refused');

  // 2. Email confirmation link (sent by mail) confirms the account.
  const verifyMail = sent.find((m) => /verify=/.test(m.text || ''));
  assert.ok(verifyMail, 'a confirmation email is sent');
  const code = decodeURIComponent(/verify=([^\s&"]+)/.exec(verifyMail.text)[1]);
  assert.equal((await post('verify-email', { code })).statusCode, 200);

  // 3. The Member Portal loads for the signed-in member; free accounts have no paid IP.
  const me1 = await get('me', {}, cookie);
  assert.equal(me1.statusCode, 200);
  const paidKey = pricing.products.find((p) => !p.retired_from_sale && p.pdf_file && !p.free && !p.custom_amount && p.price_display && !/^\$0/.test(p.price_display) && !(p.phase_key || '').includes('founders')).key;
  assert.equal((await get('download', { product: paidKey }, cookie)).statusCode, 403, 'free account cannot download paid IP');

  // 4. Sign out clears the cookie; the portal then refuses the request.
  const out = await post('logout', {}, cookie);
  assert.equal(out.statusCode, 200);
  assert.match(JSON.stringify(out.headers), /Max-Age=0|Expires=Thu, 01 Jan 1970/);
  assert.equal((await get('me', {}, null)).statusCode, 401);
  assert.equal((await get('download', { product: paidKey }, null)).statusCode, 401);

  // 5. Forgot password -> emailed link -> new password signs in; old one no longer works.
  sent.length = 0;
  assert.equal((await post('password-reset', { action: 'request', email })).statusCode, 200);
  const resetCode = decodeURIComponent(/reset=([^\s&"]+)/.exec(sent[0].text)[1]);
  assert.equal((await post('password-reset', { action: 'complete', code: resetCode, password: 'second-pass-2' })).statusCode, 200);
  assert.equal((await post('password-reset', { action: 'complete', code: resetCode, password: 'third-pass-3' })).statusCode, 400, 'reset link works once');
  assert.equal((await post('login', { identifier: email, password: 'first-pass-1' })).statusCode, 401);
  const login = await post('login', { identifier: email, password: 'second-pass-2' });
  assert.equal(login.statusCode, 200);
  cookie = cookieOf(login);

  // 6. Checkout: the signed-in member is sent to Stripe Checkout for the Membership price.
  const co = await get('checkout-create', { key: 'membership', interval: 'month' }, cookie);
  assert.ok([302, 303].includes(co.statusCode), `checkout redirects to Stripe (${co.statusCode} ${co.body})`);
  assert.match(co.headers.Location, /^https:\/\/checkout\.stripe\.com\//);
  assert.equal(created[0].mode, 'subscription');
  assert.ok(JSON.stringify(created[0].line_items).includes(monthly.stripe_price_id), 'uses the Membership price from pricing.json');
  assert.equal(created[0].customer_email || email, email);

  // 7. Payment confirmed: the return page verifies the session and assigns the Membership.
  paidSession = { id: 'cs_test_journey', line_items: { data: [{ price: { id: monthly.stripe_price_id } }] }, livemode: false, payment_status: 'paid', status: 'complete', mode: 'subscription', subscription: 'sub_test', customer: 'cus_test', amount_total: 15000, customer_details: { email, name: 'Journey Tester' }, metadata: {} };
  const vs = await get('verify-session', { session_id: 'cs_test_journey' });
  assert.equal(vs.statusCode, 200, vs.body);
  const me2 = JSON.parse((await get('me', {}, cookie)).body);
  assert.ok(JSON.stringify(me2).includes('membership'), 'portal shows the Membership');

  // 8. Paid IP is now unlocked for the member, and still locked for a stranger.
  const dl = await get('download', { product: paidKey }, cookie);
  assert.notEqual(dl.statusCode, 403, `member can open paid IP (${dl.statusCode})`);
  const stranger = await post('signup', { email: 'stranger@example.com', password: 'stranger-pass' });
  assert.equal((await get('download', { product: paidKey }, cookieOf(stranger))).statusCode, 403);

  // 9. Owner pages stay private to a member session.
  const admin = await fn('admin-customers')({ httpMethod: 'GET', headers: { cookie }, queryStringParameters: {} });
  assert.equal(admin.statusCode, 401, 'a member cannot open owner tools');
});
