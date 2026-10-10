const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Same fake-store injection as fulfill.test.js — no real Netlify Blobs here.
const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const membershipStatus = require('../netlify/functions/lib/membership-status');
const { buildAccountView } = require('../netlify/functions/lib/account-view');
const { fulfillCheckoutSession, revokeMembership, _addMonths } = require('../netlify/functions/lib/fulfill');
const { _shouldApplyFounderDiscount } = require('../netlify/functions/checkout-create');

const PARTNER_PRICE = 'price_1UP1xlAK6n3ctuR9EFyv5jVx';
const OMNI_PRICE = 'price_1UP1ycAK6n3ctuR9tseEPqVf';
const MEMBERSHIP_MONTHLY = 'price_1T1PADAK6n3ctuR9GdRPng9w';
const PURCHASED = Date.UTC(2026, 9, 10, 12, 0, 0); // 2026-10-10
const EXPECTED_END = '2027-10-10T12:00:00.000Z';

function partnerSession(id, priceAmount, email = 'partner@example.com', created = PURCHASED) {
  return {
    id,
    customer_details: { email, name: 'Pat Partner' },
    customer: 'cus_partner',
    amount_total: priceAmount,
    currency: 'usd',
    created: Math.floor(created / 1000),
  };
}

test.beforeEach(() => fakeStore.reset());

// ---- registry -------------------------------------------------------------

test('registry has the 4 partnership tiers at the right prices, fully separate from Founders', () => {
  const tiers = pricing.registry.partnerships;
  assert.deepEqual(
    tiers.map((t) => [t.key, t.price_display]),
    [
      ['partnership-partner', '$5,000'],
      ['partnership-strategic', '$10,000'],
      ['partnership-enterprise', '$25,000'],
      ['partnership-omnidirectional', '$50,000'],
    ]
  );
  const allPrices = new Set();
  for (const t of tiers) {
    assert.ok(t.stripe_price_id.startsWith('price_'), `${t.key} price id`);
    assert.ok(t.payment_link.startsWith('https://buy.stripe.com/'), `${t.key} payment link`);
    assert.equal(t.founder_rank, undefined, `${t.key} must not have a founder_rank`);
    assert.equal(t.impact, undefined, `${t.key} must not have an impact allocation`);
    assert.equal(t.founder_discount_exempt, true);
    assert.equal(pricing.keyForPriceId(t.stripe_price_id), t.key);
    assert.equal(pricing.entryForKey(t.key).kind, 'partnership');
    assert.equal(pricing.founderRankForKey(t.key), null);
    assert.equal(pricing.impactForKey(t.key), null);
    allPrices.add(t.stripe_price_id);
  }
  assert.equal(allPrices.size, 4);
});

test('partnerships never get the Founder discount and stay out of the Founder link rewrite', () => {
  const founderRecord = { founder: { founderNumber: 'F-00001' } };
  const linkMap = pricing.paymentLinkMap();
  for (const key of pricing.partnershipKeys()) {
    assert.equal(_shouldApplyFounderDiscount(founderRecord, key), false);
    assert.ok(!(pricing.entryForKey(key).payment_link in linkMap));
  }
});

test('partnershipGrantKeys = every product except Founders tiers + every Blueprint issue + every bonus product', () => {
  const keys = new Set(pricing.partnershipGrantKeys());
  for (const f of pricing.founderTierKeys()) assert.ok(!keys.has(f), `must not grant Founder tier ${f}`);
  for (const p of pricing.registry.products) if (!p.founder_rank) assert.ok(keys.has(p.key), p.key);
  for (const b of pricing.registry.blueprint_series) assert.ok(keys.has(b.key), b.key);
  for (const b of pricing.registry.bonus_products) assert.ok(keys.has(b.key), b.key);
});

// ---- fulfillment ----------------------------------------------------------

test('partnership purchase grants all products/blueprints/bonuses and 12-month memberships with no subscription', async () => {
  const { record } = await fulfillCheckoutSession(partnerSession('cs_p1', 500000), [PARTNER_PRICE]);

  for (const key of pricing.partnershipGrantKeys()) assert.ok(record.entitlements.includes(key), key);
  for (const f of pricing.founderTierKeys()) assert.ok(!record.entitlements.includes(f));

  for (const key of ['membership', 'library-card', 'journal']) {
    const m = record.memberships[key];
    assert.equal(m.status, 'active', key);
    assert.equal(m.subscriptionId, null, key);
    assert.equal(m.currentPeriodEnd, EXPECTED_END, key);
    assert.equal(m.source, 'partnership');
  }

  assert.equal(record.founder, null, 'no Founder recognition');
  assert.equal((await fakeStore.listImpactLedger()).length, 0, 'no impact allocation');
  assert.equal(record.partnership.key, 'partnership-partner');
  assert.equal(record.partnership.seats, 1);
  assert.equal(record.partnership.expiresAt, EXPECTED_END);
});

