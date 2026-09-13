// In-memory stand-in for netlify/functions/lib/store.js, used only in tests
// so fulfill.js's logic can be exercised without a real Netlify Blobs
// connection (which isn't available outside a deployed Netlify context).
const crypto = require('crypto');

let customers = new Map(); // token -> record
let byEmail = new Map(); // emailHash -> token
let byStripeCustomer = new Map();
let bySubscription = new Map();
let impactLedger = new Map(); // id -> allocation record

function reset() {
  customers = new Map();
  byEmail = new Map();
  byStripeCustomer = new Map();
  bySubscription = new Map();
  impactLedger = new Map();
}

function randomToken() {
  return crypto.randomBytes(12).toString('base64url');
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
}

function newCustomer(email, token) {
  const now = new Date().toISOString();
  return {
    token,
    email: String(email).trim().toLowerCase(),
    createdAt: now,
    updatedAt: now,
    stripeCustomerId: null,
    entitlements: [],
    memberships: {},
    purchases: [],
  };
}

async function getCustomerByToken(token) {
  return customers.get(token) || null;
}

async function saveCustomer(record) {
  record.updatedAt = new Date().toISOString();
  customers.set(record.token, record);
  return record;
}

async function getTokenByEmail(email) {
  return byEmail.get(hashEmail(email)) || null;
}

async function setTokenForEmail(email, token) {
  byEmail.set(hashEmail(email), token);
}

async function getOrCreateCustomerByEmail(email) {
  const existingToken = await getTokenByEmail(email);
  if (existingToken) {
    const record = await getCustomerByToken(existingToken);
    if (record) return { token: existingToken, record, isNew: false };
  }
  const token = randomToken();
  const record = newCustomer(email, token);
  await saveCustomer(record);
  await setTokenForEmail(email, token);
  return { token, record, isNew: true };
}

async function linkStripeCustomer(stripeCustomerId, token) {
  byStripeCustomer.set(stripeCustomerId, token);
}

async function getTokenByStripeCustomer(stripeCustomerId) {
  return byStripeCustomer.get(stripeCustomerId) || null;
}

async function linkSubscription(subscriptionId, token, membershipKey) {
  bySubscription.set(subscriptionId, { token, membershipKey });
}

async function getSubscriptionLink(subscriptionId) {
  return bySubscription.get(subscriptionId) || null;
}

async function recordImpactAllocation({ sessionId, priceKey, partnerKey, percent, grossAmount, impactAmount, currency }) {
  const id = `${sessionId}-${priceKey}`;
  if (impactLedger.has(id)) return impactLedger.get(id);
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
  impactLedger.set(id, entry);
  return entry;
}

async function listImpactLedger() {
  return Array.from(impactLedger.values());
}

async function markImpactRemitted(id, remitted = true) {
  const entry = impactLedger.get(id);
  if (!entry) return null;
  entry.remitted = remitted;
  entry.remittedAt = remitted ? new Date().toISOString() : null;
  return entry;
}

module.exports = {
  reset,
  randomToken,
  hashEmail,
  getCustomerByToken,
  saveCustomer,
  getTokenByEmail,
  setTokenForEmail,
  getOrCreateCustomerByEmail,
  linkStripeCustomer,
  getTokenByStripeCustomer,
  linkSubscription,
  getSubscriptionLink,
  recordImpactAllocation,
  listImpactLedger,
  markImpactRemitted,
};
