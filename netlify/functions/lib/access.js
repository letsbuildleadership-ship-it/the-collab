// Read-time access for Partnership seat holders. A seat holder's own record
// carries only `seatOf: { ownerToken, partnershipKey, addedAt }`; everything
// the seat gives them is derived here from the purchaser's record, and only
// while the purchaser's roster still lists them. So removing a seat (or the
// purchaser's term ending) takes effect immediately, with nothing to undo.
//
// Every place that decides access (download, account view, Legacy Library)
// passes the stored record through resolveAccess() and checks the result.
// The result is a view: never save it — save the original record.
const store = require('./store');
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');

function isListedSeat(owner, token) {
  const holders = (owner && owner.partnership && owner.partnership.seatHolders) || [];
  return holders.some((h) => h.token === token);
}

/** The purchaser's record if `record` currently holds a valid seat, else null. */
async function seatOwnerFor(record) {
  if (!record || !record.seatOf || !record.seatOf.ownerToken) return null;
  const owner = await store.getCustomerByToken(record.seatOf.ownerToken);
  if (!owner || !owner.partnership || !isListedSeat(owner, record.token)) return null;
  return owner;
}

/**
 * The record as access checks should see it: the customer's own grants,
 * plus (for a valid seat holder) the purchaser's Partnership products and
 * memberships on the purchaser's term. Memberships the customer holds
 * themselves always win over seat-derived ones.
 */
async function resolveAccess(record) {
  if (!record) return record;
  const owner = await seatOwnerFor(record);
  if (!owner) return record;

  const p = owner.partnership;
  const memberships = { ...(record.memberships || {}) };
  for (const key of pricing.membershipKeys()) {
    const own = memberships[key];
    const ownActive = own && own.status === 'active' && (!own.currentPeriodEnd || Date.parse(own.currentPeriodEnd) > Date.now());
    if (ownActive) continue;
    memberships[key] = {
      status: 'active',
      interval: null,
      subscriptionId: null,
      currentPeriodEnd: p.expiresAt,
      source: 'partnership-seat',
      partnershipKey: p.key,
    };
  }

  const releaseOwner = membershipStatus.partnershipReleaseKeys(owner);
  const seatKeys = Array.from(new Set([...(p.grantedKeys || []), ...releaseOwner]));

  return {
    ...record,
    memberships,
    entitlements: Array.from(new Set([...(record.entitlements || []), ...pricing.membershipKeys()])),
    seatGrantedKeys: seatKeys,
    seat: {
      tierLabel: p.tierLabel,
      partnershipKey: p.key,
      expiresAt: p.expiresAt,
      sponsorName: owner.name || null,
      addedAt: record.seatOf.addedAt || null,
    },
  };
}

module.exports = { resolveAccess, seatOwnerFor, isListedSeat };
