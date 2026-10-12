const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const membershipStatus = require('../netlify/functions/lib/membership-status');
const { rewardsStatus, claimPick } = require('../netlify/functions/lib/membership-rewards');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const pick = require('../netlify/functions/membership-pick');

const PLAN = pricing.registry.memberships.find((m) => m.key === 'membership').plans[0];

async function member(email) {
  const r = await fulfillCheckoutSession({ id: `cs_${email}`, customer_details: { email }, subscription: `sub_${email}`, amount_total: 15000 }, [PLAN.stripe_price_id]);
  return r.record;
}
function completePhase(record, phase) {
  record.activityProgress = record.activityProgress || {};
  for (const k of pricing.fourPhasesKeys()) if (pricing.entryForKey(k).phase === phase) record.activityProgress[k] = [0, 1, 2];
}
const call = (token, body) => pick.handler({ httpMethod: 'POST', headers: { cookie: `collab_token=${token}` }, body: JSON.stringify(body) });

test.beforeEach(() => fakeStore.reset());

test('Membership opens the Four Phases products only (not Creator, Blueprint issues, or Founders)', async () => {
  const r = await member('m1@example.com');
  const unlocked = membershipStatus.catalogUnlockKeys(r);
  assert.deepEqual(unlocked.sort(), pricing.fourPhasesKeys().sort());
  assert.ok(!unlocked.some((k) => k.startsWith('creator-')));
});

test('a tier opens its reward only once completed, with choices priced for that tier and below', async () => {
  const r = await member('m2@example.com');
  let st = rewardsStatus(r);
  assert.ok(st.tiers.every((t) => !t.completed && !t.options.length));
  completePhase(r, 'Phase I · Foundations');
  completePhase(r, 'Phase III · Internal Operating Systems');
  st = rewardsStatus(r);
  const crown = st.tiers[0], signet = st.tiers[2];
  assert.ok(crown.completed && crown.options.length && crown.options.every((o) => o.price <= 50));
  assert.ok(signet.options.some((o) => o.price > 150) && signet.options.some((o) => o.price <= 50));
  assert.ok(signet.options.every((o) => o.price <= 300));
  assert.ok(st.tiers[1].options.length === 0, 'SCEPTER not completed yet');
});

test('claiming a pick grants it for good, once per tier', async () => {
  const r = await member('m3@example.com');
  completePhase(r, 'Phase I · Foundations');
  await fakeStore.saveCustomer(r);
  const choice = rewardsStatus(r).tiers[0].options[0].key;
  const res = await call(r.token, { tier: 1, key: choice });
  assert.equal(res.statusCode, 200);
  const saved = await fakeStore.getCustomerByToken(r.token);
  assert.ok(saved.entitlements.includes(choice));
  assert.equal(saved.membershipPicks[1].key, choice);
  assert.equal((await call(r.token, { tier: 1, key: rewardsStatus(saved).tiers[0].options[0]?.key || choice })).statusCode, 400);
  // The pick stays after Membership ends.
  saved.memberships.membership.status = 'canceled';
  assert.ok(membershipStatus.effectiveEntitlements(saved).includes(choice));
});

test('picks are refused when over the tier price, not completed, or without Membership', async () => {
  const r = await member('m4@example.com');
  assert.throws(() => claimPick(r, 1, 'creator-identity-map'), /Complete every CROWN/);
  completePhase(r, 'Phase I · Foundations');
  assert.throws(() => claimPick(r, 1, 'creator-legacy-architecture'), /isn't available/);
  r.memberships.membership.status = 'canceled';
  assert.throws(() => claimPick(r, 1, 'creator-identity-map'), /needs to be active/);
});
