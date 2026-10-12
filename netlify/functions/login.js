// Email-or-Member-ID + password sign-in. Returns the same shape as /me plus signs
// the browser in with the same session cookie the token-link flow uses, so
// everything downstream (account page, download links) works identically
// regardless of which way someone signed in.
const store = require('./lib/store');
const { verifyPassword } = require('./lib/password');
const { buildAccountView } = require('./lib/account-view');
const { resolveAccess } = require('./lib/access');
const { json, setTokenCookie } = require('./lib/http');

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

  const token = identifier.includes('@')
    ? await store.getTokenByEmail(identifier)
    : await store.getTokenByMemberId(identifier.toUpperCase());
  const record = token ? await store.getCustomerByToken(token) : null;

  // Same generic error either way — don't reveal whether the account exists.
  if (!record || !verifyPassword(password, record.passwordHash)) {
    return json(401, { error: 'Incorrect email, Member ID, or password.' });
  }

  return json(200, { ...buildAccountView(await resolveAccess(record)), restoreToken: record.token }, { 'Set-Cookie': setTokenCookie(record.token) });
};
