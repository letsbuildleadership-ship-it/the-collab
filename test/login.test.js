const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { hashPassword } = require('../netlify/functions/lib/password');
const login = require('../netlify/functions/login');

const post = (body) => login.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify(body) });

async function member(email, password) {
  const { record } = await fakeStore.getOrCreateCustomerByEmail(email);
  record.passwordHash = hashPassword(password);
  await fakeStore.saveCustomer(record);
  return record;
}

test.beforeEach(() => fakeStore.reset());

test('signs in with email (any case) and password, and sets the session cookie', async () => {
  await member('pat@example.com', 'correct horse');
  const res = await post({ identifier: '  Pat@Example.com ', password: 'correct horse' });
  assert.equal(res.statusCode, 200);
  assert.match(JSON.stringify(res.headers || res.multiValueHeaders || {}), /collab_token=/);
});

test('signs in with Member ID, case-insensitive, and the older memberId field still works', async () => {
  const r = await member('sam@example.com', 'pw123456');
  assert.equal((await post({ identifier: r.memberId.toLowerCase(), password: 'pw123456' })).statusCode, 200);
  assert.equal((await post({ memberId: r.memberId, password: 'pw123456' })).statusCode, 200);
});

test('wrong password or unknown account gets the same generic error', async () => {
  await member('lee@example.com', 'pw123456');
  const wrong = await post({ identifier: 'lee@example.com', password: 'nope' });
  const unknown = await post({ identifier: 'nobody@example.com', password: 'nope' });
  assert.equal(wrong.statusCode, 401);
  assert.equal(unknown.statusCode, 401);
  assert.equal(wrong.body, unknown.body);
});

test('missing fields are rejected', async () => {
  assert.equal((await post({ identifier: '', password: 'x' })).statusCode, 400);
});
