const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const { quests, validateAnswers, outcomeFor } = require('../netlify/functions/lib/quests');
const quest = require('../netlify/functions/quest');
const signup = require('../netlify/functions/signup');
const freeTools = require('../content/free-tools.json').tools;

test.beforeEach(() => fakeStore.reset());

async function member(email) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'free-pass-1' }) });
  return fakeStore.getTokenByEmail(email);
}
// A paying Membership holder: the analysis and outcomes are a Membership benefit.
async function paidMember(email) {
  const token = await member(email);
  const record = await fakeStore.getCustomerByToken(token);
  record.memberships = { membership: { status: 'active', interval: 'month', subscriptionId: 'sub_q', currentPeriodEnd: null } };
  await fakeStore.saveCustomer(record);
  return token;
}
const call = (token, method, qs, body) => quest.handler({
  httpMethod: method,
  headers: { cookie: `collab_token=${token}` },
  queryStringParameters: qs || {},
  body: body ? JSON.stringify(body) : undefined,
});
const fullAnswers = (q, pick) => {
  const a = {};
  for (const n of q.nodes) a[n.id] = n.type === 'check' ? pick : n.type === 'scale' ? (pick ? 5 : 1) : 'A plain sentence of my own.';
  a[q.closing.id] = 'One thing I will do this week.';
  return a;
};

const pricing = require('../netlify/functions/lib/pricing');
const freeQuests = () => freeTools.map((t) => quests.get(t.key));

test('every free tool has a quest, and every paid IP has one', () => {
  for (const t of freeTools) assert.ok(quests.get(t.key), t.key);
  const paid = [...quests.values()].filter((q) => q.archetype === 'workbook' && !q.open);
  assert.equal(paid.length, 21);
  for (const q of paid) assert.ok(pricing.entryForKey(q.key), q.key);
});

test('a perfect score still gets ways to improve, a low score gets a build list', () => {
  for (const q of freeQuests()) {
    for (const pick of [true, false]) {
      const o = outcomeFor(q, fullAnswers(q, pick));
      assert.ok(o.improvements.length >= 3, `${q.key} improvements`);
      assert.ok(o.summary.length > 10);
    }
  }
});

test('validation rejects incomplete or malformed answers', () => {
  const q = [...quests.values()].find((x) => x.archetype === 'snapshot');
  assert.equal(validateAnswers(q, {}, { complete: true }).ok, false);
  assert.equal(validateAnswers(q, { n1: 9 }, { complete: false }).ok, false);
  assert.equal(validateAnswers(q, fullAnswers(q, true), { complete: true }).ok, true);
});

test('quest endpoints need a signed-in member', async () => {
  const q = freeQuests()[0];
  assert.equal((await call(null, 'GET', { key: q.key })).statusCode, 401);
});

test('draft saves, finishing stores the outcome, report is a PDF, drafts never overwrite it', async () => {
  const token = await paidMember('quester@example.com');
  const q = [...quests.values()].find((x) => x.archetype === 'checklist');

  let r = await call(token, 'POST', {}, { key: q.key, answers: { n1: true } });
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse((await call(token, 'GET', { key: q.key })).body).saved.status, 'draft');
  assert.equal((await call(token, 'GET', { key: q.key, pdf: '1' })).statusCode, 404, 'no report before finishing');

  r = await call(token, 'POST', {}, { key: q.key, answers: { n1: true }, complete: true });
  assert.equal(r.statusCode, 400);

  r = await call(token, 'POST', {}, { key: q.key, answers: fullAnswers(q, true), notes: { n2: 'a note' }, complete: true });
  assert.equal(r.statusCode, 200);
  const saved = JSON.parse(r.body).saved;
  assert.equal(saved.status, 'done');
  assert.ok(saved.outcome.improvements.length >= 3);

  r = await call(token, 'POST', {}, { key: q.key, answers: { n1: false } });
  assert.equal(JSON.parse(r.body).saved.status, 'done');

  const pdf = await call(token, 'GET', { key: q.key, pdf: '1' });
  assert.equal(pdf.statusCode, 200);
  assert.equal(pdf.headers['Content-Type'], 'application/pdf');
  assert.equal(Buffer.from(pdf.body, 'base64').subarray(0, 4).toString(), '%PDF');
});

