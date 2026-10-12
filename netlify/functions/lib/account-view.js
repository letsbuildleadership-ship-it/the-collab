// Builds the JSON shape the account dashboard renders from a raw customer
// record. Shared by me.js (cookie/token sign-in) and login.js (Member ID +
// password sign-in) so both return the exact same data.
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');
const freeTools = require('../../../content/free-tools.json').tools;
const { rewardsStatus } = require('./membership-rewards');

function buildAccountView(record, now) {
  // Expiry-aware: a lapsed Partnership membership term drops out here.
  const entitlementSet = new Set(membershipStatus.effectiveEntitlements(record, now));
  const hasFullCatalog = membershipStatus.hasFullCatalog(record, now);

  // Full-catalog members (active Membership) see and can open every IV
  // Phases product, not just whatever happens to be in their explicit
  // entitlements list — download.js already grants access on this same
  // basis, so the dashboard now matches what's actually downloadable.
  const ownedKeys = new Set([...entitlementSet, ...membershipStatus.catalogUnlockKeys(record, now)]);

  const owned = [];
  for (const key of ownedKeys) {
    const entry = pricing.entryForKey(key);
    if (!entry) continue;
    owned.push({ key, kind: entry.kind, name: entry.name, phase: entry.phase || null, pdf_file: entry.pdf_file || null });
  }

  // Snapshots: every one-time product the member doesn't own yet, with its
  // price and Buy link. Founders tiers are shown in their own section.
  const fourPhases = new Set(pricing.fourPhasesKeys());
  const founderTiers = new Set(pricing.founderTierKeys());
  const snapshot = (key) => {
    const entry = pricing.entryForKey(key);
    return {
      key,
      name: entry.name,
      phase: entry.phase || null,
      description: entry.description || null,
      price_display: entry.price_display,
      payment_link: entry.payment_link,
      includedWithMembership: fourPhases.has(key),
    };
  };
  const purchasable = [...pricing.allCatalogProductKeys(), ...(pricing.registry.blueprint_series || []).map((b) => b.key)];
  const locked = purchasable
    .filter((key) => !ownedKeys.has(key) && !founderTiers.has(key))
    .filter((key) => { const e = pricing.entryForKey(key); return e && e.payment_link; })
    .map(snapshot);
  const founderSnapshots = record.founder ? [] : [...founderTiers].filter((key) => (pricing.entryForKey(key) || {}).payment_link).map(snapshot);

  const memberships = membershipStatus.effectiveMemberships(record, now);
  const membershipEntry = pricing.entryForKey('membership');
  const membershipActive = !!(memberships.membership && memberships.membership.status === 'active');

  // A free member has an account but nothing purchased, granted, or held.
  const memberType =
    entitlementSet.size || record.partnership || record.founder || record.seat || Object.keys(record.memberships || {}).length
      ? 'member'
      : 'free';

  return {
    email: record.email,
    memberType,
    // Free tools: open to every member, free or paid.
    freeTools,
    // Shown while Membership isn't active: what it includes and how to join.
    membershipOffer:
      !membershipActive && membershipEntry
        ? { name: membershipEntry.name, description: membershipEntry.description, plans: membershipEntry.plans || [] }
        : null,
    name: record.name || null,
    memberId: record.memberId || null,
    hasPassword: !!record.passwordHash,
    memberOfCollab: true,
    memberships,
    partnership: record.partnership
      ? {
          key: record.partnership.key,
          tierLabel: record.partnership.tierLabel,
          purchasedAt: record.partnership.purchasedAt,
          expiresAt: record.partnership.expiresAt,
          seats: record.partnership.seats || 1,
          renewal: membershipStatus.partnershipRenewal(record, now),
          engagement: (pricing.entryForKey(record.partnership.key) || {}).engagement || null,
          seatsUsed: 1 + (record.partnership.seatHolders || []).length,
        }
      : null,
    // A seat on someone else's Partnership (lib/access.js), if any.
    seat: record.seat || null,
    hasFullCatalog,
    owned,
    locked,
    founderSnapshots,
    // TRIARCH™ progress and tier rewards (always present; picks need Membership).
    membershipRewards: rewardsStatus(record, now),
    activityProgress: record.activityProgress || {},
    // Level name always reflects the current catalog label, so Founders keep
    // the up-to-date name (e.g. after a level is renamed) without rewriting
    // their stored record. Founder Number and recognition date are untouched.
    founder: record.founder
      ? { ...record.founder, levelLabel: pricing.founderLevelLabelForKey(record.founder.level) || record.founder.levelLabel }
      : null,
  };
}

module.exports = { buildAccountView };