test('fulfilling the same partnership session twice (webhook + verify-session) does not extend the term', async () => {
  const s = partnerSession('cs_p2', 500000);
  await fulfillCheckoutSession(s, [PARTNER_PRICE]);
  const { record } = await fulfillCheckoutSession(s, [PARTNER_PRICE]);
  assert.equal(record.memberships.membership.currentPeriodEnd, EXPECTED_END);
});

test('a later, shorter partnership term never cuts an earlier longer one short', async () => {
  const later = Date.UTC(2026, 11, 1);
  await fulfillCheckoutSession(partnerSession('cs_long', 5000000, 'p@example.com', later), [OMNI_PRICE]);
  const { record } = await fulfillCheckoutSession(partnerSession('cs_short', 500000, 'p@example.com', PURCHASED), [PARTNER_PRICE]);
  assert.equal(record.memberships.membership.currentPeriodEnd, '2027-12-01T00:00:00.000Z');
  assert.equal(record.partnership.key, 'partnership-omnidirectional');
});

test('a stale subscription cancellation does not revoke an active partnership term', async () => {
  const email = 'switch@example.com';
  await fulfillCheckoutSession({ id: 'cs_sub', customer_details: { email }, subscription: 'sub_old' }, [MEMBERSHIP_MONTHLY]);
  const { token } = await fulfillCheckoutSession(partnerSession('cs_p3', 500000, email, Date.now()), [PARTNER_PRICE]);
  const record = await revokeMembership(token, 'membership');
  assert.equal(record.memberships.membership.status, 'active');
  assert.ok(record.entitlements.includes('membership'));
});

test('addMonths clamps to month end', () => {
  assert.equal(_addMonths(new Date('2027-01-31T00:00:00Z'), 1).toISOString(), '2027-02-28T00:00:00.000Z');
  assert.equal(_addMonths(new Date('2028-02-29T00:00:00Z'), 12).toISOString(), '2029-02-28T00:00:00.000Z');
});

// ---- expiry enforcement ---------------------------------------------------

test('before expiry the partner has full catalog + Library access; after expiry memberships lapse but purchases stay', async () => {
  const { record } = await fulfillCheckoutSession(partnerSession('cs_p4', 500000), [PARTNER_PRICE]);
  const before = Date.parse(EXPECTED_END) - 1000;
  const after = Date.parse(EXPECTED_END) + 1000;

  assert.ok(membershipStatus.hasFullCatalog(record, before));
  assert.ok(membershipStatus.isMembershipActive(record.memberships['library-card'], before));
  assert.ok(membershipStatus.effectiveEntitlements(record, before).includes('membership'));

  assert.equal(membershipStatus.hasFullCatalog(record, after), false);
  assert.equal(membershipStatus.isMembershipActive(record.memberships['library-card'], after), false);
  const ent = membershipStatus.effectiveEntitlements(record, after);
  for (const key of ['membership', 'library-card', 'journal']) assert.ok(!ent.includes(key), key);
  // One-time grants (products, Blueprint™, bonus) remain.
  assert.ok(ent.includes('strength-map'));
  assert.ok(ent.includes('blueprint-complete'));
  assert.ok(ent.includes('infrastructure-roadmap'));
});

test('expired memberships read as "expired" with regular-price renewal plans', async () => {
  const { record } = await fulfillCheckoutSession(partnerSession('cs_p5', 500000), [PARTNER_PRICE]);
  const after = Date.parse(EXPECTED_END) + 1000;
  const view = buildAccountView(record, after);
  const m = view.memberships.membership;
  assert.equal(m.status, 'expired');
  const regular = pricing.entryForKey('membership').plans.map((p) => p.payment_link);
  assert.deepEqual(m.renewal.map((r) => r.payment_link), regular);
  assert.equal(view.hasFullCatalog, false);
  assert.ok(!view.owned.some((o) => o.key === 'membership'));
  assert.equal(view.partnership.key, 'partnership-partner');
  // Stored record itself is untouched by the read.
  assert.equal(record.memberships.membership.status, 'active');
});

test('renewing at the regular membership price after expiry restores access via subscription', async () => {
  const email = 'renew@example.com';
  await fulfillCheckoutSession(partnerSession('cs_p6', 500000, email, Date.UTC(2024, 0, 1)), [PARTNER_PRICE]);
  const { record } = await fulfillCheckoutSession(
    { id: 'cs_renew', customer_details: { email }, subscription: 'sub_renew' },
    [MEMBERSHIP_MONTHLY]
  );
  assert.ok(membershipStatus.isMembershipActive(record.memberships.membership));
  assert.equal(record.memberships.membership.currentPeriodEnd, null);
  assert.equal(record.memberships.membership.subscriptionId, 'sub_renew');
  // The un-renewed Library Card is still lapsed.
  assert.equal(membershipStatus.isMembershipActive(record.memberships['library-card']), false);
});

