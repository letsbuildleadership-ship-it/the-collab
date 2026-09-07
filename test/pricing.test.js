const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../netlify/functions/lib/pricing');

test('every one-time product has a unique stripe_price_id, payment_link, and pdf_file', () => {
  const seenPrices = new Set();
  const seenLinks = new Set();
  for (const p of pricing.registry.products) {
    assert.ok(p.key, `product missing key: ${JSON.stringify(p)}`);
    assert.ok(p.stripe_price_id, `${p.key} missing stripe_price_id`);
    assert.ok(p.payment_link, `${p.key} missing payment_link`);
    assert.ok(p.pdf_file, `${p.key} missing pdf_file`);
    assert.ok(!seenPrices.has(p.stripe_price_id), `duplicate price id on ${p.key}`);
    assert.ok(!seenLinks.has(p.payment_link), `duplicate payment link on ${p.key}`);
    seenPrices.add(p.stripe_price_id);
    seenLinks.add(p.payment_link);
  }
  assert.equal(pricing.registry.products.length, 11, 'expected 9 phase products + 2 founders tiers');
});

test('keyForPriceId resolves every registered price back to its product/membership key', () => {
  for (const p of pricing.registry.products) {
    assert.equal(pricing.keyForPriceId(p.stripe_price_id), p.key);
  }
  for (const m of pricing.registry.memberships) {
    for (const plan of m.plans) {
      assert.equal(pricing.keyForPriceId(plan.stripe_price_id), m.key);
    }
  }
});

test('unknown price id resolves to null (safe to ignore in webhook)', () => {
  assert.equal(pricing.keyForPriceId('price_does_not_exist'), null);
});

test('membership grants the infrastructure roadmap bonus; library-card too', () => {
  assert.deepEqual(pricing.grantsForKey('membership'), ['infrastructure-roadmap']);
  assert.deepEqual(pricing.grantsForKey('library-card'), ['infrastructure-roadmap']);
  assert.deepEqual(pricing.grantsForKey('journal'), []);
});

test('only membership unlocks the full catalog', () => {
  assert.equal(pricing.unlocksCatalog('membership'), true);
  assert.equal(pricing.unlocksCatalog('library-card'), false);
  assert.equal(pricing.unlocksCatalog('journal'), false);
});

test('allCatalogProductKeys returns all one-time products (9 IV-phase + 2 Founders tiers)', () => {
  const keys = pricing.allCatalogProductKeys();
  assert.equal(keys.length, 11);
  assert.ok(keys.includes('strength-map'));
  assert.ok(keys.includes('legacy-architecture'));
  assert.ok(keys.includes('founder'));
});

test('bonus product infrastructure-roadmap resolves via entryForKey', () => {
  const entry = pricing.entryForKey('infrastructure-roadmap');
  assert.equal(entry.kind, 'bonus');
  assert.equal(entry.pdf_file, 'infrastructure-roadmap.pdf');
});
