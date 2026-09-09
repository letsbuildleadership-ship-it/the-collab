// Member ID + password sign-in. Returns the same shape as /me plus signs
// the browser in with the same session cookie the token-link flow uses, so
// everything downstream (account page, download links) works identically
// regardless of which way someone signed in.
const store = require('./lib/store');
const { verifyPassword } = require('./lib/password');
const { buildAccountView } = require('./lib/account-view');
const { json, setTokenCookie } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  const memberId = typeof body.memberId === 'string' ? body.memberId.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!memberId || !password) {
    return json(400, { error: 'Member ID and password are required.' });
  }

  const token = await store.getTokenByMemberId(memberId);
  const record = token ? await store.getCustomerByToken(token) : null;

  // Same generic error either way — don't reveal whether the Member ID exists.
  if (!record || !verifyPassword(password, record.passwordHash)) {
    return json(401, { error: 'Incorrect Member ID or password.' });
  }

  return json(200, { ...buildAccountView(record), restoreToken: record.token }, { 'Set-Cookie': setTokenCookie(record.token) });
};