test('one member cannot read another member\'s report', async () => {
  const a = await member('a@example.com');
  const b = await member('b@example.com');
  const q = freeQuests()[0];
  await call(a, 'POST', {}, { key: q.key, answers: fullAnswers(q, true), complete: true });
  assert.equal((await call(b, 'GET', { key: q.key, pdf: '1' })).statusCode, 404);
});

test('the outcome is built from the member\'s own data, not a template', () => {
  const q = quests.get('free-clarity-direction-worksheet');
  const vague = { n1: 'Better leadership for everyone, always.', n2: 'Do more things.', n3: 'Hmm', n4: 'Some stuff.', synthesis: 'Try harder.' };
  const sharp = { n1: 'I will name one owner for each of our three programs by March 3.', n2: 'Every week our team reviews the three owners in a standing meeting.', n3: 'We document the process so a successor can run it within 30 days.', n4: 'Mission and values are written on one page by Friday.', synthesis: 'I will assign owners by March 3.' };
  const a = outcomeFor(q, vague);
  const b = outcomeFor(q, sharp);
  assert.notDeepEqual(a.improvements.map((i) => i.text), b.improvements.map((i) => i.text));
  assert.ok(a.improvements.some((i) => i.evidence.includes('Better leadership for everyone')), 'quotes their words');
  assert.ok(a.legacyRead && a.phaseMap.length === 4);
  assert.ok(b.strengths.some((s) => /owner|timeframe/.test(s.evidence)));
});

test('scores are analysed: the gap between strongest and weakest is named', () => {
  const q = quests.get('free-foundation-strength-snapshot');
  const o = outcomeFor(q, { n1: 1, n2: 4, n3: 3, n4: 5, reflect: 'Clarity is my lowest and I will write it down by Friday.' });
  const first = o.improvements[0];
  assert.match(first.evidence, /Clarity 1 of 5/);
  assert.match(first.evidence, /carrying/);
  assert.match(o.legacyRead, /weakest link is Clarity/);
});

test('paid IP quests are locked until the member owns the product or holds Membership', async () => {
  const token = await member('free@example.com');
  assert.equal((await call(token, 'GET', { key: 'strength-map' })).statusCode, 403);
  const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
  const product = pricing.registry.products.find((p) => p.key === 'strength-map');
  await fulfillCheckoutSession({ id: 'cs_q', customer_details: { email: 'free@example.com' }, amount_total: 1 }, [product.stripe_price_id]);
  const res = await call(await fakeStore.getTokenByEmail('free@example.com'), 'GET', { key: 'strength-map' });
  assert.equal(res.statusCode, 200);
  const g = JSON.parse(res.body);
  assert.ok(g.quest.nodes.length > 5);
  assert.equal(g.canAnalyze, true, 'owning the product covers its own analysis');
  const mtoken = await paidMember('pm@example.com');
  assert.equal((await call(mtoken, 'GET', { key: 'legacy-map' })).statusCode, 200, 'Membership opens the Four Phases quests');
});

