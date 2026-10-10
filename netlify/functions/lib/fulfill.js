// Core entitlement-granting logic, shared by the Stripe webhook (source of
// truth, fires async after payment) and verify-session (synchronous
// fallback used right after checkout, in case the webhook hasn't landed
// yet). Both call fulfillCheckoutSession with the same idempotent effect:
// running it twice for the same session just re-confirms the same grants.
const store = require('./store');
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');

function uniq(arr) {
  return Array.from(new Set(arr));
}

/** Calendar-month add in UTC (Jan 31 + 1 month clamps to the last day of Feb). */
function addMonths(date, months) {
  const d = new Date(date.getTime());
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/**
 * Omnidirectional Enterprise™ Partnership grant. Fully separate from the
 * Founders Organization: no Founder recognition, no Founder discount, no
 * impact allocation. Grants every one-time product except the Founders
 * tiers, every Blueprint™ issue, and every bonus product permanently, and
 * sets every membership active for term_months (12) from purchase with no
 * subscription — membership-status.js enforces the expiry at read time.
 *
 * Idempotent per Checkout Session: the webhook and verify-session both
 * call this, and the term is anchored to the session's own creation time,
 * so a second run re-confirms the same end date rather than extending it.
 *
 * TODO(multi-seat): purchaser-only for now (seats: 1). Multi-seat will need
 * a seat roster on record.partnership (invited emails -> customer tokens)
 * and the same grants applied to each seat holder's record.
 */
function applyPartnership(record, entry, session) {
  const purchasedAt = session.created ? new Date(session.created * 1000) : new Date();
  const termMonths = entry.term_months || 12;
  const periodEnd = addMonths(purchasedAt, termMonths).toISOString();
  const productKeys = pricing.partnershipGrantKeys();

  for (const membershipKey of pricing.membershipKeys()) {
    const existing = record.memberships[membershipKey];
    // Never cut short a longer term from an earlier Partnership purchase.
    if (existing && existing.source === 'partnership' && existing.currentPeriodEnd > periodEnd) continue;
    record.memberships[membershipKey] = {
      status: 'active',
      interval: null,
      subscriptionId: null,
      currentPeriodEnd: periodEnd,
      source: 'partnership',
      partnershipKey: entry.key,
    };
  }

  const prior = record.partnership || {};
  const keepPrior = prior.expiresAt && prior.expiresAt > periodEnd;
  record.partnership = {
    key: keepPrior ? prior.key : entry.key,
    tierLabel: keepPrior ? prior.tierLabel : entry.tier_label || entry.name,
    sessionId: keepPrior ? prior.sessionId : session.id,
    purchasedAt: keepPrior ? prior.purchasedAt : purchasedAt.toISOString(),
    expiresAt: keepPrior ? prior.expiresAt : periodEnd,
    seats: 1, // TODO(multi-seat): honor entry.seats once seat assignment exists.
    grantedKeys: uniq([...(prior.grantedKeys || []), ...productKeys]),
  };

  return [...productKeys, ...pricing.membershipKeys()];
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

  // Capture the purchaser's name for the Founder Card / account dashboard,
  // if Stripe collected one on this session. Never overwrites a name we
  // already have with a blank one.
  const sessionName = session.customer_details && session.customer_details.name;
  if (sessionName && !record.name) {
    record.name = sessionName;
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

    if (entry.kind === 'partnership') {
      for (const k of applyPartnership(record, entry, session)) grantedKeys.push(k);
    }

    // Impact Products: if this key is flagged with a nonprofit partner,
    // record the 10% (or whatever percent is configured) allocation in the
    // auditable ledger. Assumes one line item per checkout session, which
    // holds for every Payment Link on this site today (same assumption the
    // purchases.push amount below already makes).
    const impact = pricing.impactForKey(key);
    if (impact && impact.partner_key && session.amount_total != null) {
      const impactAmount = Math.round((session.amount_total * (impact.percent || 10)) / 100);
      await store.recordImpactAllocation({
        sessionId: session.id,
        priceKey: key,
        partnerKey: impact.partner_key,
        percent: impact.percent || 10,
        grossAmount: session.amount_total,
        impactAmount,
        currency: session.currency || 'usd',
      });
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

  // Founder Recognition: any Founder-tier product in this purchase
  // automatically recognizes the purchaser under that Founder level. The
  // Founder Number is assigned once, the first time, and is permanent —
  // buying a higher Founder tier later upgrades the recognized level (and
  // keeps a history of every tier held) without ever reassigning the
  // number or the original recognition date. This never touches pricing —
  // it only records recognition after payment has already completed.
  let highestNewRank = 0;
  let highestNewKey = null;
  for (const key of grantedKeys) {
    const rank = pricing.founderRankForKey(key);
    if (rank && rank > highestNewRank) {
      highestNewRank = rank;
      highestNewKey = key;
    }
  }
  if (highestNewKey) {
    if (!record.founder) {
      record.founder = {
        founderNumber: await store.nextFounderNumber(),
        level: highestNewKey,
        levelLabel: pricing.founderLevelLabelForKey(highestNewKey),
        rank: highestNewRank,
        recognizedAt: new Date().toISOString(),
        name: record.name || null,
        levels: [highestNewKey],
      };
    } else {
      if (!record.founder.levels) record.founder.levels = [record.founder.level];
      if (!record.founder.levels.includes(highestNewKey)) record.founder.levels.push(highestNewKey);
      if (highestNewRank > (record.founder.rank || 0)) {
        record.founder.level = highestNewKey;
        record.founder.levelLabel = pricing.founderLevelLabelForKey(highestNewKey);
        record.founder.rank = highestNewRank;
      }
      if (record.name && !record.founder.name) record.founder.name = record.name;
    }
  }

  record.entitlements = uniq([...(record.entitlements || []), ...grantedKeys]);
  await store.saveCustomer(record);
  return { token, record, grantedKeys };
}

/** Recompute entitlements after a membership is revoked (cancellation). */
async function revokeMembership(token, membershipKey) {
  const record = await store.getCustomerByToken(token);
  if (!record) return null;

  const current = record.memberships[membershipKey];
  // A Partnership term replaced this membership's old subscription; a late
  // cancellation of that subscription must not cut the paid term short.
  if (current && current.source === 'partnership' && !membershipStatus.isExpired(current)) {
    return record;
  }

  if (current) {
    current.status = 'canceled';
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
  const current = record.memberships[membershipKey];
  if (current) {
    current.status = 'active';
    // A subscription is active again: it, not a lapsed Partnership term,
    // now governs this membership.
    if (current.source === 'partnership' && membershipStatus.isExpired(current)) {
      current.currentPeriodEnd = null;
      delete current.source;
      delete current.partnershipKey;
    }
  }
  record.entitlements = Array.from(
    new Set([...(record.entitlements || []), membershipKey, ...pricing.grantsForKey(membershipKey)])
  );
  await store.saveCustomer(record);
  return record;
}

module.exports = { fulfillCheckoutSession, revokeMembership, reactivateMembership, _addMonths: addMonths };
