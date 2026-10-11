const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const pricing = require('../netlify/functions/lib/pricing');
const mailer = require('../netlify/functions/lib/mailer');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const { buildPurchaseEmail, sendPurchaseConfirmation } = require('../netlify/functions/lib/purchase-email');

const reg = pricing.registry;
const PRODUCT = reg.products.find((p) => p.key === 'strength-map');
const FOUNDER = reg.products.find((p) => p.founder_rank);
const MEMBERSHIP = reg.memberships[0];
const ENTERPRISE = reg.partnerships.find((t) => t.tier_label === 'Enterprise');

let sent;
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
});
test.after(() => mailer._setTransportForTests(null));

function session(id, email, extra = {}) {
  return { id, customer_details: { email, name: 'Jordan Rivers' }, created: Math.floor(Date.now() / 1000), amount_total: 50000, currency: 'usd', ...extra };
}

test('one-time product: confirms the item, total, Member ID, and a sign-in link', async () => {
  const s = session('cs_prod', 'a@example.com');
  const result = await fulfillCheckoutSession(s, [PRODUCT.stripe_price_id]);
  const msg = buildPurchaseEmail(result.record, s);
  assert.equal(msg.to, 'a@example.com');
  assert.match(msg.subject, /purchase is confirmed/);
  assert.match(msg.text, new RegExp(PRODUCT.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(msg.text, /Total: \$500\.00/);
  assert.match(msg.text, new RegExp(result.record.memberId));
  assert.match(msg.text, /Ready in your library now/);
  assert.match(msg.html, /account\.html\?token=/);
  assert.match(msg.text, /create a password/);
});

test('membership: says it is active and renews', async () => {
  const s = session('cs_mem', 'b@example.com', { subscription: 'sub_1' });
  const result = await fulfillCheckoutSession(s, [MEMBERSHIP.plans[0].stripe_price_id]);
  const msg = buildPurchaseEmail(result.record, s);
  assert.match(msg.text, /membership is active now/);
  assert.match(msg.text, /renews automatically/);
});

test('Founders tier: recognizes the Founder level and number', async () => {
  const s = session('cs_founder', 'c@example.com');
  const result = await fulfillCheckoutSession(s, [FOUNDER.stripe_price_id]);
  const msg = buildPurchaseEmail(result.record, s);
  assert.match(msg.subject, /Founders Organization/);
  assert.match(msg.text, /Founder Number F-\d{5}/);
});

test('Partnership: tier subject, term end date, seats, and session', async () => {
  const s = session('cs_ent', 'd@example.com');
  const result = await fulfillCheckoutSession(s, [ENTERPRISE.stripe_price_id]);
  const msg = buildPurchaseEmail(result.record, s);
  assert.match(msg.subject, /Enterprise Partnership is active/);
  assert.match(msg.text, /complete designated Co\.LLab™ IP portfolio/);
  assert.match(msg.text, /active through [A-Z][a-z]+ \d{1,2}, \d{4}/);
  assert.match(msg.text, /5 individual seats/);
  assert.match(msg.text, new RegExp(ENTERPRISE.engagement.label));
});

test('sends once per session, even when the webhook retries', async () => {
  const s = session('cs_once', 'e@example.com');
  const result = await fulfillCheckoutSession(s, [PRODUCT.stripe_price_id]);
  assert.equal((await sendPurchaseConfirmation(result, s)).sent, true);
  const again = await fulfillCheckoutSession(s, [PRODUCT.stripe_price_id]);
  assert.equal((await sendPurchaseConfirmation(again, s)).duplicate, true);
  assert.equal(sent.length, 1);
});

test('a failed send is logged, not thrown, and can be retried', async () => {
  const s = session('cs_fail', 'f@example.com');
  const result = await fulfillCheckoutSession(s, [PRODUCT.stripe_price_id]);
  mailer._setTransportForTests({ sendMail: async () => { throw new Error('smtp down'); } });
  const errLog = console.error;
  console.error = () => {};
  try {
    assert.equal((await sendPurchaseConfirmation(result, s)).sent, false);
  } finally {
    console.error = errLog;
  }
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
  assert.equal((await sendPurchaseConfirmation(result, s)).sent, true);
});

test('prices this site does not sell produce no email', async () => {
  const s = session('cs_other', 'g@example.com');
  const result = await fulfillCheckoutSession(s, ['price_not_ours']);
  assert.equal(buildPurchaseEmail(result.record, s), null);
});

test('without SMTP settings, email is skipped and fulfillment is unaffected', async () => {
  mailer._setTransportForTests(null);
  const saved = { u: process.env.SMTP_USER, p: process.env.SMTP_PASS };
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  const log = console.log;
  console.log = () => {};
  try {
    const s = session('cs_noconf', 'h@example.com');
    const result = await fulfillCheckoutSession(s, [PRODUCT.stripe_price_id]);
    assert.equal((await sendPurchaseConfirmation(result, s)).skipped, true);
    assert.ok(result.record.entitlements.includes(PRODUCT.key));
  } finally {
    console.log = log;
    if (saved.u) process.env.SMTP_USER = saved.u;
    if (saved.p) process.env.SMTP_PASS = saved.p;
  }
});
