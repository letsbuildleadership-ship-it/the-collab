// Public checkout entry point used ONLY for a signed-in Founder's future
// purchases, so their permanent 20% Founder discount can be applied
// automatically, server-side, through a real Stripe Checkout Session —
// without ever exposing a promo code the Founder has to type in, and
// without touching the static Stripe Payment Links every other visitor
// still uses unchanged (js/main.js only rewrites a "Buy" link to point
// here when it has already confirmed, via /me, that the signed-in visitor
// is a recognized Founder).
//
// Anyone not signed in, or signed in but not a Founder, still gets a
// correct, undiscounted Checkout Session for the exact same price a
// static Payment Link would charge (with allow_promotion_codes on, same
// as those links) — so this endpoint is always safe to hit directly.
//
// Never discounts a Founder tier itself (founder_discount_exempt in
// content/pricing.json) — the purchase that earns Founder status is never
// retroactively or immediately discounted.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json, tokenFromEvent } = require('./lib/http');
// Required lazily inside the handler (like admin-test-checkout.js already
// does) so this module — and its pure, unit-testable helpers below — can
// be loaded without the `stripe` package present (e.g. under `node --test`
// outside a full `npm install`).
function getStripe() {
  return require('./lib/stripe-client').getStripe();
}

const FOUNDER_COUPON_ID = 'collab-founder-20';

function siteOrigin(event) {
  const host = (event.headers && (event.headers.host || event.headers.Host)) || 'wearethellab.netlify.app';
  return `https://${host}`;
}

function safeReturnPath(from) {
  if (typeof from !== 'string') return null;
  if (!from.startsWith('/')) return null;
  if (from.startsWith('//')) return null; // protocol-relative -> off-site
  return from;
}

/** Pure decision, kept separate from the Stripe call so it's cheaply testable. */
function shouldApplyFounderDiscount(record, key) {
  return !!(record && record.founder) && !pricing.isFounderDiscountExempt(key);
}

async function ensureFounderCoupon(stripe) {
  try {
    await stripe.coupons.retrieve(FOUNDER_COUPON_ID);
  } catch (err) {
    if (err && err.code === 'resource_missing') {
      await stripe.coupons.create({
        id: FOUNDER_COUPON_ID,
        percent_off: 20,
        duration: 'forever',
        name: 'Founder — 20% off (permanent thank-you)',
        metadata: { purpose: 'founder_permanent_discount' },
      });
    } else {
      throw err;
    }
  }
}

exports._shouldApplyFounderDiscount = shouldApplyFounderDiscount;
exports._FOUNDER_COUPON_ID = FOUNDER_COUPON_ID;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const params = event.queryStringParameters || {};
  const key = params.key;
  const interval = params.interval || undefined;
  if (!key) return json(400, { error: 'Missing "key" query param.' });

  const resolved = pricing.resolvePurchasable(key, interval);
  if (!resolved) {
    return json(400, { error: `"${key}" isn't a directly purchasable catalog item.` });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return json(500, { error: 'STRIPE_SECRET_KEY is not configured.' });
  }

  const token = tokenFromEvent(event);
  const record = token ? await store.getCustomerByToken(token) : null;
  const applyFounderDiscount = shouldApplyFounderDiscount(record, key);

  const origin = siteOrigin(event);
  const cancelPath = safeReturnPath(params.from) || '/pages/products.html';

  try {
    const stripe = getStripe();

    if (applyFounderDiscount) {
      await ensureFounderCoupon(stripe);
    }

    const sessionParams = {
      mode: resolved.mode,
      line_items: [{ price: resolved.priceId, quantity: 1 }],
      success_url: `${origin}/pages/account.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}`,
      metadata: {
        purpose: 'founder_aware_checkout',
        key,
        founder_discount_applied: applyFounderDiscount ? 'true' : 'false',
      },
    };

    if (record && record.stripeCustomerId) {
      sessionParams.customer = record.stripeCustomerId;
    } else if (record) {
      sessionParams.customer_email = record.email;
    }

    if (applyFounderDiscount) {
      sessionParams.discounts = [{ coupon: FOUNDER_COUPON_ID }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return { statusCode: 302, headers: { Location: session.url }, body: '' };
  } catch (err) {
    console.error('checkout-create error', err);
    return json(500, { error: err.message || 'Stripe error creating checkout session.' });
  }
};
