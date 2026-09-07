// Core entitlement-granting logic, shared by the Stripe webhook (source of
// truth, fires async after payment) and verify-session (synchronous
// fallback used right after checkout, in case the webhook hasn't landed
// yet). Both call fulfillCheckoutSession with the same idempotent effect:
// running it twice for the same session just re-confirms the same grants.
const store = require('./store');
const pricing = require('./pricing');

function uniq(arr) {
  return Array.from(new Set(arr));
}

/**
 * @param {object} session - a Stripe Checkout Session (checkout.session.completed
 *   object, or the result of sessions.retrieve).
 * @param {string[]} priceIds - price IDs purchased in this session (from its line items).
 */
async function fulfillCheckoutSession(session, priceIds) {
  const email = (session.customer_details && session.customer_details.email) || session.customer_email;
  if (!email) return null;

  const { token, record } = await store.getOrCreateCustomerByEmail(email);

  if (session.customer && !record.stripeCustomerId) {
    record.stripeCustomerId = session.customer;
    await store.linkStripeCustomer(session.customer, token);
  }

  const grantedKeys = [];

  for (const priceId of priceIds) {
    const key = pricing.keyForPriceId(priceId);
    if (!key) continue; // price belongs to an unrelated product on the same Stripe account
    const entry = pricing.entryForKey(key);
    grantedKeys.push(key);

    if (entry.kind === 'membership') {
      const plan = (entry.plans || []).find((p) => p.stripe_price_id === priceId);
      record.memberships[key] = {
        status: 'active',
        interval: plan ? plan.interval : null,
        subscriptionId: session.subscription || null,
        currentPeriodEnd: null,
      };
      if (session.subscription) {
        await store.linkSubscription(session.subscription, token, key);
      }
      for (const bonusKey of pricing.grantsForKey(key)) grantedKeys.push(bonusKey);
    }

    record.purchases.push({
      key,
      priceId,
      sessionId: session.id,
      amount: session.amount_total ?? null,
      currency: session.currency || 'usd',
      purchasedAt: new Date().toISOString(),
    });
  }

  record.entitlements = uniq([...(record.entitlements || []), ...grantedKeys]);
  await store.saveCustomer(record);
  return { token, record, grantedKeys };
}

/** Recompute entitlements after a membership is revoked (cancellation). */
async function revokeMembership(token, membershipKey) {
  const record = await store.getCustomerByToken(token);
  if (!record) return null;

  if (record.memberships[membershipKey]) {
    record.memberships[membershipKey].status = 'canceled';
  }

  // Drop the membership key itself; keep bonus grants only if another
  // still-active membership also grants them.
  const stillActiveGrants = new Set();
  for (const [key, m] of Object.entries(record.memberships)) {
    if (m.status === 'active') {
      for (const g of pricing.grantsForKey(key)) stillActiveGrants.add(g);
    }
  }

  const bonusKeysFromThis = new Set(pricing.grantsForKey(membershipKey));
  record.entitlements = (record.entitlements || []).filter((key) => {
    if (key === membershipKey) return false;
    if (bonusKeysFromThis.has(key) && !stillActiveGrants.has(key)) return false;
    return true;
  });

  await store.saveCustomer(record);
  return record;
}

async function reactivateMembership(token, membershipKey) {
  const record = await store.getCustomerByToken(token);
  if (!record) return null;
  if (record.memberships[membershipKey]) {
    record.memberships[membershipKey].status = 'active';
  }
  record.entitlements = Array.from(
    new Set([...(record.entitlements || []), membershipKey, ...pricing.grantsForKey(membershipKey)])
  );
  await store.saveCustomer(record);
  return record;
}

module.exports = { fulfillCheckoutSession, revokeMembership, reactivateMembership };