test('workbook quests analyse coverage, scores and choices against the member\'s own words', () => {
  const arch = quests.get('legacy-architecture');
  const ans = {};
  arch.nodes.forEach((n) => { ans[n.id] = n.type === 'choose' ? n.options.slice(0, 2) : 'We have a plan; I will assign an owner by June 1 and review every month.'; });
  ans.commit = 'I will document our three critical processes by Friday.';
  const out = outcomeFor(arch, ans);
  assert.ok(out.improvements.some((i) => /Not yet in place/.test(i.label) && /You did not select/.test(i.evidence)));
  assert.equal(out.phaseMap.length, 4);

  const diag = quests.get('diagnostic');
  const d = {};
  diag.nodes.forEach((n, i) => { d[n.id] = n.type === 'scale' ? (n.phase === 3 ? 1 : 4) : 'Strong weekly check-ins with a clear owner.'; });
  d.commit = 'I will fix succession by June.';
  const o2 = outcomeFor(diag, d);
  assert.equal(o2.max, 200);
  assert.match(o2.legacyRead, /Preservation is lowest/);
  assert.ok(o2.improvements.some((i) => /You rated this 1 of 5 in Preservation/.test(i.evidence)));

  const sm = quests.get('strength-map');
  const choose = sm.nodes.find((n) => n.type === 'choose');
  const s = {};
  sm.nodes.forEach((n) => { s[n.id] = n.type === 'choose' ? ['Accountability'] : 'We review our work together every week.'; });
  s.commit = 'I will start by Monday.';
  const o3 = outcomeFor(sm, s);
  assert.ok(o3.improvements.some((i) => /Accountability/.test(i.evidence) && /nothing you wrote mentions/.test(i.evidence)));
  assert.ok(choose.options.includes('Accountability'));
});

test('the Event Infrastructure Plan quest is open to every member and follows The IV Phases', async () => {
  const q = quests.get('event-infrastructure');
  assert.ok(q && q.open);
  assert.deepEqual([...new Set(q.nodes.map((n) => n.phase))], [0, 1, 2, 3]);
  const token = await paidMember('live@example.com');
  const res = await call(token, 'GET', { key: 'event-infrastructure' });
  assert.equal(res.statusCode, 200);
  const a = {};
  q.nodes.forEach((n) => { a[n.id] = 'Our sound lead will own the system and power plan, and we review it every week before the date.'; });
  a.commit = 'I will lock the venue agreement by Friday.';
  const out = await call(token, 'POST', {}, { key: 'event-infrastructure', answers: a, complete: true });
  assert.equal(out.statusCode, 200);
  assert.equal(JSON.parse(out.body).saved.outcome.phaseMap.length, 4);
});

test('free members work the whole quest, but analysis and outcomes need Membership', async () => {
  const q = [...quests.values()].find((x) => x.archetype === 'checklist');
  const token = await member('freeq@example.com');
  const g = JSON.parse((await call(token, 'GET', { key: q.key })).body);
  assert.equal(g.canAnalyze, false);
  const r = await call(token, 'POST', {}, { key: q.key, answers: fullAnswers(q, true), complete: true });
  assert.equal(r.statusCode, 200);
  const out = JSON.parse(r.body);
  assert.equal(out.analysisLocked, true);
  assert.equal(out.saved.status, 'draft', 'answers are kept as a draft, not analysed');
  assert.equal(out.saved.outcome, undefined);
  assert.ok(out.preview && out.preview.summary && typeof out.preview.working === 'number' && typeof out.preview.toBuild === 'number', 'an Infrastructure Snapshot™ is returned');
  assert.equal(out.preview.improvements, undefined, 'the build list stays with Membership');
  assert.equal((await call(token, 'GET', { key: q.key, pdf: '1' })).statusCode, 404, 'no report without Membership');

  // The same answers are analysed once the member joins.
  const record = await fakeStore.getCustomerByToken(token);
  record.memberships = { membership: { status: 'active', interval: 'month', subscriptionId: 'sub_up', currentPeriodEnd: null } };
  await fakeStore.saveCustomer(record);
  assert.equal(JSON.parse((await call(token, 'GET', { key: q.key })).body).canAnalyze, true);
  const done = JSON.parse((await call(token, 'POST', {}, { key: q.key, answers: JSON.parse((await call(token, 'GET', { key: q.key })).body).saved.answers, complete: true })).body);
  assert.equal(done.saved.status, 'done');
  assert.ok(done.saved.outcome.improvements.length >= 3);
});

test('the free tool PDFs are open to everyone with no account', () => {
  const fs = require('fs');
  const path = require('path');
  const toml = fs.readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8');
  for (const t of freeTools) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', t.file)), t.file);
    assert.equal(toml.includes(`from = "${t.file}"`), false, `${t.file} must not be blocked`);
  }
});
