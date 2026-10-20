'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createLinks, pendingItems } = require('../netlify/functions/admin-setup-stripe-products');
const pricing = require('../netlify/functions/lib/pricing');

function fakeStripe() {
  const db = { products: [], prices: [], links: [] };
  let n = 0;
  return {
    db,
    products: {
      search: async ({ query }) => ({ data: db.products.filter((p) => query.includes(`'${p.metadata.collab_key}'`)) }),
      create: async (o) => { const p = { id: `prod_${++n}`, ...o }; db.products.push(p); return p; },
    },
    prices: {
      list: async ({ product }) => ({ data: db.prices.filter((p) => p.product === product) }),
      create: async (o) => { const p = { id: `price_${++n}`, type: 'one_time', ...o }; db.prices.push(p); return p; },
    },
    paymentLinks: {
      list: async () => ({ data: db.links, has_more: false }),
      create: async (o) => { const l = { id: `plink_${++n}`, url: `https://buy.stripe.com/test_${n}`, ...o }; db.links.push(l); return l; },
    },
  };
}

test('pending products become a Stripe product, one-time USD price and promo-enabled Payment Link, idempotently', async () => {
  const items = [{ key: 'demo-ip', name: '.LLab Demo™', description: 'A demo.', cents: 12500, price_display: '$125' }];
  const s = fakeStripe();
  const first = await createLinks(s, items, { origin: 'https://example.test' });
  assert.equal(first[0].status, 'created');
  assert.match(first[0].payment_link, /^https:\/\/buy\.stripe\.com\//);
  assert.equal(s.db.prices[0].unit_amount, 12500);
  assert.equal(s.db.prices[0].currency, 'usd');
  assert.equal(s.db.links[0].allow_promotion_codes, true);
  assert.equal(s.db.links[0].after_completion.redirect.url, 'https://example.test/pages/account.html');
  const again = await createLinks(s, items, { origin: 'https://example.test' });
  assert.equal(again[0].status, 'already_exists');
  assert.equal(s.db.products.length, 1);
  assert.equal(s.db.prices.length, 1);
  assert.equal(s.db.links.length, 1);
  assert.equal(again[0].stripe_price_id, first[0].stripe_price_id);
});

test('a dry run creates nothing', async () => {
  const s = fakeStripe();
  const r = await createLinks(s, [{ key: 'x', name: 'X', cents: 4000, price_display: '$40' }], { origin: 'https://example.test', dry: true });
  assert.equal(r[0].status, 'would_create');
  assert.equal(s.db.products.length, 0);
});

test('pendingItems lists every stripe_pending product with its price in cents', () => {
  const items = pendingItems(pricing.registry);
  const pending = pricing.registry.products.filter((p) => p.stripe_pending);
  assert.equal(items.length, pending.length);
  for (const it of items) assert.ok(it.cents >= 2000 && it.cents <= 30000, `${it.key} ${it.cents}`);
});
