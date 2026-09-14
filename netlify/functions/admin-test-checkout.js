// Owner-only test-purchase generator. Creates a REAL Stripe Checkout
// Session for any catalog product, blueprint issue, or membership plan —
// using the exact same Stripe price id a real customer would buy — so the
// full checkout -> webhook -> fulfillment -> account/dashboard flow can be
// exercised end to end without editing the Netlify Blobs store by hand.
//
// Prefers true Stripe TEST MODE when a STRIPE_SECRET_KEY_TEST is configured
// (nothing is ever actually charged). Otherwise falls back to LIVE mode
// with a coupon created on the fly for this one session only: amount_off is
// computed from the price's real unit_amount down to $1, duration 'once',
// max_redemptions 1. The coupon is never named on any customer-facing page,
// never offered as an enterable promo code (allow_promotion_codes is left
// off), and only ever attached server-side to this one admin-created
// session — so no customer can discover or reuse it, and no discounted
// price is ever exposed publicly. Gated by the same ADMIN_TOKEN pattern as
// admin-customers.js / admin-impact.js.
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

const TEST_CENTS = 100; // $1

function isAuthorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false; // fail closed if the owner hasn't set one yet
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

function siteOrigin(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || 'wearethellab.netlify.app';
  return `https://${host}`;
}

exports.handler = async (event) => {
  if (!isAuthorized(event)) return json(401, { error: 'Unauthorized. Set ADMIN_TOKEN and send it as X-Admin-Token.' });
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const params = event.queryStringParameters || {};
  const key = params.key;
  const interval = params.interval || 'month';
  const email = (params.email || 'owner-test@wearethellab.test').trim().toLowerCase();

  if (!key) return json(400, { error: 'Missing "key" query param.' });

  const resolved = pricing.resolvePurchasable(key, interval);
  if (!resolved) {
    return json(400, {
      error: `"${key}" isn't a directly purchasable catalog item (unknown key, missing price, or a bonus product that's granted automatically rather than sold).`,
    });
  }

  const { priceId, mode } = resolved;
  const testKey = process.env.STRIPE_SECRET_KEY_TEST;
  const liveKey = process.env.STRIPE_SECRET_KEY;

  if (!testKey && !liveKey) {
    return json(500, { error: 'Neither STRIPE_SECRET_KEY_TEST nor STRIPE_SECRET_KEY is configured.' });
  }

  const Stripe = require('stripe');
  const origin = siteOrigin(event);

  try {
    if (testKey) {
      // True test mode: nothing is ever charged. Test-mode Stripe accounts
      // don't share price ids with live mode, so this only works once the
      // owner has mirrored this price in test mode and set
      // STRIPE_TEST_PRICE_MAP (JSON: {"<key>:<interval-or-blank>": "price_..."})
      // — until then this falls through to the live-mode $1 coupon path below.
      let testPriceId = null;
      try {
        const map = JSON.parse(process.env.STRIPE_TEST_PRICE_MAP || '{}');
        testPriceId = map[interval ? `${key}:${interval}` : key] || map[key] || null;
      } catch {
        testPriceId = null;
      }

      if (testPriceId) {
        const stripe = new Stripe(testKey, { apiVersion: '2024-06-20' });
        const session = await stripe.checkout.sessions.create({
          mode,
          line_items: [{ price: testPriceId, quantity: 1 }],
          customer_email: email,
          success_url: `${origin}/pages/account.html?session_id={CHECKOUT_SESSION_ID}&test=1`,
          cancel_url: `${origin}/admin/customers.html`,
          metadata: { purpose: 'owner_test_purchase', key, mode: 'test' },
        });
        return json(200, { checkout_url: session.url, mode: 'test', key, interval: mode === 'subscription' ? interval : null, charged: 0 });
      }
    }

    if (!liveKey) {
      return json(500, {
        error: 'STRIPE_SECRET_KEY_TEST is set but no matching test-mode price is mapped for this key (STRIPE_TEST_PRICE_MAP), and no live STRIPE_SECRET_KEY is configured to fall back to.',
      });
    }

    // Live mode, real $1 charge via a one-off hidden coupon.
    const stripe = new Stripe(liveKey, { apiVersion: '2024-06-20' });
    const price = await stripe.prices.retrieve(priceId);
    const unitAmount = price.unit_amount;
    if (unitAmount == null) {
      return json(400, { error: `"${key}" has no fixed unit amount on its Stripe price — can't compute a $1 test discount.` });
    }

    let discounts;
    let charged = unitAmount;
    if (unitAmount > TEST_CENTS) {
      const coupon = await stripe.coupons.create({
        amount_off: unitAmount - TEST_CENTS,
        currency: price.currency,
        duration: 'once',
        max_redemptions: 1,
        name: `OWNER TEST ${key} ${Date.now()}`,
        metadata: { purpose: 'owner_test_purchase', key },
      });
      discounts = [{ coupon: coupon.id }];
      charged = TEST_CENTS;
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      ...(discounts ? { discounts } : {}),
      customer_email: email,
      success_url: `${origin}/pages/account.html?session_id={CHECKOUT_SESSION_ID}&test=1`,
      cancel_url: `${origin}/admin/customers.html`,
      metadata: { purpose: 'owner_test_purchase', key, mode: 'live-coupon' },
    });

    return json(200, {
      checkout_url: session.url,
      mode: 'live-coupon',
      key,
      interval: mode === 'subscription' ? interval : null,
      charged,
    });
  } catch (err) {
    console.error('admin-test-checkout error', err);
    return json(500, { error: err.message || 'Stripe error creating test checkout session.' });
  }
};
