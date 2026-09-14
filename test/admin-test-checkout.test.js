const test = require('node:test');
const assert = require('node:assert/strict');
const pricing = require('../netlify/functions/lib/pricing');

test('resolvePurchasable resolves a one-time product to its price id in payment mode', () => {
  const resolved = pricing.resolvePurchasable('strength-map');
  assert.ok(resolved);
  assert.equal(resolved.mode, 'payment');
  assert.equal(resolved.priceId, pricing.entryForKey('strength-map').stripe_price_id);
});

test('resolvePurchasable resolves a membership plan by interval, in subscription mode', () => {
  const monthly = pricing.resolvePurchasable('membership', 'month');
  const yearly = pricing.resolvePurchasable('membership', 'year');
  assert.equal(monthly.mode, 'subscription');
  assert.equal(monthly.interval, 'month');
  assert.equal(yearly.interval, 'year');
  assert.notEqual(monthly.priceId, yearly.priceId);
});

test('resolvePurchasable falls back to the first plan when the requested interval is missing', () => {
  const resolved = pricing.resolvePurchasable('membership', 'does-not-exist');
  assert.ok(resolved);
  assert.equal(resolved.mode, 'subscription');
});

test('resolvePurchasable resolves a Blueprint issue in payment mode', () => {
  const resolved = pricing.resolvePurchasable('blueprint-welcome');
  assert.ok(resolved);
  assert.equal(resolved.mode, 'payment');
});

test('resolvePurchasable returns null for a bonus product (granted automatically, not sold)', () => {
  assert.equal(pricing.resolvePurchasable('infrastructure-roadmap'), null);
});

test('resolvePurchasable returns null for an unknown key', () => {
  assert.equal(pricing.resolvePurchasable('not-a-real-key'), null);
});
