// Loads the canonical product/pricing registry (content/pricing.json) and
// builds lookup maps used by the webhook and delivery functions. The JSON
// file is the single source of truth an admin edits via /admin (Decap CMS);
// this module just indexes it for fast lookups at request time.
const registry = require('../../../content/pricing.json');

const CATALOG_KEY = 'llab-catalog';

function buildIndex() {
  const byKey = new Map();
  const byPriceId = new Map();

  for (const p of registry.products || []) {
    byKey.set(p.key, { ...p, kind: 'product' });
    if (p.stripe_price_id) byPriceId.set(p.stripe_price_id, p.key);
  }

  for (const m of registry.memberships || []) {
    byKey.set(m.key, { ...m, kind: 'membership' });
    for (const plan of m.plans || []) {
      if (plan.stripe_price_id) byPriceId.set(plan.stripe_price_id, m.key);
    }
  }

  for (const b of registry.bonus_products || []) {
    byKey.set(b.key, { ...b, kind: 'bonus' });
  }

  // The .LLab Blueprint™ magazine series: indexed so our webhook/download system
  // can grant self-serve access, but deliberately left out of
  // allCatalogProductKeys() below — it's a separate product line, not part
  // of the .LLab IV Phases catalog Membership unlocks or upsells.
  for (const p of registry.blueprint_series || []) {
    byKey.set(p.key, { ...p, kind: 'blueprint' });
    if (p.stripe_price_id) byPriceId.set(p.stripe_price_id, p.key);
  }

  // Partner-only IP (one per phase): granted by Partnership tiers, and sold
  // on its own once it has a Stripe price. Not opened by Membership.
  for (const p of registry.partner_ip || []) {
    byKey.set(p.key, { ...p, kind: 'partner-ip' });
    if (p.stripe_price_id) byPriceId.set(p.stripe_price_id, p.key);
  }

  // Omnidirectional Enterprise™ Partnerships: one-time purchases, fully
  // separate from the Founders Organization (no founder_rank, no impact,
  // founder_discount_exempt). Left out of paymentLinkMap() so the Founder
  // checkout rewrite never touches these links.
  for (const p of registry.partnerships || []) {
    byKey.set(p.key, { ...p, kind: 'partnership' });
    if (p.stripe_price_id) byPriceId.set(p.stripe_price_id, p.key);
  }

  return { byKey, byPriceId };
}

let cached = null;
function index() {
  if (!cached) cached = buildIndex();
  return cached;
}

/** Resolve a Stripe price ID to our internal product/membership key. */
function keyForPriceId(priceId) {
  return index().byPriceId.get(priceId) || null;
}

/** Look up the full registry entry for an internal key. */
function entryForKey(key) {
  return index().byKey.get(key) || null;
}

/** Bonus product keys automatically granted alongside a membership purchase. */
function grantsForKey(key) {
  const entry = entryForKey(key);
  return (entry && entry.grants) || [];
}

/** Does this membership key unlock the full one-time .LLab product catalog? */
function unlocksCatalog(key) {
  const entry = entryForKey(key);
  return !!(entry && entry.unlocks_catalog);
}

/** All one-time product keys (the IV Phases + Founders ladder). */
function allCatalogProductKeys() {
  return (registry.products || []).map((p) => p.key);
}

const FOUR_PHASES = [
  'Phase I · Foundations',
  'Phase II · Infrastructure Planning & Management',
  'Phase III · Internal Operating Systems',
  'Phase IV · Preservation',
];

/**
 * The Four Phases products: the Leadership Infrastructure™ products in
 * Phases I–IV (not the Creator line, not the Founders tiers). This is what
 * .LLab Membership™ opens while it's active.
 */
function fourPhasesKeys() {
  return (registry.products || []).filter((p) => FOUR_PHASES.includes(p.phase) && p.line !== 'creator').map((p) => p.key);
}

