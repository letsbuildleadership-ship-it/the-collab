// Returns the signed-in customer's entitlements for the account dashboard.
// Accepts the access token either as an httpOnly cookie (normal case) or as
// a ?token= query param (the "save this link" cross-device recovery path,
// documented on the account page) — if it arrives via query param we also
// set the cookie so the browser stays signed in from then on.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json, tokenFromEvent, setTokenCookie } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const entitlementSet = new Set(record.entitlements || []);
  const hasFullCatalog = Object.entries(record.memberships || {}).some(
    ([key, m]) => m.status === 'active' && pricing.unlocksCatalog(key)
  );

  const owned = [];
  for (const key of entitlementSet) {
    const entry = pricing.entryForKey(key);
    if (!entry) continue;
    owned.push({ key, kind: entry.kind, name: entry.name, phase: entry.phase || null, pdf_file: entry.pdf_file || null });
  }

  const locked = [];
  if (!hasFullCatalog) {
    for (const key of pricing.allCatalogProductKeys()) {
      if (!entitlementSet.has(key)) {
        const entry = pricing.entryForKey(key);
        locked.push({ key, name: entry.name, phase: entry.phase, price_display: entry.price_display, payment_link: entry.payment_link });
      }
    }
  }

  const wasQueryToken = !!(event.queryStringParameters && event.queryStringParameters.token);

  return json(
    200,
    {
      email: record.email,
      memberOfCollab: true,
      memberships: record.memberships || {},
      hasFullCatalog,
      owned,
      locked,
      restoreToken: token,
    },
    wasQueryToken ? { 'Set-Cookie': setTokenCookie(token) } : undefined
  );
};
