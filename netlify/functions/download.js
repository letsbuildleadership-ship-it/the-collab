// Entitlement-gated PDF delivery. A customer can only download a file they
// actually own (checked against their stored entitlements, not against
// anything the client sends), and the PDF itself is never linked publicly
// anywhere on the site — only reachable through this function.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { tokenFromEvent, json } = require('./lib/http');
const { resolvePdfFile } = require('./lib/pdf-path');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const productKey = (event.queryStringParameters || {}).product;
  if (!productKey) return json(400, { error: 'Missing product key.' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  const entitlementSet = new Set(record.entitlements || []);
  const hasFullCatalog = Object.entries(record.memberships || {}).some(
    ([key, m]) => m.status === 'active' && pricing.unlocksCatalog(key)
  );
  const isCatalogProduct = pricing.allCatalogProductKeys().includes(productKey);

  const entitled = entitlementSet.has(productKey) || (hasFullCatalog && isCatalogProduct);
  if (!entitled) return json(403, { error: 'You do not have access to this product.' });

  const entry = pricing.entryForKey(productKey);
  if (!entry || !entry.pdf_file) return json(404, { error: 'No file is attached to this product yet.' });

  const filePath = resolvePdfFile(entry.pdf_file);
  if (!filePath) {
    console.error(`PDF not found for ${productKey}: ${entry.pdf_file}`);
    return json(404, { error: 'File temporarily unavailable — please contact support.' });
  }

  const fs = require('fs');
  const buffer = fs.readFileSync(filePath);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${entry.pdf_file}"`,
      'Cache-Control': 'private, no-store',
    },
    body: buffer.toString('base64'),
    isBase64Encoded: true,
  };
};
