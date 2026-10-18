// In-memory stand-in for netlify/functions/lib/store.js, used only in tests
// so fulfill.js's logic can be exercised without a real Netlify Blobs
// connection (which isn't available outside a deployed Netlify context).
const crypto = require('crypto');

let customers = new Map(); // token -> record
let byEmail = new Map(); // emailHash -> token
let byStripeCustomer = new Map();
let bySubscription = new Map();
let impactLedger = new Map(); // id -> allocation record
let founderSeq = 0;
let seatInvites = new Map();
let memberSeq = 0;
let byMemberId = new Map();
let resetCodes = new Map();
let purchaseEmails = new Map();
let verifyCodes = new Map();
let throttles = new Map();

function reset() {
  customers = new Map();
  byEmail = new Map();
  byStripeCustomer = new Map();
  bySubscription = new Map();
  impactLedger = new Map();
  founderSeq = 0;
  seatInvites = new Map();
  memberSeq = 0;
  byMemberId = new Map();
  resetCodes = new Map();
  purchaseEmails = new Map();
  verifyCodes = new Map();
  throttles = new Map();
}

async function saveSeatInvite(code, invite) {
  seatInvites.set(code, invite);
}

async function getSeatInvite(code) {
  return seatInvites.get(code) || null;
}

async function deleteSeatInvite(code) {
  seatInvites.delete(code);
}

async function nextFounderNumber() {
  founderSeq += 1;
  return `F-${String(founderSeq).padStart(5, '0')}`;
}

async function listFounders() {
  return Array.from(customers.values())
    .filter((r) => r.founder)
    .map((r) => ({
      founderNumber: r.founder.founderNumber,
      level: r.founder.level,
      levelLabel: r.founder.levelLabel,
      name: r.founder.name || null,
      memberId: r.memberId || null,
      recognizedAt: r.founder.recognizedAt,
    }));
}

async function listCustomers() {
  return Array.from(customers.values());
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
    name: null,
    entitlements: [],
    memberships: {},
    purchases: [],
    founder: null,
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
  memberSeq += 1;
  record.memberId = `M-${String(memberSeq).padStart(5, '0')}`;
  byMemberId.set(record.memberId, token);
  await saveCustomer(record);
  await setTokenForEmail(email, token);
  return { token, record, isNew: true };
}

function isUnconfirmedFreeSignup(record) {
  return Boolean(
    record && record.signupSource === 'free' && record.emailVerified !== true &&
    !(record.entitlements || []).length && !Object.keys(record.memberships || {}).length &&
    !(record.purchases || []).length && !record.partnership && !record.founder && !record.seat
  );
}

async function getOrCreateCustomerForPurchase(email) {
  const existingToken = await getTokenByEmail(email);
  if (existingToken) {
    const record = await getCustomerByToken(existingToken);
    if (record && !isUnconfirmedFreeSignup(record)) return { token: existingToken, record, isNew: false };
    if (record) {
      record.passwordHash = null;
      record.supersededAt = new Date().toISOString();
      await saveCustomer(record);
    }
  }
  const token = randomToken();
  const record = newCustomer(email, token);
  memberSeq += 1;
  record.memberId = `M-${String(memberSeq).padStart(5, '0')}`;
  byMemberId.set(record.memberId, token);
  await saveCustomer(record);
  await setTokenForEmail(email, token);
  return { token, record, isNew: true, replacedUnconfirmedSignup: Boolean(existingToken) };
}

async function saveVerifyCode(code, info) { verifyCodes.set(code, info); }
async function getVerifyCode(code) { return verifyCodes.get(code) || null; }
async function deleteVerifyCode(code) { verifyCodes.delete(code); }
async function getLoginThrottle(key) { return throttles.get(hashEmail(key)) || null; }
async function saveLoginThrottle(key, info) { throttles.set(hashEmail(key), info); }
async function clearLoginThrottle(key) { throttles.delete(hashEmail(key)); }

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

async function hasSentPurchaseEmail(sessionId) {
  return purchaseEmails.has(sessionId);
}

async function markPurchaseEmailSent(sessionId, info) {
  purchaseEmails.set(sessionId, { ...info, sentAt: new Date().toISOString() });
}

async function getTokenByMemberId(memberId) {
  return byMemberId.get(String(memberId).trim().toUpperCase()) || null;
}

async function saveResetCode(code, info) {
  resetCodes.set(code, info);
}

async function getResetCode(code) {
  return resetCodes.get(code) || null;
}

async function deleteResetCode(code) {
  resetCodes.delete(code);
}

module.exports = {
  reset,
  getOrCreateCustomerForPurchase,
  isUnconfirmedFreeSignup,
  saveVerifyCode,
  getVerifyCode,
  deleteVerifyCode,
  getLoginThrottle,
  saveLoginThrottle,
  clearLoginThrottle,
  randomToken,
  hashEmail,
  nextFounderNumber,
  listFounders,
  listCustomers,
  saveSeatInvite,
  getSeatInvite,
  deleteSeatInvite,
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
  getTokenByMemberId,
  saveResetCode,
  getResetCode,
  deleteResetCode,
  hasSentPurchaseEmail,
  markPurchaseEmailSent,
};
