// Lets an already-signed-in member (via the existing token cookie/query —
// e.g. right after checkout, or via a restored access link) set the
// password half of their Member ID + password login. No old password is
// required here since proof of the access token/link already is the
// authentication; this is a one-time "finish setting up your account" step,
// and can be re-run later to change the password the same way.
const store = require('./lib/store');
const { hashPassword } = require('./lib/password');
const { json, tokenFromEvent } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < 8) {
    return json(400, { error: 'Password must be at least 8 characters.' });
  }

  record.passwordHash = hashPassword(password);
  await store.saveCustomer(record);

  return json(200, { ok: true, memberId: record.memberId });
};
