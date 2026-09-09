// Password hashing for Member ID + password login. Uses Node's built-in
// crypto.scrypt — no extra dependency (bcrypt/argon2) needed. Each hash is
// stored as "salt:derivedKey" (both hex) so no separate salt column/field
// is required on the customer record.
const crypto = require('crypto');

const KEY_LEN = 64;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(String(password), salt, KEY_LEN);
  return `${salt}:${derived.toString('hex')}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hashHex] = stored.split(':');
  const derived = crypto.scryptSync(String(password), salt, KEY_LEN);
  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== derived.length) return false;
  return crypto.timingSafeEqual(storedBuf, derived);
}

module.exports = { hashPassword, verifyPassword };
