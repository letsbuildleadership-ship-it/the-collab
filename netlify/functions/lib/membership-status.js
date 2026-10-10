// Membership expiry, enforced at read time. Subscription memberships carry
// currentPeriodEnd: null and stay active until Stripe tells us otherwise
// (stripe-webhook.js). Term memberships — granted by an Omnidirectional
// Enterprise™ Partnership — carry a fixed currentPeriodEnd and no
// subscription, so nothing ever fires when they lapse: every place that
// reads entitlements must go through these helpers instead of trusting
// `status === 'active'` alone. After expiry, partners renew at the regular
// membership prices (the normal Payment Links in content/pricing.json).
const pricing = require('./pricing');

function nowMs(now) {
  if (now == null) return Date.now();
  return now instanceof Date ? now.getTime() : Number(now);
}

/** Has this membership's fixed term run out? Subscriptions (no currentPeriodEnd) never expire here. */
function isExpired(m, now) {
  if (!m || !m.currentPeriodEnd) return false;
  const end = Date.parse(m.currentPeriodEnd);
  return Number.isFinite(end) && end <= nowMs(now);
}

/** Is this membership record currently granting access? */
function isMembershipActive(m, now) {
  return !!(m && m.status === 'active' && !isExpired(m, now));
}

/**
 * The customer's memberships as they stand right now: a lapsed term
 * membership reads as status 'expired' (with renewal info) rather than
 * 'active'. Never mutates the stored record.
 */
function effectiveMemberships(record, now) {
  const out = {};
  for (const [key, m] of Object.entries((record && record.memberships) || {})) {
    if (m && m.status === 'active' && isExpired(m, now)) {
      out[key] = { ...m, status: 'expired', renewal: renewalFor(key) };
    } else {
      out[key] = m;
    }
  }
  return out;
}

/** Regular-price plans a lapsed partner renews a membership at. */
function renewalFor(key) {
  const entry = pricing.entryForKey(key);
  if (!entry || entry.kind !== 'membership') return null;
  return (entry.plans || []).map((p) => ({ interval: p.interval, price_display: p.price_display, payment_link: p.payment_link }));
}

function activeMembershipKeys(record, now) {
  return Object.entries((record && record.memberships) || {})
    .filter(([, m]) => isMembershipActive(m, now))
    .map(([key]) => key);
}

/**
 * The customer's entitlement keys as they stand right now: membership keys
 * (and bonus grants that came only from a membership) drop out once that
 * membership has lapsed. One-time purchases are never affected.
 */
function effectiveEntitlements(record, now) {
  const stored = (record && record.entitlements) || [];
  const memberships = (record && record.memberships) || {};
  const active = new Set(activeMembershipKeys(record, now));

  const expiredKeys = new Set(
    Object.entries(memberships)
      .filter(([key, m]) => m && m.status === 'active' && !active.has(key))
      .map(([key]) => key)
  );
  if (!expiredKeys.size) return stored.slice();

  // A bonus key stays if a still-active membership grants it, or if it was
  // granted outright (e.g. by a Partnership purchase, recorded in
  // record.partnership.grantedKeys).
  const keep = new Set();
  for (const key of active) for (const g of pricing.grantsForKey(key)) keep.add(g);
  for (const g of (record.partnership && record.partnership.grantedKeys) || []) keep.add(g);

  const bonusFromExpired = new Set();
  for (const key of expiredKeys) for (const g of pricing.grantsForKey(key)) bonusFromExpired.add(g);

  return stored.filter((key) => {
    if (expiredKeys.has(key)) return false;
    if (bonusFromExpired.has(key) && !keep.has(key)) return false;
    return true;
  });
}

/** Does an active (non-expired) membership unlock the full one-time catalog? */
function hasFullCatalog(record, now) {
  return activeMembershipKeys(record, now).some((key) => pricing.unlocksCatalog(key));
}

module.exports = {
  isExpired,
  isMembershipActive,
  effectiveMemberships,
  effectiveEntitlements,
  activeMembershipKeys,
  hasFullCatalog,
  renewalFor,
};
