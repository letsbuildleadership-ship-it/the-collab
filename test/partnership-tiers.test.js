const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const membershipStatus = require('../netlify/functions/lib/membership-status');
const { resolveAccess } = require('../netlify/functions/lib/access');
const { buildAccountView } = require('../netlify/functions/lib/account-view');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const seats = require('../netlify/functions/partnership-seats');
const download = require('../netlify/functions/download');
const library = require('../netlify/functions/library');

const PRICE = Object.fromEntries(pricing.registry.partnerships.map((t) => [t.key, t.stripe_price_id]));
const nowSec = () => Math.floor(Date.now() / 1000);

function buy(tierKey, email, created = nowSec(), id = `cs_${tierKey}_${email}`) {
  return fulfillCheckoutSession({ id, customer_details: { email }, created, amount_total: 1 }, [PRICE[tierKey]]);
}

const call = (token, body) =>
  seats.handler({
    httpMethod: body ? 'POST' : 'GET',
    headers: token ? { cookie: `collab_token=${token}`, host: 'example.test' } : { host: 'example.test' },
    queryStringParameters: {},
    body: body ? JSON.stringify(body) : undefined,
  });
const bodyOf = (res) => JSON.parse(res.body);
const dl = (token, product) => download.handler({ httpMethod: 'GET', headers: {}, queryStringParameters: { token, product } });

test.beforeEach(() => fakeStore.reset());

// ---- tier definitions -----------------------------------------------------

test('tiers are ranked, seat counts are 1/2/5/10, and each tier keeps more than the one below', () => {
  const tiers = pricing.registry.partnerships;
  assert.deepEqual(tiers.map((t) => t.rank), [1, 2, 3, 4]);
  assert.deepEqual(tiers.map((t) => t.seats), [1, 2, 5, 10]);
  const sets = tiers.map((t) => new Set(pricing.partnershipGrantKeysFor(t.key)));
  for (let i = 1; i < sets.length; i++) {
    for (const k of sets[i - 1]) assert.ok(sets[i].has(k), `${tiers[i].key} must include ${k}`);
  }
  assert.ok(sets[1].size > sets[0].size, 'Strategic keeps more than Partner');
  assert.ok(sets[2].size > sets[1].size, 'Enterprise keeps more than Strategic');
  assert.deepEqual([...sets[2]].sort(), pricing.partnershipGrantKeys().sort(), 'Enterprise = complete designated portfolio');
  assert.deepEqual([...sets[3]].sort(), [...sets[2]].sort(), 'Omnidirectional keeps the same portfolio');
});

test('no tier grants Founders products and only Enterprise+ include eligible releases', () => {
  const founders = new Set(pricing.founderTierKeys());
  for (const t of pricing.registry.partnerships) {
    assert.ok(!pricing.partnershipGrantKeysFor(t.key).some((k) => founders.has(k)), t.key);
  }
  assert.deepEqual(
    pricing.registry.partnerships.map((t) => !!t.includes_eligible_releases),
    [false, false, true, true]
  );
});

test('engagement: none for Partner, one defined annual session for the others', () => {
  const [partner, strategic, enterprise, omni] = pricing.registry.partnerships;
  assert.equal(partner.engagement, null);
  for (const t of [strategic, enterprise, omni]) {
    assert.ok(t.engagement.label && t.engagement.format, t.key);
    assert.match(t.engagement.format, /per 12-month term/);
  }
});

// ---- upgrades never downgrade ---------------------------------------------

test('buying a lower tier during a higher tier never downgrades the label, seats, or products', async () => {
  await buy('partnership-omnidirectional', 'up@example.com', nowSec() - 86400);
  const { record } = await buy('partnership-partner', 'up@example.com');
  assert.equal(record.partnership.key, 'partnership-omnidirectional');
  assert.equal(record.partnership.seats, 10);
  assert.ok(record.entitlements.includes('blueprint-complete'));
});

test('upgrading Partner -> Enterprise raises seats and adds the complete portfolio', async () => {
  await buy('partnership-partner', 'grow@example.com', nowSec() - 86400);
  const { record } = await buy('partnership-enterprise', 'grow@example.com');
  assert.equal(record.partnership.key, 'partnership-enterprise');
  assert.equal(record.partnership.seats, 5);
  for (const k of pricing.partnershipGrantKeys()) assert.ok(record.entitlements.includes(k), k);
});

// ---- eligible releases ----------------------------------------------------

test('a designated release inside the term is kept by Enterprise, not by Strategic', async () => {
  const fake = { key: 'future-release-x', name: 'Future X', partnership_release: true, released_at: new Date().toISOString() };
  pricing.registry.products.push(fake);
  try {
    const ent = await buy('partnership-enterprise', 'ent@example.com', nowSec() - 3600);
    const strat = await buy('partnership-strategic', 'str@example.com', nowSec() - 3600);
    assert.ok(membershipStatus.effectiveEntitlements(ent.record).includes('future-release-x'));
    assert.ok(!membershipStatus.effectiveEntitlements(strat.record).includes('future-release-x'));
  } finally {
    pricing.registry.products.pop();
  }
});

