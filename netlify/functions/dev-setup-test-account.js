// One-tap test-drive account for the founder (or anyone who has the secret).
// Visiting this URL creates (or reuses) a customer record, sets a known
// password, grants a realistic spread of memberships + products so the
// dashboard has real content to look at, signs the browser in, and
// redirects straight to the account page. Gated by DEV_SETUP_SECRET so it's
// not a public backdoor — set that env var in the Netlify dashboard, never
// checked into git. Safe to call more than once: same email always reuses
// the same account instead of creating duplicates.
const store = require('./lib/store');
const { hashPassword } = require('./lib/password');
const { setTokenCookie } = require('./lib/http');

const SAMPLE_ENTITLEMENTS = ['strength-map', 'alignment-map', 'build-plan'];

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const expected = process.env.DEV_SETUP_SECRET;

  if (!expected) {
    return { statusCode: 401, body: 'DEV_SETUP_SECRET is not set in this site\'s environment variables.' };
  }
  if (params.secret !== expected) {
    return { statusCode: 401, body: 'Unauthorized.' };
  }

  const email = (params.email || 'letsbuildleadership@gmail.com').trim().toLowerCase();
  const password = params.password || 'Founder-TestDrive-2026';

  const { token, record } = await store.getOrCreateCustomerByEmail(email);

  record.passwordHash = hashPassword(password);
  record.memberships = {
    ...record.memberships,
    membership: { status: 'active', interval: 'month' },
    'library-card': { status: 'active', interval: 'month' },
    journal: { status: 'active', interval: 'month' },
  };
  record.entitlements = Array.from(new Set([...(record.entitlements || []), ...SAMPLE_ENTITLEMENTS]));
  await store.saveCustomer(record);

  // ?json=1 returns the Member ID instead of redirecting — used to confirm
  // account creation succeeded and read back the assigned Member ID.
  if (params.json === '1') {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: record.memberId, email: record.email }),
    };
  }

  return {
    statusCode: 302,
    headers: {
      Location: '/pages/account.html',
      'Set-Cookie': setTokenCookie(token),
    },
    body: '',
  };
};
