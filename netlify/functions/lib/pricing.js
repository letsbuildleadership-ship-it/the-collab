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

module.exports = {
  registry,
  CATALOG_KEY,
  keyForPriceId,
  entryForKey,
  grantsForKey,
  unlocksCatalog,
  allCatalogProductKeys,
};
