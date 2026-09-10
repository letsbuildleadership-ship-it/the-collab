// Builds the JSON shape the account dashboard renders from a raw customer
// record. Shared by me.js (cookie/token sign-in) and login.js (Member ID +
// password sign-in) so both return the exact same data.
const pricing = require('./pricing');

function buildAccountView(record) {
  const entitlementSet = new Set(record.entitlements || []);
  const hasFullCatalog = Object.entries(record.memberships || {}).some(
    ([key, m]) => m.status === 'active' && pricing.unlocksCatalog(key)
  );

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
    memberId: record.memberId || null,
    hasPassword: !!record.passwordHash,
    memberOfCollab: true,
    memberships: record.memberships || {},
    hasFullCatalog,
    owned,
    locked,
    activityProgress: record.activityProgress || {},
  };
}

module.exports = { buildAccountView };
