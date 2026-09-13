// Public read-only summary of the Impact Product ledger: how much has been
// allocated to each partner nonprofit so far. No PII — just partner totals.
// Paired with pages/impact.html.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  try {
    const ledger = await store.listImpactLedger();
    const partners = pricing.impactPartners();
    const totals = new Map(partners.map((p) => [p.key, {
      key: p.key,
      name: p.name,
      description: p.description,
      website: p.website || null,
      hasStripeConnect: !!p.stripe_connect_account_id,
      allocatedCents: 0,
      remittedCents: 0,
      purchaseCount: 0,
    }]));
    for (const entry of ledger) {
      const bucket = totals.get(entry.partnerKey);
      if (!bucket) continue;
      bucket.allocatedCents += entry.impactAmount || 0;
      bucket.purchaseCount += 1;
      if (entry.remitted) bucket.remittedCents += entry.impactAmount || 0;
    }
    return json(200, { partners: Array.from(totals.values()), currency: 'usd' });
  } catch (err) {
    console.error('impact-summary error', err);
    return json(500, { error: 'Could not load Impact summary.' });
  }
};
