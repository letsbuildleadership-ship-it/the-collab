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

  // The Blueprint™ magazine series: indexed so our webhook/download system
  // can grant self-serve access, but deliberately left out of
  // allCatalogProductKeys() below — it's a separate product line, not part
  // of the .LLab IV Phases catalog Membership unlocks or upsells.
  for (const p of registry.blueprint_series || []) {
    byKey.set(p.key, { ...p, kind: 'blueprint' });
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

  if (entry.kind === 'product' || entry.kind === 'blueprint') {
    if (!entry.stripe_price_id) return null;
    return { priceId: entry.stripe_price_id, mode: 'payment', interval: null, name: entry.name };
  }

  return null; // bonus products: granted automatically, not directly purchasable
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
  impactPartners,
  impactPartnerForKey,
  impactForKey,
  resolvePurchasable,
  founderRankForKey,
  founderLevelLabelForKey,
  founderTierKeys,
  isFounderDiscountExempt,
  paymentLinkMap,
};
