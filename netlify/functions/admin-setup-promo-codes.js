// Owner-only, idempotent (safe to call more than once) setup for the private
// discount codes:
//   LLABORIGINAL  -> OG Co.LLab Collaborator: .LLab Membership (annual) at $100/yr
//   LLABFRIEND    -> 90% off any product, site-wide
//   LLABINITIATE  -> Friends & Family: Founders Organization (Founder tier) at $20
//   LLABFOUNDING  -> .LLab Founding Circle: .LLab Membership (annual) at $100/yr
//   LLABSOVEREIGN -> .LLab Membership (annual) at $500/yr
//
// LLABORIGINAL and LLABFOUNDING both discount the same annual Membership
// price to the same $100/yr -- they're two different codes for two different
// audiences (OG collaborators vs. the Founding Circle), not two different
// products, since pricing.json has one annual Membership price.
//
// LLABTEST is intentionally NOT created here. Stripe has no single coupon
// that can discount many differently-priced products down to the same flat
// $1 (a coupon's amount_off is one fixed number). That exact capability --
// buy any product for $1, through the real checkout/webhook/fulfillment
// path -- already exists as the owner-only dynamic test-checkout tool
// (admin-test-checkout.js / the "Owner Test Purchases" table in
// admin/customers.html), which computes the correct per-product discount at
// the moment of purchase instead of relying on a static code. That tool
// already creates a real Stripe Checkout Session against the real price, so
// completion fires the exact same checkout.session.completed webhook ->
// fulfillCheckoutSession() path as any paying customer: same account
// lookup/creation, same entitlement grant, same PDF/access unlock, same
// membership bookkeeping.
//
// Also flips `allow_promotion_codes: true` on every existing Stripe Payment
// Link this catalog uses, since real customers check out through those
// static links today and a promotion code can't be redeemed on a Payment
// Link that doesn't have that switched on.
//
// Call once (safe to call again -- every step below checks for existing
// objects first):
//   curl -H "X-Admin-Token: <ADMIN_TOKEN>" \
//     https://<site>/.netlify/functions/admin-setup-promo-codes

const { json } = require('./lib/http');
const pricing = require('./lib/pricing');

function isAuthorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

async function findExistingPromotionCode(stripe, code) {
  const list = await stripe.promotionCodes.list({ code, limit: 1 });
  return list.data[0] || null;
}

async function ensureFixedPriceCode(stripe, { code, priceId, targetCents, duration }) {
  const existing = await findExistingPromotionCode(stripe, code);
  if (existing) return { code, status: 'already_exists', promotion_code_id: existing.id };

  if (!priceId) {
    return { code, status: 'error', error: 'Could not resolve the underlying Stripe price from pricing.json.' };
  }

  const price = await stripe.prices.retrieve(priceId);
  if (price.unit_amount == null) {
    return { code, status: 'error', error: `Price ${priceId} has no fixed unit_amount.` };
  }
  const amountOff = price.unit_amount - targetCents;
  if (amountOff <= 0) {
    return {
      code,
      status: 'error',
      error: `Price ${priceId} (${price.unit_amount} cents) is already at or below the target ${targetCents} cents; no discount needed.`,
    };
  }

  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: price.currency,
    duration,
    applies_to: { products: [price.product] },
    name: `${code} (owner-created)`,
    metadata: { purpose: 'owner_private_code', code },
  });

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    active: true,
    metadata: { purpose: 'owner_private_code' },
  });

  return {
    code,
    status: 'created',
    coupon_id: coupon.id,
    promotion_code_id: promo.id,
    amount_off_cents: amountOff,
    currency: price.currency,
    duration,
  };
}

async function ensurePercentOffCode(stripe, { code, percentOff, duration }) {
  const existing = await findExistingPromotionCode(stripe, code);
  if (existing) return { code, status: 'already_exists', promotion_code_id: existing.id };

  const coupon = await stripe.coupons.create({
    percent_off: percentOff,
    duration,
    name: `${code} (owner-created)`,
    metadata: { purpose: 'owner_private_code', code },
  });

  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code,
    active: true,
    metadata: { purpose: 'owner_private_code' },
  });

  return { code, status: 'created', coupon_id: coupon.id, promotion_code_id: promo.id, percent_off: percentOff, duration };
}

