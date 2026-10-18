// Email-or-Member-ID + password sign-in. Returns the same shape as /me plus signs
// the browser in with the same session cookie the token-link flow uses, so
// everything downstream (account page, download links) works identically
// regardless of which way someone signed in.
const store = require('./lib/store');
const { verifyPassword } = require('./lib/password');
const { buildAccountView } = require('./lib/account-view');
const { resolveAccess } = require('./lib/access');
const { json, setTokenCookie } = require('./lib/http');

// 7 wrong tries for one email or Member ID, then a 15-minute pause. Tries older than 30 minutes are forgotten.
const MAX_TRIES = 7;
const LOCK_MS = 15 * 60 * 1000;
const FORGET_MS = 30 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  // `identifier` is an email address or a Member ID (`memberId` is the older field name).
  const raw = typeof body.identifier === 'string' ? body.identifier : typeof body.memberId === 'string' ? body.memberId : '';
  const identifier = raw.trim();
  const password = typeof body.password === 'string' ? body.password : '';
  if (!identifier || !password) {
    return json(400, { error: 'Email or Member ID, and password, are required.' });
  }

  const throttleKey = `login:${identifier.toLowerCase()}`;
  const throttle = await store.getLoginThrottle(throttleKey);
  if (throttle && throttle.lockedUntil && Date.parse(throttle.lockedUntil) > Date.now()) {
    const retryAfterSeconds = Math.ceil((Date.parse(throttle.lockedUntil) - Date.now()) / 1000);
    return json(429, { error: 'Too many tries. Wait 15 minutes, or use Forgot password to reset it by email.', retryAfterSeconds }, { 'Retry-After': String(retryAfterSeconds) });
  }

  const token = identifier.includes('@')
    ? await store.getTokenByEmail(identifier)
    : await store.getTokenByMemberId(identifier.toUpperCase());
  const record = token ? await store.getCustomerByToken(token) : null;

  // Same generic error either way — don't reveal whether the account exists.
  if (!record || !verifyPassword(password, record.passwordHash)) {
    const recent = throttle && throttle.lastFailAt && Date.now() - Date.parse(throttle.lastFailAt) < FORGET_MS;
    const count = (recent ? throttle.count : 0) + 1;
    const next = { count, lastFailAt: new Date().toISOString(), lockedUntil: count >= MAX_TRIES ? new Date(Date.now() + LOCK_MS).toISOString() : null };
    await store.saveLoginThrottle(throttleKey, next);
    const triesLeft = Math.max(0, MAX_TRIES - count);
    return json(401, { error: triesLeft ? `Incorrect email, Member ID, or password. ${triesLeft} ${triesLeft === 1 ? 'try' : 'tries'} left.` : 'Too many tries. Wait 15 minutes, or use Forgot password to reset it by email.', triesLeft });
  }
  if (throttle) await store.clearLoginThrottle(throttleKey);

  return json(200, { ...buildAccountView(await resolveAccess(record)), restoreToken: record.token }, { 'Set-Cookie': setTokenCookie(record.token) });
};