test('a release dated after the term is not granted at purchase or later', async () => {
  const fake = { key: 'future-release-y', name: 'Future Y', partnership_release: true, released_at: '2099-01-01T00:00:00Z' };
  pricing.registry.products.push(fake);
  try {
    const ent = await buy('partnership-enterprise', 'ent2@example.com');
    assert.ok(!membershipStatus.effectiveEntitlements(ent.record).includes('future-release-y'));
  } finally {
    pricing.registry.products.pop();
  }
});

// ---- seats ----------------------------------------------------------------

test('Partner (1 seat) cannot create invites', async () => {
  const { token } = await buy('partnership-partner', 'solo@example.com');
  const res = await call(token, { action: 'invite' });
  assert.equal(res.statusCode, 409);
});

test('Strategic: invite -> new teammate claims -> gets tier access; owner never sees their token', async () => {
  const owner = await buy('partnership-strategic', 'boss@example.com');
  const inv = bodyOf(await call(owner.token, { action: 'invite' }));
  assert.equal(inv.free, 0);
  assert.equal(inv.invites.length, 1);
  const code = inv.invites[0].code;
  assert.match(inv.invites[0].link, /seat_invite=/);

  const claim = await call(null, { action: 'claim', code, email: 'mate@example.com' });
  assert.equal(claim.statusCode, 200);
  assert.ok(claim.headers['Set-Cookie'], 'new teammate is signed in');

  const mateToken = await fakeStore.getTokenByEmail('mate@example.com');
  const view = bodyOf(await call(owner.token));
  assert.equal(view.used, 2);
  assert.equal(view.holders[0].email, 'mate@example.com');
  assert.ok(!JSON.stringify(view).includes(mateToken), 'roster never exposes a seat holder token');

  // Teammate's access matches the tier.
  for (const k of pricing.partnershipGrantKeysFor('partnership-strategic')) {
    assert.equal((await dl(mateToken, k)).statusCode, 200, k);
  }
  assert.equal((await dl(mateToken, 'blueprint-complete')).statusCode, 403);
  const lib = await library.handler({ httpMethod: 'GET', headers: {}, queryStringParameters: { token: mateToken } });
  assert.equal(lib.statusCode, 200);
  const accountView = buildAccountView(await resolveAccess(await fakeStore.getCustomerByToken(mateToken)));
  assert.equal(accountView.seat.tierLabel, 'Strategic');
  assert.equal(accountView.partnership, null);

  // The invite is single-use.
  assert.equal((await call(null, { action: 'claim', code, email: 'other@example.com' })).statusCode, 410);
});

test('removing a seat holder ends their access immediately', async () => {
  const owner = await buy('partnership-enterprise', 'org@example.com');
  const { code } = bodyOf(await call(owner.token, { action: 'invite' })).invites[0];
  await call(null, { action: 'claim', code, email: 'temp@example.com' });
  const mateToken = await fakeStore.getTokenByEmail('temp@example.com');
  const mate = await fakeStore.getCustomerByToken(mateToken);
  assert.equal((await dl(mateToken, 'legacy-architecture')).statusCode, 200);

  const res = await call(owner.token, { action: 'remove', memberId: mate.memberId });
  assert.equal(res.statusCode, 200);
  assert.equal((await dl(mateToken, 'legacy-architecture')).statusCode, 403);
  assert.equal((await fakeStore.getCustomerByToken(mateToken)).seatOf, undefined);
});

test('an invite can never open an existing account: that email must sign in first', async () => {
  const owner = await buy('partnership-strategic', 'lead@example.com');
  await fulfillCheckoutSession({ id: 'cs_ex', customer_details: { email: 'existing@example.com' } }, ['price_1U31dIAK6n3ctuR9P3oaWUqY']);
  const { code } = bodyOf(await call(owner.token, { action: 'invite' })).invites[0];

  const res = await call(null, { action: 'claim', code, email: 'existing@example.com' });
  assert.equal(res.statusCode, 409);
  assert.equal(bodyOf(res).needsSignIn, true);
  assert.equal(res.headers && res.headers['Set-Cookie'], undefined);

  // Signed in, the same person can claim it onto their own account.
  const existingToken = await fakeStore.getTokenByEmail('existing@example.com');
  assert.equal((await call(existingToken, { action: 'claim', code })).statusCode, 200);
  assert.equal((await dl(existingToken, 'operating-system')).statusCode, 200);
});

test('seat limits hold: Strategic has exactly one extra seat', async () => {
  const owner = await buy('partnership-strategic', 'cap@example.com');
  assert.equal((await call(owner.token, { action: 'invite' })).statusCode, 200);
  assert.equal((await call(owner.token, { action: 'invite' })).statusCode, 409);
});

