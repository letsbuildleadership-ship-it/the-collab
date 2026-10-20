// Builds the JSON shape the account dashboard renders from a raw customer
// record. Shared by me.js (cookie/token sign-in) and login.js (Member ID +
// password sign-in) so both return the exact same data.
const pricing = require('./pricing');
const membershipStatus = require('./membership-status');
const { isConfigured: emailConfigured } = require('./mailer');
const questLib = require('./quests');
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
      line: entry.kind === 'blueprint' ? 'blueprint' : entry.line || (fourPhases.has(key) ? 'four-phases' : founderTiers.has(key) ? 'founders' : 'other'),
    };
  };
  // Blueprint™ bundle: the Complete Edition covers every issue, and owning
  // every issue covers the Complete Edition, so neither is offered again.
  const covered = new Set(ownedKeys);
  const issueKeys = (pricing.registry.blueprint_series || []).map((b) => b.key).filter((k) => k !== 'blueprint-complete');
  if (covered.has('blueprint-complete')) issueKeys.forEach((k) => covered.add(k));
  if (issueKeys.length && issueKeys.every((k) => covered.has(k))) covered.add('blueprint-complete');

  const purchasable = [...pricing.allCatalogProductKeys(), ...(pricing.registry.blueprint_series || []).map((b) => b.key)];
  const locked = purchasable
    .filter((key) => !covered.has(key) && !founderTiers.has(key))
    .filter((key) => { const e = pricing.entryForKey(key); return e && e.payment_link; })
    .map(snapshot);
  // Partnership tiers to offer anyone without a Partnership or seat.
  const partnershipOffers =
    record.partnership || record.seat
      ? []
      : (pricing.registry.partnerships || []).map((t) => ({
          key: t.key,
          tier: t.tier_label,
          price_display: t.price_display,
          tagline: t.tagline || null,
          best_for: t.best_for || null,
          seats: t.seats || 1,
          lifetime: !!t.lifetime,
          term_months: t.term_months || 12,
          payment_link: t.payment_link || null,
        }));
  const founderSnapshots = record.founder ? [] : [...founderTiers].filter((key) => (pricing.entryForKey(key) || {}).payment_link).map(snapshot);

  const memberships = membershipStatus.effectiveMemberships(record, now);
  const membershipEntry = pricing.entryForKey('membership');
  const membershipActive = !!(memberships.membership && memberships.membership.status === 'active');

  // A free member has an account but nothing purchased, granted, or held.
  const memberType =
    entitlementSet.size || record.partnership || record.founder || record.seat || Object.keys(record.memberships || {}).length
      ? 'member'
      : 'free';

  // Buy links (Stripe Payment Links) for things this member already has, so
  // store pages can show "In your library" instead of a Buy button.
  const ownedLinks = [];
  const addLink = (href, label) => { if (href) ownedLinks.push({ href, label }); };
  for (const key of covered) {
    const e = pricing.entryForKey(key);
    if (e && (e.kind === 'product' || e.kind === 'blueprint') && !founderTiers.has(key)) addLink(e.payment_link, 'In your library');
  }
  for (const [key, m] of Object.entries(memberships)) {
    if (m && m.status === 'active') for (const plan of (pricing.entryForKey(key) || {}).plans || []) addLink(plan.payment_link, 'Active');
  }
  if (record.founder) {
    for (const key of founderTiers) {
      if ((pricing.founderRankForKey(key) || 0) <= (record.founder.rank || 0)) addLink((pricing.entryForKey(key) || {}).payment_link, 'Your Founder level');
    }
  }
  const p = record.partnership;
  if (p && p.expiresAt && Date.parse(p.expiresAt) > Date.now()) {
    for (const t of pricing.registry.partnerships || []) {
      if (pricing.partnershipRank(t.key) <= pricing.partnershipRank(p.key)) addLink(t.payment_link, t.key === p.key ? 'Your Partnership' : 'Included in yours');
    }
  }

  return {
    email: record.email,
    ownedLinks,
    memberType,
    // Free tools: open to every member, free or paid.
    freeTools,
    // Guided quests: status per quest key (draft / done) for the portal cards and report list.
    // Companies that license Co.LLab™ IP or hold a Membership can join the Collaborating Companies.
    directoryEligible: require('./directory').isEligible(record),
    // Quests open to every signed-in member that are not tied to a product (for example .LLab Sound™).
    openQuests: [...questLib.quests.values()].filter((q) => q.open).map((q) => ({ key: q.key, name: q.title, phase: q.phase, description: q.intro })),
    questKeys: [...questLib.quests.keys()],
    // The nine Four Phases quests every signed-in member can work through; Membership analyzes the answers.
    gameQuests: pricing.fourPhasesKeys().map((k) => pricing.entryForKey(k)).filter(Boolean).map((e) => ({ key: e.key, name: e.name, phase: e.phase })),
    quests: Object.fromEntries(Object.entries(record.quests || {}).map(([k, v]) => [k, { status: v.status, completedAt: v.completedAt || null }])),
    // Shown while Membership isn't active: what it includes and how to join.
    membershipOffer:
      !membershipActive && membershipEntry
        ? { name: membershipEntry.name, description: membershipEntry.description, plans: membershipEntry.plans || [] }
        : null,
    name: record.name || null,
    memberId: record.memberId || null,
    hasPassword: !!record.passwordHash,
    // false only for free sign-ups that have not confirmed their email yet
    emailVerified: record.signupSource === 'free' ? record.emailVerified === true : true,
    // the site can only ask for confirmation when it can actually send the email
    emailEnabled: emailConfigured(),
    memberOfCollab: true,
    memberships,
    partnership: record.partnership
      ? {
          key: record.partnership.key,
          tierLabel: record.partnership.tierLabel,
          purchasedAt: record.partnership.purchasedAt,
          expiresAt: record.partnership.expiresAt,
          seats: record.partnership.seats || 1,
          lifetime: !!(pricing.entryForKey(record.partnership.key) || {}).lifetime,
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
    partnershipOffers,
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
