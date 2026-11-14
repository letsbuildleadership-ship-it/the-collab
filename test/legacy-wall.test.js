const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const pricing = require('../netlify/functions/lib/pricing');
const { handler } = require('../netlify/functions/legacy-wall');
const { buildAccountView } = require('../netlify/functions/lib/account-view');

test.beforeEach(() => fakeStore.reset());

const wall = async () => JSON.parse((await handler({ httpMethod: 'GET' })).body);
const names = (body, node, label) => ((body.nodes.find((n) => n.node === node).groups.find((g) => g.label === label) || { members: [] }).members).map((m) => m.displayName);

test('one Omnidirectional Legacy Wall, organized by area; people appear wherever they take part; lapsed terms never remove anyone', async () => {
  const partner = pricing.registry.partnerships[0];
  await fulfillCheckoutSession({ id: 'cs_p', customer_details: { email: 'p@example.com', name: 'Partner Co.' } }, [partner.stripe_price_id]);
  const s = await fulfillCheckoutSession({ id: 'cs_s', customer_details: { email: 's@example.com', name: 'Shopper' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  await fulfillCheckoutSession({ id: 'cs_f', customer_details: { email: 'f@example.com', name: 'Founder Co.' } }, [pricing.entryForKey('legacy-founder').stripe_price_id]);
  await fulfillCheckoutSession({ id: 'cs_t', livemode: false, customer_details: { email: 't@example.com', name: 'Owner Test' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  await fulfillCheckoutSession({ id: 'cs_n', customer_details: { email: 'n@example.com' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  s.record.memberships = {};
  const body = await wall();
  assert.deepEqual(body.nodes.map((n) => n.node), ['Businesses', 'Communities', 'Nonprofits', 'People', 'Products & Services', 'Creators', 'Capital', 'Knowledge + IP', 'Technology']);
  assert.deepEqual(names(body, 'Businesses', 'Partner Partners'), ['Partner Co.']);
  assert.deepEqual(names(body, 'Communities', 'Legacy Founder'), ['Founder Co.']);
  assert.deepEqual(names(body, 'Nonprofits', 'Charity partners'), ['Blazing Smiles', 'Wavecraft Oceans Project']);
  assert.ok(names(body, 'Products & Services', '.LLab product owners').includes('Shopper'));
  assert.ok(names(body, 'People', '.LLab Membership™ Members').includes('Partner Co.'), 'a Partnership includes Membership, so the Partner is also a member');
  const text = JSON.stringify(body);
  assert.ok(!text.includes('Owner Test') && !text.includes('@') && !/[A-Z]+-\d{5}/.test(text), 'no tests, emails or numbers');
});

test('every member has a permanent Member Number and standing on their card', async () => {
  const r = await fulfillCheckoutSession({ id: 'cs_c', customer_details: { email: 'card@example.com', name: 'Card Holder' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  const view = buildAccountView(r.record);
  assert.match(view.memberId, /^[A-Z]+-\d{5}$/);
  assert.equal(view.memberStanding.label, '.LLab Members');
  assert.ok(view.memberSince);
});

test('after a purchase, a member can link their wall name to their website; free members cannot', async () => {
  const { cleanWallUrl, canLinkOnWall } = require('../netlify/functions/lib/wall-link');
  assert.equal(cleanWallUrl('yourcompany.com'), 'https://yourcompany.com/');
  assert.equal(cleanWallUrl('http://a.co/x'), 'https://a.co/x');
  assert.equal(cleanWallUrl(''), null);
  for (const bad of ['javascript:alert(1)', 'not a site', 'https://user:pw@a.co', 'ftp://a.co']) assert.ok(cleanWallUrl(bad) && cleanWallUrl(bad).error, bad);
  assert.equal(canLinkOnWall({ signupSource: 'free', emailVerified: true }), false);
  const r = await fulfillCheckoutSession({ id: 'cs_ad', customer_details: { email: 'ad@example.com', name: 'Ad Co.' } }, [pricing.entryForKey('strength-map').stripe_price_id]);
  assert.equal(canLinkOnWall(r.record), true);
  r.record.wallUrl = 'https://adco.example/';
  const body = await wall();
  const m = body.nodes.find((n) => n.node === 'Products & Services').groups[0].members.find((x) => x.displayName === 'Ad Co.');
  assert.equal(m.url, 'https://adco.example/');
});

test('the wall lives on one page; the blueprint links every area to the page where The Co.LLab uses it', () => {
  const oe = fs.readFileSync('pages/omnidirectional-enterprise.html', 'utf8');
  assert.ok(oe.includes('id="legacy-wall"') && oe.includes('legacy-wall.js'));
  for (const href of ['partnership.html', 'founders.html', 'impact.html', 'products.html', 'all-products.html', 'think.html', 'technology.html', 'creator.html']) assert.ok(oe.includes(`<a href="${href}"><span class="bp-node">`), href);
  for (const p of ['pages/founders.html', 'pages/products.html', 'pages/partnership.html']) {
    const html = fs.readFileSync(p, 'utf8');
    assert.ok(html.includes('omnidirectional-enterprise.html#'), `${p} links to the wall`);
    assert.ok(!/members-wall\.js|founders-recognition\.js/.test(html), `${p} has no wall of its own`);
  }
});
