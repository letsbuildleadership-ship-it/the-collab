// Free membership sign-up: email + password, no payment. Creates a free
// member account (Member ID assigned as usual) and signs the browser in.
// Purchases made later with the same email land on this same account.
// An email that already has an account is never taken over here: the
// person is sent to sign in, or to Forgot password.
const store = require('./lib/store');
const { hashPassword } = require('./lib/password');
const { buildAccountView } = require('./lib/account-view');
const { resolveAccess } = require('./lib/access');
const { json, setTokenCookie } = require('./lib/http');
const { sendVerificationEmail } = require('./lib/account-emails');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 120) : '';
  if (!EMAIL_RE.test(email)) return json(400, { error: 'Enter a valid email address.' });
  if (password.length < 8) return json(400, { error: 'Password must be at least 8 characters.' });

  if (await store.getTokenByEmail(email)) {
    return json(409, { error: 'An account with this email already exists. Sign in, or use Forgot password.', exists: true });
  }

  const { token, record } = await store.getOrCreateCustomerByEmail(email);
  record.passwordHash = hashPassword(password);
  if (name && !record.name) record.name = name;
  record.joinedFreeAt = new Date().toISOString();
  record.signupSource = 'free';
  record.emailVerified = false;
  record.verifyEmailSentAt = new Date().toISOString();
  await store.saveCustomer(record);
  // Free tools work right away. The confirmation email proves the address is theirs; until then a
  // later purchase by that address starts a fresh account (see store.getOrCreateCustomerForPurchase).
  try {
    await sendVerificationEmail(record);
  } catch (err) {
    console.error('verification email failed', err.message);
  }

  return json(201, { ...buildAccountView(await resolveAccess(record)), restoreToken: token }, { 'Set-Cookie': setTokenCookie(token) });
};
