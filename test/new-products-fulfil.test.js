'use strict';

// Every one-time product that has a live Stripe price must resolve to its key, grant exactly that product
// when bought, and have a PDF to deliver. Guards the Foundations and Creators Foundations products.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');

test.beforeEach(() => fakeStore.reset());

test('each Foundations product: its Stripe price grants it and its PDF exists', async () => {
  const products = pricing.registry.products.filter((p) => p.phase_key === 'foundations' && !p.stripe_pending);
  assert.ok(products.length >= 12, 'the Foundations set is on sale');
  for (const p of products) {
    assert.equal(pricing.keyForPriceId(p.stripe_price_id), p.key, p.key);
    const r = await fulfillCheckoutSession({ id: `cs_${p.key}`, customer_details: { email: `${p.key}@example.com` }, amount_total: 1 }, [p.stripe_price_id]);
    assert.deepEqual(r.grantedKeys, [p.key], p.key);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'content', 'library', p.pdf_file)), `${p.key} PDF`);
    assert.match(p.payment_link, /^https:\/\/buy\.stripe\.com\//, p.key);
  }
});
