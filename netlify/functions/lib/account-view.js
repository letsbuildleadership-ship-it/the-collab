// Builds the JSON shape the account dashboard renders from a raw customer
// record. Shared by me.js (cookie/token sign-in) and login.js (Member ID +
// password sign-in) so both return the exact same data.
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');

function buildAccountView(record, now) {
  // Expiry-aware: a lapsed Partnership membership term drops out here.
  const entitlementSet = new Set(membershipStatus.effectiveEntitlements(record, now));
  const hasFullCatalog = membershipStatus.hasFullCatalog(record, now);

  // Full-catalog members (active Membership) see and can open every IV
  // Phases product, not just whatever happens to be in their explicit
  // entitlements list — download.js already grants access on this same
  // basis, so the dashboard now matches what's actually downloadable.
  const ownedKeys = hasFullCatalog ? new Set([...entitlementSet, ...pricing.allCatalogProductKeys()]) : entitlementSet;

  const owned = [];
  for (const key of ownedKeys) {
    const entry = pricing.entryForKey(key);
    if (!entry) continue;
    owned.push({ key, kind: entry.kind, name: entry.name, phase: entry.phase || null, pdf_file: entry.pdf_file || null });
  }

  const locked = [];
  if (!hasFullCatalog) {
    for (const key of pricing.allCatalogProductKeys()) {
      if (!entitlementSet.has(key)) {
        const entry = pricing.entryForKey(key);
        locked.push({ key, name: entry.name, phase: entry.phase, price_display: entry.price_display, payment_link: entry.payment_link });
      }
    }
  }

  return {
    email: record.email,
    name: record.name || null,
    memberId: record.memberId || null,
    hasPassword: !!record.passwordHash,
    memberOfCollab: true,
    memberships: membershipStatus.effectiveMemberships(record, now),
    partnership: record.partnership
      ? {
          key: record.partnership.key,
          tierLabel: record.partnership.tierLabel,
          purchasedAt: record.partnership.purchasedAt,
          expiresAt: record.partnership.expiresAt,
          seats: record.partnership.seats || 1,
          renewal: membershipStatus.partnershipRenewal(record, now),
        }
      : null,
    hasFullCatalog,
    owned,
    locked,
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
