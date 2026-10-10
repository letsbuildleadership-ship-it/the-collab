// Manual grant/revoke for the owner's admin console (admin-customers.js).
// Kept as pure functions over a customer record so they're unit-testable.
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');

/** Keys the owner can grant by hand: products, Blueprint™ issues, bonus items, memberships. */
function grantableKeys() {
  const r = pricing.registry;
  return [
    ...(r.products || []),
    ...(r.blueprint_series || []),
    ...(r.bonus_products || []),
    ...(r.memberships || []),
  ].map((e) => ({ key: e.key, name: e.name, kind: pricing.entryForKey(e.key).kind }));
}

/**
 * Grant a key. A membership is set active as a complimentary membership
 * (no subscription, no end date) so it actually unlocks access — the
 * catalog, the Legacy Library — not just an entry in the entitlement list.
 * A membership that's already active (paid or via Partnership) is left as is.
 */
function grantKey(record, key, now) {
  const entry = pricing.entryForKey(key);
  if (!entry || entry.kind === 'partnership') throw new Error('Unknown or non-grantable key.');
  record.memberships = record.memberships || {};
  const added = [key];

  if (entry.kind === 'membership') {
    if (!membershipStatus.isMembershipActive(record.memberships[key], now)) {
      record.memberships[key] = {
        status: 'active',
        interval: null,
        subscriptionId: null,
        currentPeriodEnd: null,
        source: 'admin',
      };
    }
    added.push(...pricing.grantsForKey(key));
  }

  record.entitlements = Array.from(new Set([...(record.entitlements || []), ...added]));
  return record;
}

/**
 * Revoke a key. For a membership this also drops its bonus grants unless
 * another active membership or a Partnership still provides them. It does
 * NOT stop Stripe billing — returns a warning when a subscription is attached.
 */
function revokeKey(record, key, now) {
  record.memberships = record.memberships || {};
  let warning = null;
  const m = record.memberships[key];

  if (m) {
    if (m.subscriptionId && m.status === 'active') {
      warning = `Access removed, but Stripe subscription ${m.subscriptionId} is still billing. Cancel it in Stripe.`;
    }
    delete record.memberships[key];

    const keep = new Set((record.partnership && record.partnership.grantedKeys) || []);
    for (const other of membershipStatus.activeMembershipKeys(record, now)) {
      for (const g of pricing.grantsForKey(other)) keep.add(g);
    }
    const drop = new Set([key, ...pricing.grantsForKey(key).filter((g) => !keep.has(g))]);
    record.entitlements = (record.entitlements || []).filter((k) => !drop.has(k));
  } else {
    record.entitlements = (record.entitlements || []).filter((k) => k !== key);
  }
  return { record, warning };
}

/** Short Partnership summary for the admin list. */
function partnershipSummary(record, now) {
  const p = record.partnership;
  if (!p) return null;
  const renewal = membershipStatus.partnershipRenewal(record, now);
  return {
    tierLabel: p.tierLabel,
    purchasedAt: p.purchasedAt,
    expiresAt: p.expiresAt,
    status: renewal ? renewal.status : 'active',
    seats: p.seats || 1,
  };
}

module.exports = { grantableKeys, grantKey, revokeKey, partnershipSummary };
