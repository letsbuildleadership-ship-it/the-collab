// Customer / entitlement storage on Netlify Blobs. No external database or
// credentials required — Netlify auto-configures Blobs inside Functions.
//
// Layout (all JSON documents in the "collab-customers" store):
//   customers/{token}.json        -> full customer record (see newCustomer)
//   by-email/{emailHash}.json     -> { token }               (find existing account on repeat purchase)
//   by-subscription/{subId}.json  -> { token, membershipKey } (resolve subscription webhook events)
//   by-stripe-customer/{custId}.json -> { token }             (resolve customer-level webhook events)
//   by-member-id/{memberId}.json  -> { token }               (Member ID + password login)
//   meta/member-id-seq.json       -> { seq }                 (counter behind sequential Member IDs)
const crypto = require('crypto');
const { getStore } = require('@netlify/blobs');

// Netlify normally auto-configures Blobs for Functions with zero setup. In
// this site's runtime that automatic context is missing (a Netlify-side
// gap, not something under our control), so we fall back to manual
// configuration with a Personal Access Token whenever the automatic
// context isn't there. Harmless no-op if Netlify ever starts auto-injecting
// it again — the manual branch is only used when NETLIFY_BLOBS_CONTEXT is
// absent.
function store() {
  if (!process.env.NETLIFY_BLOBS_CONTEXT && process.env.NETLIFY_BLOBS_TOKEN && process.env.SITE_ID) {
    return getStore({
      name: 'collab-customers',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore('collab-customers');
}

// A second, separate Blobs store for member-authored Community Reflections
// on The Legacy Library™ — deliberately not mixed into collab-customers,
// since this data is shown to other members (by Member ID), not just to
// its author. Layout: community/{monthOrder}.json -> { entries: [{ memberId, text, submittedAt }] }
function communityStore() {
  if (!process.env.NETLIFY_BLOBS_CONTEXT && process.env.NETLIFY_BLOBS_TOKEN && process.env.SITE_ID) {
    return getStore({
      name: 'collab-library-community',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore('collab-library-community');
}

// A third, separate Blobs store for the Impact Product ledger — the
// auditable record of "10% of this sale benefits this nonprofit" allocations
// computed by lib/fulfill.js. Kept out of collab-customers because this data
// is aggregated and shown on the public /pages/impact.html page (via the
// impact-summary function), never keyed to a customer identity.
// Layout: ledger/{sessionId}-{priceKey}.json -> allocation record (see recordImpactAllocation)
function impactStore() {
  if (!process.env.NETLIFY_BLOBS_CONTEXT && process.env.NETLIFY_BLOBS_TOKEN && process.env.SITE_ID) {
    return getStore({
      name: 'collab-impact',
      siteID: process.env.SITE_ID,
      token: process.env.NETLIFY_BLOBS_TOKEN,
    });
  }
  return getStore('collab-impact');
}

/**
 * Records one Impact allocation from a completed sale. Idempotent on
 * {sessionId, priceKey} — safe to call again if the webhook retries or if
 * verify-session.js's fallback fulfillment races the webhook, since both
 * would otherwise try to record the same sale twice.
 */
async function recordImpactAllocation({ sessionId, priceKey, partnerKey, percent, grossAmount, impactAmount, currency }) {
  const id = `${sessionId}-${priceKey}`;
  const key = `ledger/${id}.json`;
  const existing = await impactStore().get(key, { type: 'json' });
  if (existing) return existing;
  const entry = {
    id,
    sessionId,
    priceKey,
    partnerKey,
    percent,
    grossAmount,
    impactAmount,
    currency: currency || 'usd',
    createdAt: new Date().toISOString(),
    remitted: false,
    remittedAt: null,
  };
  await impactStore().setJSON(key, entry);
  return entry;
}

/** Every recorded Impact allocation — small volume expected, so a full list is fine. */
async function listImpactLedger() {
  const page = await impactStore().list({ prefix: 'ledger/' });
  const entries = await Promise.all(page.blobs.map((b) => impactStore().get(b.key, { type: 'json' })));
  return entries.filter(Boolean);
}

/** Owner marks an allocation as manually remitted to the nonprofit (or reverses that). */
async function markImpactRemitted(id, remitted = true) {
  const key = `ledger/${id}.json`;
  const entry = await impactStore().get(key, { type: 'json' });
  if (!entry) return null;
  entry.remitted = remitted;
  entry.remittedAt = remitted ? new Date().toISOString() : null;
  await impactStore().setJSON(key, entry);
  return entry;
}

async function getCommunityReflections(monthOrder) {
  const doc = await communityStore().get(`community/${monthOrder}.json`, { type: 'json' });
  return (doc && doc.entries) || [];
}

/** Appends one entry (or replaces this member's existing entry for the month). */
async function upsertCommunityReflection(monthOrder, memberId, text) {
  const key = `community/${monthOrder}.json`;
  const doc = (await communityStore().get(key, { type: 'json' })) || { entries: [] };
  const entries = doc.entries.filter((e) => e.memberId !== memberId);
  entries.push({ memberId, text, submittedAt: new Date().toISOString() });
  await communityStore().setJSON(key, { entries });
  return entries;
}

function randomToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
}

/**
 * Sequential, human-readable Member ID (CL-00001, CL-00002, ...) doubling
 * as the "username" half of Member ID + password login. Blobs has no
 * atomic increment, so this is a plain read-then-write — fine at this
 * membership's signup volume; a rare simultaneous-signup collision would
 * just mean two members briefly share a counter value, not a broken
 * account, since the real key everywhere else is still the token.
 */
async function nextMemberId() {
  const doc = (await store().get('meta/member-id-seq.json', { type: 'json' })) || { seq: 0 };
  const seq = doc.seq + 1;
  await store().setJSON('meta/member-id-seq.json', { seq });
  return `CL-${String(seq).padStart(5, '0')}`;
}

function newCustomer(email, token, memberId) {
  const now = new Date().toISOString();
  return {
    token,
    memberId,
    email: String(email).trim().toLowerCase(),
    passwordHash: null,
    createdAt: now,
    updatedAt: now,
    stripeCustomerId: null,
    entitlements: [],
    memberships: {}, // { [membershipKey]: { status, interval, subscriptionId, currentPeriodEnd } }
    purchases: [], // [{ key, priceId, sessionId, amount, currency, purchasedAt }]
  };
}

async function getCustomerByToken(token) {
  if (!token) return null;
  return (await store().get(`customers/${token}.json`, { type: 'json' })) || null;
}

async function saveCustomer(record) {
  record.updatedAt = new Date().toISOString();
  await store().setJSON(`customers/${record.token}.json`, record);
  return record;
}

async function getTokenByEmail(email) {
  const doc = await store().get(`by-email/${hashEmail(email)}.json`, { type: 'json' });
  return doc ? doc.token : null;
}

async function setTokenForEmail(email, token) {
  await store().setJSON(`by-email/${hashEmail(email)}.json`, { token });
}

/** Find the existing account for this email, or create a fresh one. */
async function getOrCreateCustomerByEmail(email) {
  const existingToken = await getTokenByEmail(email);
  if (existingToken) {
    const record = await getCustomerByToken(existingToken);
    if (record) return { token: existingToken, record, isNew: false };
  }
  const token = randomToken();
  const memberId = await nextMemberId();
  const record = newCustomer(email, token, memberId);
  await saveCustomer(record);
  await setTokenForEmail(email, token);
  await linkMemberId(memberId, token);
  return { token, record, isNew: true };
}

async function linkMemberId(memberId, token) {
  if (!memberId) return;
  await store().setJSON(`by-member-id/${memberId}.json`, { token });
}

async function getTokenByMemberId(memberId) {
  const doc = await store().get(`by-member-id/${String(memberId).trim().toUpperCase()}.json`, { type: 'json' });
  return doc ? doc.token : null;
}

async function linkStripeCustomer(stripeCustomerId, token) {
  if (!stripeCustomerId) return;
  await store().setJSON(`by-stripe-customer/${stripeCustomerId}.json`, { token });
}

async function getTokenByStripeCustomer(stripeCustomerId) {
  const doc = await store().get(`by-stripe-customer/${stripeCustomerId}.json`, { type: 'json' });
  return doc ? doc.token : null;
}

async function linkSubscription(subscriptionId, token, membershipKey) {
  await store().setJSON(`by-subscription/${subscriptionId}.json`, { token, membershipKey });
}

async function getSubscriptionLink(subscriptionId) {
  return store().get(`by-subscription/${subscriptionId}.json`, { type: 'json' });
}

module.exports = {
  randomToken,
  hashEmail,
  nextMemberId,
  getCustomerByToken,
  saveCustomer,
  getTokenByEmail,
  setTokenForEmail,
  getOrCreateCustomerByEmail,
  linkStripeCustomer,
  getTokenByStripeCustomer,
  linkSubscription,
  getSubscriptionLink,
  linkMemberId,
  getTokenByMemberId,
  getCommunityReflections,
  upsertCommunityReflection,
  recordImpactAllocation,
  listImpactLedger,
  markImpactRemitted,
};
