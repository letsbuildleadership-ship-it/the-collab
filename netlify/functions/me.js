// Returns the signed-in customer's entitlements for the account dashboard.
// Accepts the access token either as an httpOnly cookie (normal case) or as
// a ?token= query param (the "save this link" cross-device recovery path,
// documented on the account page) — if it arrives via query param we also
// set the cookie so the browser stays signed in from then on.
const store = require('./lib/store');
const { buildAccountView } = require('./lib/account-view');
const { json, tokenFromEvent, setTokenCookie } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const wasQueryToken = !!(event.queryStringParameters && event.queryStringParameters.token);

  return json(
    200,
    { ...buildAccountView(record), restoreToken: token },
    wasQueryToken ? { 'Set-Cookie': setTokenCookie(token) } : undefined
  );
};
