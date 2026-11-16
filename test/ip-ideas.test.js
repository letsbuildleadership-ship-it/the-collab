// The improvement ideas from the IP review: Legacy Statement, Phase Readiness,
// commitment check-ins, team mode, Diagnostic editions, the Succession quest, the changelog.
const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const pricing = require('../netlify/functions/lib/pricing');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const signup = require('../netlify/functions/signup');
const quest = require('../netlify/functions/quest');
const legacy = require('../netlify/functions/legacy');
const team = require('../netlify/functions/quest-team');
const checkin = require('../netlify/functions/quest-checkin');
const sendCheckins = require('../netlify/functions/quest-checkins');
const changelog = require('../netlify/functions/changelog');
const adminIp = require('../netlify/functions/admin-ip');
const { quests } = require('../netlify/functions/lib/quests');

let sent = [];
test.beforeEach(() => { fakeStore.reset(); sent = []; mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } }); process.env.ADMIN_TOKEN = 'tok'; });
test.afterEach(() => { mailer._setTransportForTests(null); delete process.env.ADMIN_TOKEN; });

async function paid(email, key = 'values-charter') {
  const product = pricing.registry.products.find((p) => p.key === key);
  await fulfillCheckoutSession({ id: `cs_${email}_${key}`, customer_details: { email }, amount_total: 1 }, [product.stripe_price_id]);
  return fakeStore.getTokenByEmail(email);
}
async function free(email) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'free-pass-1' }) });
  return fakeStore.getTokenByEmail(email);
}
const h = (token) => (token ? { cookie: `collab_token=${token}` } : {});
const callQuest = (token, method, qs, body) => quest.handler({ httpMethod: method, headers: h(token), queryStringParameters: qs || {}, body: body ? JSON.stringify(body) : undefined });

function fullAnswers(q, text = 'We serve families in our community with care and clear standards.') {
  const a = { [q.closing.id]: 'Write the charter down and review it with the board by March.', omni: 'Partners and nonprofits in our town could carry this with us.' };
  q.nodes.forEach((n) => {
    if (n.type === 'scale') a[n.id] = 4;
    else if (n.type === 'check') a[n.id] = true;
    else if (n.type === 'choose') a[n.id] = n.options.slice(0, n.pickMin || 1);
    else a[n.id] = `${text} (${n.id})`;
  });
  return a;
}

test('Legacy Statement and Phase Readiness come only from the member\'s own finished quests', async () => {
  const t = await paid('lead@example.com');
  const empty = JSON.parse((await legacy.handler({ httpMethod: 'GET', headers: h(t) })).body);
  assert.equal(empty.readiness.quests, 0);
  const q = quests.get('values-charter');
  assert.equal((await callQuest(t, 'POST', {}, { key: q.key, answers: fullAnswers(q), complete: true })).statusCode, 200);
  const d = JSON.parse((await legacy.handler({ httpMethod: 'GET', headers: h(t) })).body);
  assert.equal(d.readiness.quests, 1);
  assert.equal(d.statement.sections.length, 4);
  assert.ok(d.statement.complete, 'values charter now carries all four phases');
  d.statement.sections.forEach((s) => s.lines.forEach((l) => assert.match(l.text, /We serve families/)));
  assert.equal(d.statement.commitments[0].text, 'Write the charter down and review it with the board by March.');
  assert.equal((await legacy.handler({ httpMethod: 'GET', headers: {} })).statusCode, 401);
});

test('check-ins: sent at the newest milestone due, once, skipping missed ones; replies and opt-out are kept', async () => {
  const t = await paid('ci@example.com');
  const q = quests.get('values-charter');
  await callQuest(t, 'POST', {}, { key: q.key, answers: fullAnswers(q), complete: true });
  const rec = await fakeStore.getCustomerByToken(t);
  rec.quests[q.key].completedAt = new Date(Date.now() - 95 * 864e5).toISOString();
  await fakeStore.saveCustomer(rec);
  await sendCheckins.handler();
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /Ninety days/);
  assert.match(sent[0].text, /checkin\.html\?key=values-charter&d=90/);
  const after = await fakeStore.getCustomerByToken(t);
  assert.ok(after.quests[q.key].checkins[90].sentAt);
  assert.equal(after.quests[q.key].checkins[30].skipped, true);
  await sendCheckins.handler();
  assert.equal(sent.length, 1, 'not sent twice');
  const post = (body) => checkin.handler({ httpMethod: 'POST', headers: h(t), body: JSON.stringify(body) });
  assert.equal((await post({ key: q.key, d: 90, status: 'maybe' })).statusCode, 400);
  assert.equal((await post({ key: q.key, d: 90, status: 'partly', note: 'Drafted, not yet reviewed.' })).statusCode, 200);
  const got = JSON.parse((await checkin.handler({ httpMethod: 'GET', headers: h(t), queryStringParameters: { key: q.key, d: '90' } })).body);
  assert.equal(got.checkin.status, 'partly');
  assert.match(got.commitment, /charter/);
  assert.equal(JSON.parse((await post({ off: true })).body).off, true);
  const r2 = await fakeStore.getCustomerByToken(t);
  r2.quests[q.key].completedAt = new Date(Date.now() - 400 * 864e5).toISOString();
  await fakeStore.saveCustomer(r2);
  await sendCheckins.handler();
  assert.equal(sent.length, 1, 'opted out');
});

