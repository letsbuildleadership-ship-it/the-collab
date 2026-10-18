const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const pricing = require('../netlify/functions/lib/pricing');
const { hashPassword } = require('../netlify/functions/lib/password');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const signup = require('../netlify/functions/signup');
const login = require('../netlify/functions/login');
const verifyEmail = require('../netlify/functions/verify-email');

const sent = [];
test.beforeEach(() => {
  fakeStore.reset();
  sent.length = 0;
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
});
test.after(() => mailer._setTransportForTests(null));

const call = (h, body, headers = {}) => h.handler({ httpMethod: 'POST', headers, body: JSON.stringify(body) });
const signIn = (identifier, password) => call(login, { identifier, password });

async function member(email, password) {
  const { record } = await fakeStore.getOrCreateCustomerByEmail(email);
  record.passwordHash = hashPassword(password);
  await fakeStore.saveCustomer(record);
  return record;
}

// ---- 7 tries --------------------------------------------------------------

test('login: 7 wrong tries lock that account for 15 minutes, even for the right password', async () => {
  await member('lock@example.com', 'right-pass-1');
  for (let i = 1; i <= 7; i++) {
    const res = await signIn('lock@example.com', 'wrong');
    assert.equal(res.statusCode, 401, `try ${i} is a normal wrong-password reply`);
    assert.equal(JSON.parse(res.body).triesLeft, 7 - i);
  }
  const locked = await signIn('lock@example.com', 'right-pass-1');
  assert.equal(locked.statusCode, 429);
  assert.ok(JSON.parse(locked.body).retryAfterSeconds > 800);
});

test('login: a lock lifts after 15 minutes and a good sign-in clears the count', async () => {
  await member('later@example.com', 'right-pass-1');
  for (let i = 0; i < 7; i++) await signIn('later@example.com', 'wrong');
  await fakeStore.saveLoginThrottle('login:later@example.com', { count: 7, lastFailAt: new Date(Date.now() - 16 * 60 * 1000).toISOString(), lockedUntil: new Date(Date.now() - 60 * 1000).toISOString() });
  assert.equal((await signIn('later@example.com', 'right-pass-1')).statusCode, 200);
  assert.equal(await fakeStore.getLoginThrottle('login:later@example.com'), null);
});

test('login: wrong tries under the limit are forgotten after a good sign-in, and other accounts are not affected', async () => {
  await member('a@example.com', 'right-pass-1');
  await member('b@example.com', 'right-pass-2');
  for (let i = 0; i < 6; i++) await signIn('a@example.com', 'wrong');
  assert.equal((await signIn('a@example.com', 'right-pass-1')).statusCode, 200);
  assert.equal((await signIn('a@example.com', 'wrong')).statusCode, 401);
  assert.equal(JSON.parse((await signIn('a@example.com', 'wrong')).body).triesLeft, 5);
  for (let i = 0; i < 7; i++) await signIn('a@example.com', 'wrong');
  assert.equal((await signIn('b@example.com', 'right-pass-2')).statusCode, 200);
});

test('login: an unknown account is throttled the same way, so tries cannot be used to find real accounts', async () => {
  for (let i = 0; i < 7; i++) await signIn('ghost@example.com', 'wrong');
  assert.equal((await signIn('ghost@example.com', 'wrong')).statusCode, 429);
});

// ---- email confirmation ---------------------------------------------------

