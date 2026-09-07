// Lightweight ops console for the business owner: list customers, inspect
// entitlements, and manually grant/revoke access (comps, support fixes)
// without touching code. Gated by an ADMIN_TOKEN environment variable set
// in the Netlify dashboard — never checked into git. Paired with
// admin/customers.html on the frontend.
const { getStore } = require('@netlify/blobs');
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

function isAuthorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false; // fail closed if the owner hasn't set one yet
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

async function listCustomers(cursor) {
  const blobStore = getStore('collab-customers');
  const page = await blobStore.list({ prefix: 'customers/', cursor: cursor || undefined, paginate: false });
  const records = await Promise.all(
    page.blobs.map(async (b) => {
      const key = b.key.replace(/^customers\//, '').replace(/\.json$/, '');
      return store.getCustomerByToken(key);
    })
  );
  return { customers: records.filter(Boolean), cursor: page.cursor || null };
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
      return json(200, { customer: record });
    }
    // default: list
    const { customers, cursor } = await listCustomers(params.cursor);
    return json(200, {
      customers: customers.map((c) => ({
        token: c.token,
        email: c.email,
        createdAt: c.createdAt,
        entitlements: c.entitlements,
        memberships: c.memberships,
      })),
      cursor,
      catalog: pricing.allCatalogProductKeys(),
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
      if (!key || !pricing.entryForKey(key)) return json(400, { error: 'Unknown product key.' });
      record.entitlements = Array.from(new Set([...(record.entitlements || []), key]));
      await store.saveCustomer(record);
      return json(200, { customer: record });
    }

    if (action === 'revoke') {
      record.entitlements = (record.entitlements || []).filter((k) => k !== key);
      if (record.memberships[key]) delete record.memberships[key];
      await store.saveCustomer(record);
      return json(200, { customer: record });
    }

    return json(400, { error: 'Unknown action. Use "grant" or "revoke".' });
  }

  return json(405, { error: 'Method Not Allowed' });
};
