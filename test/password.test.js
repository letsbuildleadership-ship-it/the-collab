const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword } = require('../netlify/functions/lib/password');

test('a hashed password verifies against the same plaintext', () => {
  const hash = hashPassword('correct-horse-battery');
  assert.equal(verifyPassword('correct-horse-battery', hash), true);
});

test('a hashed password rejects the wrong plaintext', () => {
  const hash = hashPassword('correct-horse-battery');
  assert.equal(verifyPassword('wrong-password', hash), false);
});

test('two hashes of the same password are not identical (salted)', () => {
  const a = hashPassword('same-password');
  const b = hashPassword('same-password');
  assert.notEqual(a, b);
  assert.equal(verifyPassword('same-password', a), true);
  assert.equal(verifyPassword('same-password', b), true);
});

test('verifyPassword is safe against a missing/null stored hash', () => {
  assert.equal(verifyPassword('anything', null), false);
  assert.equal(verifyPassword('anything', undefined), false);
  assert.equal(verifyPassword('anything', ''), false);
});