test('team mode: invitees answer with the inviter\'s access and see where the team differs', async () => {
  const owner = await paid('owner@example.com', 'strength-map');
  const q = quests.get('strength-map');
  const res = await team.handler({ httpMethod: 'POST', headers: h(owner), body: JSON.stringify({ key: q.key, emails: 'cfo@example.com, bad-email' }) });
  assert.equal(res.statusCode, 400);
  const ok = JSON.parse((await team.handler({ httpMethod: 'POST', headers: h(owner), body: JSON.stringify({ key: q.key, emails: 'cfo@example.com' }) })).body);
  assert.equal(ok.invited, 1);
  assert.match(sent[0].text, /quest\.html\?key=strength-map&team=[a-f0-9]{16}/);
  assert.match(sent[0].text, /shared with the team/);
  const id = ok.team.id;
  const cfo = await free('cfo@example.com');
  const stranger = await free('x@example.com');
  assert.equal((await callQuest(cfo, 'GET', { key: q.key })).statusCode, 403, 'no access without the team link');
  assert.equal((await callQuest(stranger, 'GET', { key: q.key, team: id })).statusCode, 403, 'not invited');
  assert.equal((await callQuest(cfo, 'GET', { key: q.key, team: id })).statusCode, 200);
  const scale = q.nodes.find((n) => n.type === 'scale') || null;
  const a1 = fullAnswers(q, 'Owner view');
  const a2 = fullAnswers(q, 'CFO view');
  if (scale) { a1[scale.id] = 5; a2[scale.id] = 2; }
  await callQuest(owner, 'POST', {}, { key: q.key, answers: a1 });
  await callQuest(cfo, 'POST', {}, { key: q.key, answers: a2, team: id });
  const view = JSON.parse((await team.handler({ httpMethod: 'GET', headers: h(cfo), queryStringParameters: { key: q.key, team: id } })).body).view;
  assert.equal(view.answering, 2);
  assert.ok(view.steps.every((s) => s.answers.length === 2));
  assert.ok(view.steps.some((s) => s.answers.some((a) => a.who === 'You')));
  const strangerView = JSON.parse((await team.handler({ httpMethod: 'GET', headers: h(stranger), queryStringParameters: { key: q.key, team: id } })).body);
  assert.equal(strangerView.team, null);
});

test('Diagnostic editions keep the same steps in each audience\'s language', async () => {
  const t = await paid('np@example.com', 'diagnostic');
  const base = JSON.parse((await callQuest(t, 'GET', { key: 'diagnostic' })).body).quest;
  const np = JSON.parse((await callQuest(t, 'GET', { key: 'diagnostic', edition: 'nonprofit' })).body).quest;
  const se = JSON.parse((await callQuest(t, 'GET', { key: 'diagnostic', edition: 'small-enterprise' })).body).quest;
  assert.deepEqual(base.editions.map((e) => e.serves), ['Nonprofits', 'Enterprises']);
  assert.deepEqual(np.nodes.map((n) => n.id), base.nodes.map((n) => n.id));
  assert.match(np.nodes.find((n) => n.id === 'n2').prompt, /board/);
  assert.match(se.nodes.find((n) => n.id === 'n39').prompt, /owner/);
  assert.equal(np.edition, 'nonprofit');
});

test('the free Succession quest is open to every member and carries all four phases', async () => {
  const q = quests.get('succession');
  assert.ok(q.open);
  assert.deepEqual([0, 1, 2, 3].map((p) => q.nodes.filter((n) => n.phase === p).length > 0), [true, true, true, true]);
  const t = await free('succ@example.com');
  assert.equal((await callQuest(t, 'GET', { key: 'succession' })).statusCode, 200);
});

test('changelog publishes only done feedback with a public note, never a member', async () => {
  const fb = { id: 'fb-1', createdAt: '2026-11-01', questKey: 'values-charter', questTitle: 'The .LLab Mission & Values Charter™', memberId: 'M-1', unclear: 'Step 3 was confusing', status: 'new' };
  await fakeStore.opsPut('ip-feedback', fb.id, fb);
  await fakeStore.opsPut('ip-feedback', 'fb-2', { ...fb, id: 'fb-2' });
  const admin = (body) => adminIp.handler({ httpMethod: 'POST', headers: { 'x-admin-token': 'tok' }, body: JSON.stringify(body) });
  await admin({ kind: 'feedback', id: 'fb-1', status: 'done', publicNote: 'Step 3 now asks one value at a time, with a guiding question.' });
  await admin({ kind: 'feedback', id: 'fb-2', status: 'done' });
  const out = JSON.parse((await changelog.handler({ httpMethod: 'GET' })).body);
  assert.equal(out.entries.length, 1);
  assert.equal(out.entries[0].change, 'Step 3 now asks one value at a time, with a guiding question.');
  assert.ok(!JSON.stringify(out).includes('M-1'));
});
