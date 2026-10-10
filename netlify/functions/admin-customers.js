// Lightweight ops console for the business owner: list customers, inspect
// entitlements, and manually grant/revoke access (comps, support fixes)
// without touching code. Gated by an ADMIN_TOKEN environment variable set
// in the Netlify dashboard — never checked into git. Paired with
// admin/customers.html on the frontend.
const store = require('./lib/store');
const { grantableKeys, grantKey, revokeKey, partnershipSummary } = require('./lib/admin-grants');
const { effectiveMemberships } = require('./lib/membership-status');
const { json } = require('./lib/http');

function isAuthorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false; // fail closed if the owner hasn't set one yet
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

exports.handler = async (event) => {
  if (!isAuthorized(event)) return json(401, { error: 'Unauthorized. Set ADMIN_TOKEN and send it as X-Admin-Token.' });

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {};
    if (params.action === 'get' && params.token) {
      const record = await store.getCustomerByToken(params.token);
      if (!record) return json(404, { error: 'Not found.' });
      return json(200, { customer: record });
    }
    if (params.action === 'find' && params.email) {
      const token = await store.getTokenByEmail(params.email);
      if (!token) return json(404, { error: 'No account for that email.' });
      const record = await store.getCustomerByToken(token);
      return json(200, { customer: { ...record, partnership: partnershipSummary(record) } });
    }
    // default: list (newest first). Goes through lib/store so it uses the
    // same Blobs configuration as the rest of the site.
    const customers = (await store.listCustomers()).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    return json(200, {
      customers: customers.map((c) => ({
        token: c.token,
        email: c.email,
        createdAt: c.createdAt,
        entitlements: c.entitlements,
        // Expiry-aware, so a lapsed Partnership term reads "expired" here too.
        memberships: effectiveMemberships(c),
        partnership: partnershipSummary(c),
      })),
      catalog: grantableKeys(),
    });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }

    const { action, token, key } = body;
    if (!token) return json(400, { error: 'Missing token.' });
    const record = await store.getCustomerByToken(token);
    if (!record) return json(404, { error: 'Customer not found.' });

    if (action === 'grant') {
      try {
        grantKey(record, key);
      } catch (err) {
        return json(400, { error: err.message });
      }
      await store.saveCustomer(record);
      return json(200, { customer: record });
    }

    if (action === 'revoke') {
      if (!key) return json(400, { error: 'Missing key.' });
      const { warning } = revokeKey(record, key);
      await store.saveCustomer(record);
      return json(200, { customer: record, warning });
    }

    return json(400, { error: 'Unknown action. Use "grant" or "revoke".' });
  }

  return json(405, { error: 'Method Not Allowed' });
};