test('revoking an invite frees the seat and kills the link', async () => {
  const owner = await buy('partnership-strategic', 'rev@example.com');
  const { code } = bodyOf(await call(owner.token, { action: 'invite' })).invites[0];
  const after = bodyOf(await call(owner.token, { action: 'revoke-invite', code }));
  assert.equal(after.free, 1);
  assert.equal((await call(null, { action: 'claim', code, email: 'late@example.com' })).statusCode, 410);
});

test('a seat holder cannot hold two seats, and a purchaser cannot claim their own invite', async () => {
  const a = await buy('partnership-enterprise', 'a@example.com');
  const b = await buy('partnership-enterprise', 'b@example.com');
  const codeA = bodyOf(await call(a.token, { action: 'invite' })).invites[0].code;
  const codeB = bodyOf(await call(b.token, { action: 'invite' })).invites[0].code;
  await call(null, { action: 'claim', code: codeA, email: 'dup@example.com' });
  const dupToken = await fakeStore.getTokenByEmail('dup@example.com');
  assert.equal((await call(dupToken, { action: 'claim', code: codeB })).statusCode, 409);
  const codeA2 = bodyOf(await call(a.token, { action: 'invite' })).invites.at(-1).code;
  assert.equal((await call(a.token, { action: 'claim', code: codeA2 })).statusCode, 400);
});

test("seat memberships end with the purchaser's term", async () => {
  const owner = await buy('partnership-strategic', 'old@example.com', Math.floor(Date.UTC(2024, 0, 1) / 1000));
  // Seats can still be filled after the term (products stay), but memberships are expired.
  const { code } = bodyOf(await call(owner.token, { action: 'invite' })).invites[0];
  await call(null, { action: 'claim', code, email: 'after@example.com' });
  const mateToken = await fakeStore.getTokenByEmail('after@example.com');
  const view = await resolveAccess(await fakeStore.getCustomerByToken(mateToken));
  assert.equal(membershipStatus.isMembershipActive(view.memberships['library-card']), false);
  assert.equal((await dl(mateToken, 'operating-system')).statusCode, 200, 'tier products remain');
  assert.equal((await dl(mateToken, 'legacy-architecture')).statusCode, 403, 'catalog-via-Membership ended');
});

// ---- website consistency --------------------------------------------------

const fs = require('fs');
const path = require('path');
const page = fs.readFileSync(path.join(__dirname, '..', 'pages', 'partnership.html'), 'utf8');

test('partnership page: one card per tier with the right price, payment link, seats, and session', () => {
  for (const t of pricing.registry.partnerships) {
    assert.ok(page.includes(`href="${t.payment_link}"`), `${t.key} payment link`);
    assert.ok(page.includes(`Purchase ${t.tier_label} · ${t.price_display}`), `${t.key} purchase button`);
    assert.ok(page.includes(`${t.seats} individual${t.seats === 1 ? '' : 's'}`), `${t.key} seats`);
    assert.ok(page.includes(t.headline), `${t.key} progression line`);
    if (t.engagement) assert.ok(page.includes(t.engagement.label), `${t.key} session`);
  }
  assert.equal((page.match(/<h3>\$[0-9,]+<\/h3>/g) || []).length, 4, 'exactly four price headings');
});

test("What's included table marks exactly each tier's permanent grants as Keep", () => {
  const table = page.slice(page.indexOf('<table class="included">'), page.indexOf('</table>'));
  const rows = [...table.matchAll(/<tr><th scope="row">([^<]+)<\/th>((?:<td[^>]*>[^<]*<\/td>)+)<\/tr>/g)];
  const byName = new Map(rows.map((r) => [r[1], [...r[2].matchAll(/<td[^>]*>([^<]*)<\/td>/g)].map((c) => c[1])]));
  const tiers = pricing.registry.partnerships;
  for (const key of pricing.partnershipGrantKeys()) {
    const entry = pricing.entryForKey(key);
    const cells = byName.get(entry.name.replace(/&/g, '&amp;'));
    assert.ok(cells, `row for ${key}`);
    tiers.forEach((t, i) => {
      const keep = pricing.partnershipGrantKeysFor(t.key).includes(key);
      assert.equal(cells[i] === 'Keep', keep, `${t.key} / ${key}`);
    });
  }
});

test('partnership page: refund policy, license link, Founders separation, and no fabricated claims', () => {
  assert.match(page, /All sales are final once access is unlocked, subject to applicable law/);
  assert.ok(page.includes('href="ip-license.html"'));
  assert.ok(!/founders\.html/.test(page));
  assert.match(page, /no Founders product is included in any partnership/);
  assert.ok(!/testimonial|limited spots|only \d+ (left|available)|guaranteed (results|return)/i.test(page));
  assert.ok(!/Each partnership currently covers the purchaser/.test(page), 'old one-seat copy removed');
});

test('IP license page carries the license text verbatim from the product license source', async () => {
  const lic = fs.readFileSync(path.join(__dirname, '..', 'pages', 'ip-license.html'), 'utf8');
  const { licenseHtml } = await import('../scripts/pdf-src/docs/_license.mjs');
  assert.ok(lic.includes(licenseHtml.trim()), 'license copied exactly');
});