function collectPaymentLinkUrls() {
  const reg = pricing.registry || {};
  const urls = new Set();
  for (const p of reg.products || []) if (p.payment_link) urls.add(p.payment_link);
  for (const p of reg.blueprint_series || []) if (p.payment_link) urls.add(p.payment_link);
  for (const m of reg.memberships || []) {
    for (const plan of m.plans || []) if (plan.payment_link) urls.add(plan.payment_link);
  }
  return urls;
}

async function enablePromoCodesOnAllPaymentLinks(stripe) {
  const targetUrls = collectPaymentLinkUrls();
  const results = { updated: 0, already_enabled: 0, errors: [] };
  let startingAfter;
  do {
    const page = await stripe.paymentLinks.list({ limit: 100, starting_after: startingAfter });
    for (const link of page.data) {
      if (!targetUrls.has(link.url)) continue;
      if (link.allow_promotion_codes) {
        results.already_enabled++;
        continue;
      }
      try {
        await stripe.paymentLinks.update(link.id, { allow_promotion_codes: true });
        results.updated++;
      } catch (err) {
        results.errors.push({ id: link.id, error: err.message });
      }
    }
    startingAfter = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (startingAfter);
  return results;
}

exports.handler = async (event) => {
  if (!isAuthorized(event)) {
    return json(401, { error: 'Unauthorized. Set ADMIN_TOKEN and send it as X-Admin-Token.' });
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  const liveKey = process.env.STRIPE_SECRET_KEY;
  const testKey = process.env.STRIPE_SECRET_KEY_TEST;
  const key = liveKey || testKey;
  if (!key) {
    return json(500, {
      error: 'Neither STRIPE_SECRET_KEY nor STRIPE_SECRET_KEY_TEST is configured. Set one in Netlify environment variables, then call this endpoint again.',
    });
  }

  const Stripe = require('stripe');
  const stripe = new Stripe(key, { apiVersion: '2024-06-20' });

  try {
    const membership = pricing.resolvePurchasable('membership', 'year');
    const founder = pricing.resolvePurchasable('founder', null);

    const codeResults = [];

    codeResults.push(
      await ensureFixedPriceCode(stripe, {
        code: 'LLABORIGINAL',
        priceId: membership && membership.priceId,
        targetCents: 10000, // $100
        duration: 'forever',
      })
    );

    codeResults.push(
      await ensurePercentOffCode(stripe, { code: 'LLABFRIEND', percentOff: 90, duration: 'once' })
    );

    codeResults.push(
      await ensureFixedPriceCode(stripe, {
        code: 'LLABINITIATE',
        priceId: founder && founder.priceId,
        targetCents: 2000, // $20
        duration: 'once',
      })
    );

    codeResults.push(
      await ensureFixedPriceCode(stripe, {
        code: 'LLABFOUNDING',
        priceId: membership && membership.priceId,
        targetCents: 10000, // $100
        duration: 'forever',
      })
    );

    codeResults.push(
      await ensureFixedPriceCode(stripe, {
        code: 'LLABSOVEREIGN',
        priceId: membership && membership.priceId,
        targetCents: 50000, // $500
        duration: 'forever',
      })
    );

    const paymentLinks = await enablePromoCodesOnAllPaymentLinks(stripe);

    return json(200, {
      mode: liveKey ? 'live' : 'test',
      codes: codeResults,
      payment_links: paymentLinks,
      llabtest_note:
        'LLABTEST is not created as a Stripe code here -- Stripe cannot discount many differently-priced products to the same flat $1 with one static code. That exact capability already exists as the owner-only $1 test-checkout tool built previously, which runs a real Checkout Session through the real webhook/fulfillment path.',
    });
  } catch (err) {
    console.error('admin-setup-promo-codes error', err);
    return json(500, { error: err.message || 'Stripe error creating promo codes.' });
  }
};