test('sign-up sends a confirmation email and starts unconfirmed; the link confirms once', async () => {
  const res = await call(signup, { email: 'new@example.com', password: 'free-pass-1', name: 'Rae' });
  assert.equal(res.statusCode, 201);
  assert.equal(JSON.parse(res.body).emailVerified, false);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'new@example.com');
  const code = decodeURIComponent(/verify=([^\s"&]+)/.exec(sent[0].text)[1]);
  const ok = await call(verifyEmail, { code });
  assert.equal(ok.statusCode, 200);
  const record = await fakeStore.getCustomerByToken(await fakeStore.getTokenByEmail('new@example.com'));
  assert.equal(record.emailVerified, true);
  assert.equal((await call(verifyEmail, { code })).statusCode, 400, 'the link works once');
});

test('an expired or made-up confirmation link is refused', async () => {
  await call(signup, { email: 'old@example.com', password: 'free-pass-1' });
  const token = await fakeStore.getTokenByEmail('old@example.com');
  await fakeStore.saveVerifyCode('stale', { token, expiresAt: new Date(Date.now() - 1000).toISOString() });
  assert.equal((await call(verifyEmail, { code: 'stale' })).statusCode, 400);
  assert.equal((await call(verifyEmail, { code: 'nope' })).statusCode, 400);
});

test('sign-up still works when email cannot be sent', async () => {
  mailer._setTransportForTests({ sendMail: async () => { throw new Error('smtp down'); } });
  assert.equal((await call(signup, { email: 'x@example.com', password: 'free-pass-1' })).statusCode, 201);
});

// ---- squatted emails ------------------------------------------------------

const buy = (email, id) => fulfillCheckoutSession({ id, customer_details: { email }, amount_total: 1 }, [pricing.registry.products.find((p) => p.key === 'strength-map').stripe_price_id]);

test('a purchase never lands in an unconfirmed free sign-up made by someone else', async () => {
  await call(signup, { email: 'victim@example.com', password: 'squatter-pass' });
  const squatToken = await fakeStore.getTokenByEmail('victim@example.com');
  const result = await buy('victim@example.com', 'cs_squat');
  assert.notEqual(result.token, squatToken, 'the buyer gets a fresh account');
  assert.deepEqual(result.record.entitlements, ['strength-map']);
  assert.equal(await fakeStore.getTokenByEmail('victim@example.com'), result.token);
  const squat = await fakeStore.getCustomerByToken(squatToken);
  assert.equal(squat.passwordHash, null, 'the squatter password no longer works');
  assert.deepEqual(squat.entitlements || [], []);
  assert.equal((await signIn('victim@example.com', 'squatter-pass')).statusCode, 401);
});

test('a free member who confirmed their email keeps the same account when they buy', async () => {
  await call(signup, { email: 'real@example.com', password: 'free-pass-1' });
  const token = await fakeStore.getTokenByEmail('real@example.com');
  const code = decodeURIComponent(/verify=([^\s"&]+)/.exec(sent[0].text)[1]);
  await call(verifyEmail, { code });
  const result = await buy('real@example.com', 'cs_real');
  assert.equal(result.token, token);
});

// ---- Google Apps Script relay ---------------------------------------------

test('mail goes through the Google Apps Script relay when it is configured, with the template name and values', async () => {
  mailer._setTransportForTests(null);
  process.env.MAIL_WEBHOOK_URL = 'https://script.example/exec';
  process.env.MAIL_WEBHOOK_SECRET = 'shh';
  const realFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, init) => { calls.push({ url, body: JSON.parse(init.body) }); return { ok: true, json: async () => ({ ok: true }) }; };
  try {
    await call(signup, { email: 'relay@example.com', password: 'free-pass-1', name: 'Rae Lee' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://script.example/exec');
    assert.equal(calls[0].body.secret, 'shh');
    assert.equal(calls[0].body.template, 'verify-email');
    assert.equal(calls[0].body.vars.firstName, 'Rae');
    assert.match(calls[0].body.vars.url, /login\.html\?verify=/);
    assert.equal(calls[0].body.to, 'relay@example.com');
  } finally {
    global.fetch = realFetch;
    delete process.env.MAIL_WEBHOOK_URL;
    delete process.env.MAIL_WEBHOOK_SECRET;
  }
});

test('a failed relay reply is reported as an error, never as sent', async () => {
  mailer._setTransportForTests(null);
  process.env.MAIL_WEBHOOK_URL = 'https://script.example/exec';
  process.env.MAIL_WEBHOOK_SECRET = 'shh';
  const realFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ ok: false, error: 'unauthorized' }) });
  try {
    await assert.rejects(mailer.sendMail({ to: 'a@example.com', subject: 's', text: 't' }), /Mail relay failed: unauthorized/);
  } finally {
    global.fetch = realFetch;
    delete process.env.MAIL_WEBHOOK_URL;
    delete process.env.MAIL_WEBHOOK_SECRET;
  }
});

test('the account view only asks for email confirmation when the site can send email', async () => {
  const { buildAccountView } = require('../netlify/functions/lib/account-view');
  const res = await call(signup, { email: 'view@example.com', password: 'free-pass-1' });
  assert.equal(JSON.parse(res.body).emailEnabled, true, 'test transport counts as configured');
  mailer._setTransportForTests(null);
  const record = await fakeStore.getCustomerByToken(await fakeStore.getTokenByEmail('view@example.com'));
  const { resolveAccess } = require('../netlify/functions/lib/access');
  const view = buildAccountView(await resolveAccess(record));
  assert.equal(view.emailEnabled, false, 'with no SMTP and no relay, the banner stays hidden');
});