/** "$1,000" -> 1000; null when there's no dollar price. */
function priceDollars(entry) {
  const m = entry && typeof entry.price_display === 'string' && entry.price_display.replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

/**
 * Products a member can choose as a TRIARCH™ tier reward: every one-time
 * product we sell (catalog + Blueprint™ issues) except the Four Phases
 * products (already in Membership) and the Founders tiers.
 */
function supplementalKeys() {
  const four = new Set(fourPhasesKeys());
  const founders = new Set(founderTierKeys());
  return [...(registry.products || []), ...(registry.blueprint_series || [])]
    .map((p) => p.key)
    .filter((k) => !four.has(k) && !founders.has(k) && priceDollars(entryForKey(k)) != null);
}

/**
 * Resolve any purchasable catalog key (one-time product, blueprint issue, or
 * membership) to a Stripe price id + Checkout mode. Bonus products aren't
 * sold directly (they're granted automatically alongside a membership or
 * Library Card), so they resolve to null here. Used by the owner-only
 * test-checkout endpoint (admin-test-checkout.js) to build a real Checkout
 * Session for any catalog item without hardcoding price ids twice.
 */
function resolvePurchasable(key, interval) {
  const entry = entryForKey(key);
  if (!entry) return null;

  if (entry.kind === 'membership') {
    const plans = entry.plans || [];
    const plan = plans.find((p) => p.interval === interval) || plans[0];
    if (!plan || !plan.stripe_price_id) return null;
    return { priceId: plan.stripe_price_id, mode: 'subscription', interval: plan.interval, name: entry.name };
  }

  if (entry.kind === 'product' || entry.kind === 'blueprint' || entry.kind === 'partnership') {
    if (!entry.stripe_price_id) return null;
    return { priceId: entry.stripe_price_id, mode: 'payment', interval: null, name: entry.name };
  }

  return null; // bonus products: granted automatically, not directly purchasable
}

/** All Partnership tier keys, in registry order (lowest tier first). */
function partnershipKeys() {
  return (registry.partnerships || []).map((p) => p.key);
}

/**
 * Every key a Partnership purchase grants permanently: all one-time
 * products except the Founders tiers, every Blueprint™ issue, and every
 * bonus product. Memberships are granted separately, on a fixed term.
 */
function partnershipGrantKeys() {
  // A product with a future released_at isn't out yet: it reaches qualifying
  // partners only through eligibleReleaseKeys once it's released.
  const released = (p) => !p.released_at || !(Date.parse(p.released_at) > Date.now());
  return [
    ...(registry.products || []).filter((p) => !p.founder_rank && released(p)).map((p) => p.key),
    ...(registry.blueprint_series || []).filter(released).map((p) => p.key),
    ...(registry.bonus_products || []).map((p) => p.key),
    ...(registry.partner_ip || []).map((p) => p.key),
  ];
}

/**
 * Keys a specific Partnership tier grants permanently. 'designated' tiers
 * list theirs in `grants`; 'complete' tiers get the full set
 * (partnershipGrantKeys). Founders tiers are never included either way.
 */
function partnershipGrantKeysFor(key) {
  const entry = entryForKey(key);
  if (!entry || entry.kind !== 'partnership') return [];
  if (entry.grant_scope === 'complete') return partnershipGrantKeys();
  const allowed = new Set(partnershipGrantKeys());
  return (entry.grants || []).filter((k) => allowed.has(k));
}

/** Tier rank (1 = Partner … 4 = Omnidirectional); 0 if not a Partnership. */
function partnershipRank(key) {
  const entry = entryForKey(key);
  return (entry && entry.kind === 'partnership' && entry.rank) || 0;
}

/**
 * Designated eligible releases: products or Blueprint™ issues marked
 * "partnership_release": true whose "released_at" falls inside [startIso, endIso).
 */
function eligibleReleaseKeys(startIso, endIso) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end)) return [];
  return [...(registry.products || []), ...(registry.blueprint_series || [])]
    .filter((p) => p.partnership_release && !p.founder_rank)
    .filter((p) => {
      const at = Date.parse(p.released_at);
      return Number.isFinite(at) && at >= start && at < end;
    })
    .map((p) => p.key);
}

/** Every membership key (membership, library-card, journal). */
function membershipKeys() {
  return (registry.memberships || []).map((m) => m.key);
}

/** All registered Impact nonprofit partners. */
function impactPartners() {
  return registry.impact_partners || [];
}

/** Look up one Impact partner by key. */
function impactPartnerForKey(partnerKey) {
  return impactPartners().find((p) => p.key === partnerKey) || null;
}

/** { partner_key, percent } if this product/membership key is a designated Impact Product, else null. */
function impactForKey(key) {
  const entry = entryForKey(key);
  return (entry && entry.impact) || null;
}

/** Numeric Founder tier rank (higher = higher tier) if this key is a Founder-level product, else null. */
function founderRankForKey(key) {
  const entry = entryForKey(key);
  return (entry && entry.founder_rank) || null;
}

/** Short display label for a Founder tier ("Founder", "Legacy Founder"), falling back to the product name. */
function founderLevelLabelForKey(key) {
  const entry = entryForKey(key);
  if (!entry) return key;
  return entry.founder_level_label || entry.name;
}

/** All catalog keys that are Founder-tier products, ordered by rank ascending. */
function founderTierKeys() {
  return (registry.products || [])
    .filter((p) => p.founder_rank)
    .sort((a, b) => a.founder_rank - b.founder_rank)
    .map((p) => p.key);
}

/** Is this key exempt from the automatic Founder 20% discount (e.g. the Founder tiers themselves)? */
function isFounderDiscountExempt(key) {
  const entry = entryForKey(key);
  return !!(entry && entry.founder_discount_exempt);
}

/**
 * Public map of every live Stripe Payment Link on the site to its catalog
 * key (+ interval, for subscriptions) — lets client-side code recognize a
 * "Buy" link it's looking at without hardcoding URLs. Nothing sensitive:
 * payment_link URLs are already public on every page.
 */
function paymentLinkMap() {
  const map = {};
  for (const p of registry.products || []) {
    if (p.payment_link) map[p.payment_link] = { key: p.key, interval: null };
  }
  for (const p of registry.blueprint_series || []) {
    if (p.payment_link) map[p.payment_link] = { key: p.key, interval: null };
  }
  for (const m of registry.memberships || []) {
    for (const plan of m.plans || []) {
      if (plan.payment_link) map[plan.payment_link] = { key: m.key, interval: plan.interval };
    }
  }
  return map;
}

module.exports = {
  registry,
  CATALOG_KEY,
  keyForPriceId,
  entryForKey,
  grantsForKey,
  unlocksCatalog,
  allCatalogProductKeys,
  FOUR_PHASES,
  fourPhasesKeys,
  priceDollars,
  supplementalKeys,
  impactPartners,
  impactPartnerForKey,
  impactForKey,
  resolvePurchasable,
  founderRankForKey,
  founderLevelLabelForKey,
  founderTierKeys,
  isFounderDiscountExempt,
  paymentLinkMap,
  partnershipKeys,
  partnershipGrantKeys,
  partnershipGrantKeysFor,
  partnershipRank,
  eligibleReleaseKeys,
  membershipKeys,
};