test('subscription memberships (no currentPeriodEnd) are unaffected by expiry checks', () => {
  const m = { status: 'active', interval: 'month', subscriptionId: 'sub_x', currentPeriodEnd: null };
  assert.equal(membershipStatus.isMembershipActive(m, Date.UTC(2099, 0, 1)), true);
});

// ---- page / site wiring ---------------------------------------------------

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('partnership page lists every tier link, states purchase-not-investment, and never links to Founders', () => {
  const html = read('pages/partnership.html');
  for (const t of pricing.registry.partnerships) assert.ok(html.includes(t.payment_link), t.key);
  assert.match(html, /Clear Terms/);
  assert.match(html, /strategic purchase/i);
  assert.match(html, /not an investment or a security/i);
  assert.ok(!/founders\.html/.test(html), 'partnership page must not link to the Founders page');
});

test('Founders page never links to the partnership page; sitemap and nav include it', () => {
  assert.ok(!/partnership\.html/.test(read('pages/founders.html')));
  assert.match(read('sitemap.xml'), /pages\/partnership\.html/);
  assert.match(read('index.html'), /href="pages\/partnership\.html"/);
  assert.match(read('pages/products.html'), /href="partnership\.html"/);
});

test('partnership page includes the clickable Omnidirectional Enterprise™ circle model and the mission', () => {
  const html = read('pages/partnership.html');
  assert.match(html, /class="oe-mini-svg"/);
  const links = [...html.matchAll(/<a href="([^"]+)" class="oe-link"/g)].map((m) => m[1]);
  assert.ok(links.length >= 7, 'circle model nodes should be clickable');
  assert.ok(!links.some((h) => /founders/.test(h)));
  assert.match(html, /human potential/);
});

// ---- end-of-term offer ----------------------------------------------------

test('end of term: every membership is offered at its regular price, nothing before the notice window', async () => {
  const { record } = await fulfillCheckoutSession(partnerSession('cs_r1', 500000), [PARTNER_PRICE]);
  const end = Date.parse(EXPECTED_END);
  const day = 86400000;

  const early = membershipStatus.partnershipRenewal(record, end - 60 * day);
  assert.equal(early.status, 'active');
  assert.deepEqual(early.options, []);

  const soon = membershipStatus.partnershipRenewal(record, end - 10 * day);
  assert.equal(soon.status, 'ending-soon');
  assert.equal(soon.daysLeft, 10);

  const ended = buildAccountView(record, end + day).partnership.renewal;
  assert.equal(ended.status, 'ended');
  assert.deepEqual(ended.options.map((o) => o.key), pricing.membershipKeys());
  for (const o of ended.options) {
    const regular = pricing.entryForKey(o.key).plans.map((p) => [p.price_display, p.payment_link]);
    assert.deepEqual(o.plans.map((p) => [p.price_display, p.payment_link]), regular, o.key);
  }
});

test('end-of-term offer skips a membership the customer already renewed by subscription', async () => {
  const email = 'renewed@example.com';
  await fulfillCheckoutSession(partnerSession('cs_r2', 500000, email, Date.UTC(2024, 0, 1)), [PARTNER_PRICE]);
  const { record } = await fulfillCheckoutSession(
    { id: 'cs_r2_sub', customer_details: { email }, subscription: 'sub_r2' },
    [MEMBERSHIP_MONTHLY]
  );
  const offer = membershipStatus.partnershipRenewal(record);
  assert.equal(offer.status, 'ended');
  assert.deepEqual(offer.options.map((o) => o.key), ['library-card', 'journal']);
});

test('non-partners get no partnership panel data', () => {
  const view = buildAccountView({ email: 'x@example.com', entitlements: [], memberships: {} });
  assert.equal(view.partnership, null);
});

test('a partner cannot download Founders tier materials; a paid Membership still can', async () => {
  const download = require('../netlify/functions/download');
  const ev = (token, product) => ({ httpMethod: 'GET', headers: {}, queryStringParameters: { token, product } });

  const partner = await fulfillCheckoutSession(partnerSession('cs_f1', 500000, 'p1@example.com', Date.now()), [PARTNER_PRICE]);
  for (const f of pricing.founderTierKeys()) {
    assert.equal((await download.handler(ev(partner.token, f))).statusCode, 403, f);
    assert.ok(!buildAccountView(partner.record).owned.some((o) => o.key === f), f);
  }
  for (const k of pricing.partnershipGrantKeys()) {
    assert.equal((await download.handler(ev(partner.token, k))).statusCode, 200, k);
  }

  const member = await fulfillCheckoutSession({ id: 'cs_f2', customer_details: { email: 'm1@example.com' }, subscription: 'sub_f2' }, [MEMBERSHIP_MONTHLY]);
  assert.equal((await download.handler(ev(member.token, 'founder'))).statusCode, 200);
});
