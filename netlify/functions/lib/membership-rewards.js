// TRIARCH™ tier rewards for .LLab Membership™. Membership opens the Four
// Phases products while active; each time a member completes a TRIARCH™
// tier (every Four Phases product in that phase has all three mission
// steps done), they choose one extra product at no charge, theirs to keep.
// Higher tiers open higher-priced choices; each tier's choices include the
// lower tiers' price ranges.
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');

const STEPS_PER_ITEM = 3;

// Tier price caps live in content/portal.json (editable in the site admin).
const TIERS = (require('../../../content/portal.json').reward_tiers || []).map((t) => ({
  tier: Number(t.tier),
  key: String(t.name || '').toLowerCase(),
  name: t.name,
  phase: t.phase,
  maxPrice: Number(t.max_price),
}));

function membershipActive(record, now) {
  const m = membershipStatus.effectiveMemberships(record, now).membership;
  return !!(m && m.status === 'active');
}

function tierCompleted(record, tierDef) {
  const keys = pricing.fourPhasesKeys().filter((k) => (pricing.entryForKey(k) || {}).phase === tierDef.phase);
  if (!keys.length) return false;
  const progress = record.activityProgress || {};
  return keys.every((k) => new Set(progress[k] || []).size >= STEPS_PER_ITEM);
}

function ownedKeys(record, now) {
  return new Set([...membershipStatus.effectiveEntitlements(record, now), ...membershipStatus.catalogUnlockKeys(record, now)]);
}

/** Products this tier's reward can be, for this member (not already owned). */
function optionsFor(record, tierDef, now) {
  const owned = ownedKeys(record, now);
  return pricing
    .supplementalKeys()
    .filter((k) => !owned.has(k))
    .map((k) => {
      const e = pricing.entryForKey(k);
      return { key: k, name: e.name, price_display: e.price_display, price: pricing.priceDollars(e), description: e.description || null };
    })
    .filter((o) => o.price <= tierDef.maxPrice)
    .sort((a, b) => a.price - b.price || a.name.localeCompare(b.name));
}

/**
 * The member's TRIARCH™ progress and reward status per tier: each tier's
 * Four Phases products with steps done, whether it's complete, the pick
 * already made, and (with an active Membership) the choices available.
 * Always returned, so free members can see how rewards work.
 */
function rewardsStatus(record, now) {
  const active = membershipActive(record, now);
  const picks = record.membershipPicks || {};
  const progress = record.activityProgress || {};
  const tiers = TIERS.map((t) => {
    const pick = picks[t.tier] || null;
    const completed = tierCompleted(record, t);
    const canPick = active && completed && !pick;
    const products = pricing
      .fourPhasesKeys()
      .filter((k) => (pricing.entryForKey(k) || {}).phase === t.phase)
      .map((k) => ({ key: k, name: pricing.entryForKey(k).name, stepsDone: Math.min(STEPS_PER_ITEM, new Set(progress[k] || []).size), stepsTotal: STEPS_PER_ITEM }));
    return {
      tier: t.tier,
      name: t.name,
      phase: t.phase,
      maxPrice: t.maxPrice,
      completed,
      products,
      pick: pick ? { key: pick.key, name: (pricing.entryForKey(pick.key) || {}).name || pick.key, pickedAt: pick.pickedAt } : null,
      options: canPick ? optionsFor(record, t, now) : [],
    };
  });
  const all = tiers.flatMap((t) => t.products);
  return {
    active,
    productsTotal: all.length,
    productsCompleted: all.filter((p) => p.stepsDone >= p.stepsTotal).length,
    tiersCompleted: tiers.filter((t) => t.completed).length,
    picksClaimed: tiers.filter((t) => t.pick).length,
    tiers,
  };
}

/** Grants the chosen product for a tier. Throws with a member-facing message. */
function claimPick(record, tier, key, now) {
  const t = TIERS.find((x) => x.tier === Number(tier));
  if (!t) throw new Error('Unknown tier.');
  if (!membershipActive(record, now)) throw new Error('Your .LLab Membership™ needs to be active to choose a reward.');
  record.membershipPicks = record.membershipPicks || {};
  if (record.membershipPicks[t.tier]) throw new Error(`You've already chosen your ${t.name} reward.`);
  if (!tierCompleted(record, t)) throw new Error(`Complete every ${t.name} product's three steps first.`);
  if (!optionsFor(record, t, now).some((o) => o.key === key)) throw new Error(`That product isn't available as a ${t.name} reward.`);
  record.membershipPicks[t.tier] = { key, pickedAt: new Date(now || Date.now()).toISOString() };
  record.entitlements = Array.from(new Set([...(record.entitlements || []), key]));
  return record.membershipPicks[t.tier];
}

module.exports = { TIERS, rewardsStatus, claimPick, tierCompleted };
