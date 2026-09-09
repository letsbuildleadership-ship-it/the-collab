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

function store() {
  return getStore('collab-customers');
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
};
