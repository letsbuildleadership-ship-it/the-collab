const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const { verifyPassword } = require('../netlify/functions/lib/password');
const { createResetLink } = require('../netlify/functions/lib/password-reset');
const reset = require('../netlify/functions/password-reset');
const logout = require('../netlify/functions/logout');

const post = (body) => reset.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });
let sent;
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
});
test.after(() => mailer._setTransportForTests(null));

test('request emails a reset link to an existing account, with the username', async () => {
  const { record } = await fakeStore.getOrCreateCustomerByEmail('kim@example.com');
  const res = await post({ action: 'request', email: 'KIM@example.com' });
  assert.equal(res.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'kim@example.com');
  assert.match(sent[0].text, /login\.html\?reset=/);
  assert.match(sent[0].text, new RegExp(record.memberId));
});

test('request for an unknown email looks identical and sends nothing', async () => {
  const res = await post({ action: 'request', email: 'nobody@example.com' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true });
  assert.equal(sent.length, 0);
});

test('complete sets the password, signs in, and the link works only once', async () => {
  const { record } = await fakeStore.getOrCreateCustomerByEmail('jo@example.com');
  const { code } = await createResetLink(record.token, 1);
  const res = await post({ action: 'complete', code, password: 'new-password-1' });
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Set-Cookie'], /collab_token=/);
  assert.ok(verifyPassword('new-password-1', (await fakeStore.getCustomerByToken(record.token)).passwordHash));
  assert.equal((await post({ action: 'complete', code, password: 'another-pass' })).statusCode, 400);
});

test('expired links and short passwords are rejected', async () => {
  const { record } = await fakeStore.getOrCreateCustomerByEmail('al@example.com');
  const { code } = await createResetLink(record.token, -1);
  assert.equal((await post({ action: 'complete', code, password: 'long-enough-1' })).statusCode, 400);
  const fresh = await createResetLink(record.token, 1);
  assert.equal((await post({ action: 'complete', code: fresh.code, password: 'short' })).statusCode, 400);
});

test('logout clears the session cookie', async () => {
  const res = await logout.handler({ httpMethod: 'POST', headers: {} });
  assert.match(res.headers['Set-Cookie'], /collab_token=;.*Max-Age=0/);
});
