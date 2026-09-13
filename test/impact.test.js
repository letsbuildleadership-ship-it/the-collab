const test = require('node:test');
const assert = require('node:assert/strict');

// Same fake-store injection pattern as test/fulfill.test.js — see that file
// and test/lib/fake-store.js for why a real Netlify Blobs store isn't used.
const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const pricing = require('../netlify/functions/lib/pricing');

test.beforeEach(() => fakeStore.reset());

test('impact partner registry has both designated nonprofits', () => {
  const partners = pricing.impactPartners();
  const keys = partners.map((p) => p.key);
  assert.ok(keys.includes('blazing-smiles'));
  assert.ok(keys.includes('wavecraft-oceans'));
});

test('Founder purchase ($350) allocates 10% to Blazing Smiles', async () => {
  const session = {
    id: 'cs_impact_founder',
    customer_details: { email: 'founder@example.com' },
    customer: 'cus_founder',
    amount_total: 35000, // $350.00 in cents
    currency: 'usd',
  };
  await fulfillCheckoutSession(session, ['price_1TjpMwAK6n3ctuR9UEPmFzwk']); // founder
  const ledger = await fakeStore.listImpactLedger();
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].partnerKey, 'blazing-smiles');
  assert.equal(ledger[0].impactAmount, 3500); // $35.00
  assert.equal(ledger[0].percent, 10);
});

test('Legacy Founder purchase ($1,000) allocates 10% to Wavecraft Oceans Project', async () => {
  const session = {
    id: 'cs_impact_legacy',
    customer_details: { email: 'legacy@example.com' },
    customer: 'cus_legacy',
    amount_total: 100000, // $1,000.00 in cents
    currency: 'usd',
  };
  await fulfillCheckoutSession(session, ['price_1TjpktAK6n3ctuR9GTGot6Be']); // legacy-founder
  const ledger = await fakeStore.listImpactLedger();
  assert.equal(ledger.length, 1);
  assert.equal(ledger[0].partnerKey, 'wavecraft-oceans');
  assert.equal(ledger[0].impactAmount, 10000); // $100.00
});

test('a non-Impact product purchase records nothing in the ledger', async () => {
  const session = {
    id: 'cs_impact_none',
    customer_details: { email: 'buyer@example.com' },
    amount_total: 2000,
    currency: 'usd',
  };
  await fulfillCheckoutSession(session, ['price_1U31dIAK6n3ctuR9P3oaWUqY']); // strength-map, no impact field
  const ledger = await fakeStore.listImpactLedger();
  assert.equal(ledger.length, 0);
});

test('re-fulfilling the same session/price is idempotent — no duplicate ledger entry', async () => {
  const session = {
    id: 'cs_impact_repeat',
    customer_details: { email: 'repeat-impact@example.com' },
    customer: 'cus_repeat',
    amount_total: 35000,
    currency: 'usd',
  };
  await fulfillCheckoutSession(session, ['price_1TjpMwAK6n3ctuR9UEPmFzwk']);
  await fulfillCheckoutSession(session, ['price_1TjpMwAK6n3ctuR9UEPmFzwk']); // webhook + fallback both call this
  const ledger = await fakeStore.listImpactLedger();
  assert.equal(ledger.length, 1);
});
