// Owner-only view of the full Impact Product ledger (every allocation, with
// Stripe session IDs) and a way to mark allocations as remitted once the
// owner has actually sent the money to the partner nonprofit outside Stripe.
// Gated by the same ADMIN_TOKEN pattern as admin-customers.js. Paired with
// the "Impact Product Ledger" table on admin/customers.html.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
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
    const ledger = await store.listImpactLedger();
    return json(200, { ledger, partners: pricing.impactPartners() });
  }

  if (event.httpMethod === 'POST') {
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch {
      return json(400, { error: 'Invalid JSON body.' });
    }

    const { action, id, remitted } = body;
    if (action === 'mark-remitted') {
      if (!id) return json(400, { error: 'Missing id.' });
      const updated = await store.markImpactRemitted(id, remitted !== false);
      if (!updated) return json(404, { error: 'Ledger entry not found.' });
      return json(200, { entry: updated });
    }

    return json(400, { error: 'Unknown action. Use "mark-remitted".' });
  }

  return json(405, { error: 'Method Not Allowed' });
};
