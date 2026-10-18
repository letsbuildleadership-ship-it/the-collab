const test = require('node:test');
const assert = require('node:assert/strict');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const signup = require('../netlify/functions/signup');
const quest = require('../netlify/functions/quest');
const feedback = require('../netlify/functions/ip-feedback');
const adminIp = require('../netlify/functions/admin-ip');
const digest = require('../netlify/functions/ip-digest');
const { quests } = require('../netlify/functions/lib/quests');
const backlog = require('../content/ip-backlog.json').items;

let sent = [];
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
  process.env.ADMIN_TOKEN = 'tok';
});
test.afterEach(() => { mailer._setTransportForTests(null); delete process.env.ADMIN_TOKEN; });

async function member(email) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'free-pass-1' }) });
  sent = [];
  return fakeStore.getTokenByEmail(email);
}
const post = (fn, token, body) => fn.handler({ httpMethod: 'POST', headers: { cookie: `collab_token=${token}` }, queryStringParameters: {}, body: JSON.stringify(body) });
const admin = (method, body, tok = 'tok') => adminIp.handler({ httpMethod: method, headers: { 'x-admin-token': tok }, body: body ? JSON.stringify(body) : undefined });

test('member feedback is recorded for the owner, emailed, and stays new until decided', async () => {
  const token = await member('m@example.com');
  const key = [...quests.keys()][0];
  assert.equal((await post(feedback, token, { questKey: key })).statusCode, 400);
  assert.equal((await post(feedback, token, { questKey: 'nope', unclear: 'x' })).statusCode, 400);
  const r = await post(feedback, token, { questKey: key, unclear: 'Step 2 was unclear', ecosystem: 'Introduce member companies' });
  assert.equal(r.statusCode, 201);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Step 2 was unclear/);

  assert.equal((await admin('GET', null, 'wrong')).statusCode, 401);
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.feedback.length, 1);
  assert.equal(data.feedback[0].status, 'new');
  assert.equal(data.awaiting, backlog.length + 1);
});

test('a decision is recorded; declining needs a note; nothing is lost', async () => {
  const token = await member('m2@example.com');
  const key = [...quests.keys()][0];
  await post(feedback, token, { questKey: key, support: 'More templates' });
  const fb = JSON.parse((await admin('GET')).body).feedback[0];
  assert.equal((await admin('POST', { kind: 'feedback', id: fb.id, status: 'declined' })).statusCode, 400);
  assert.equal((await admin('POST', { kind: 'feedback', id: fb.id, status: 'declined', note: 'Out of scope for now' })).statusCode, 200);
  assert.equal((await admin('POST', { kind: 'backlog', id: backlog[0].id, status: 'planned', note: 'Q1' })).statusCode, 200);
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.feedback[0].status, 'declined');
  assert.equal(data.feedback[0].note, 'Out of scope for now');
  assert.equal(data.backlog.find((b) => b.id === backlog[0].id).status, 'planned');
  assert.equal(data.awaiting, backlog.length - 1);
});

test('the weekly digest lists what is still undecided', async () => {
  await digest.handler();
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /awaiting your decision/);
  assert.match(sent[0].text, /ip-feedback\.html/);
  assert.match(sent[0].text, new RegExp(backlog[0].title.slice(0, 20)));
});

test('backlog covers both the IP and the Omnidirectional Enterprise ecosystem', () => {
  assert.ok(backlog.some((b) => b.area === 'IP') && backlog.some((b) => b.area === 'Ecosystem'));
  assert.equal(new Set(backlog.map((b) => b.id)).size, backlog.length);
});

test('insights are anonymous counts and flag nothing until there is enough data', async () => {
  const token = await member('m3@example.com');
  const key = 'free-foundation-strength-snapshot';
  await post(quest, token, { key, answers: { n1: 2 } });
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.insights.enoughData, false);
  assert.equal(data.insights.suggestions.length, 0);
  assert.equal(JSON.stringify(data.insights).includes('m3@example.com'), false);
});

const analysisFn = require('../netlify/functions/admin-ip-analysis');
const { auditQuest } = require('../netlify/functions/lib/ip-audit');
const analysisCall = (method, body, qs, tok = 'tok') => analysisFn.handler({ httpMethod: method, headers: { 'x-admin-token': tok }, queryStringParameters: qs || {}, body: body ? JSON.stringify(body) : undefined });

test('IP analysis is owner-only and covers every guided IP with structure, portfolio and recommendations', async () => {
  assert.equal((await analysisCall('GET', null, null, 'wrong')).statusCode, 401);
  const data = JSON.parse((await analysisCall('GET')).body);
  assert.ok(data.catalog.length >= quests.size);
  assert.ok(data.catalog.every((i) => i.title && i.kind));
  assert.equal(data.portfolio.phaseTotals.length, 4);
  assert.equal(data.portfolio.oe.length, 8);
  assert.ok(data.recommendations.length > 0);
  assert.ok(data.recommendations.every((r) => r.id && r.text && ['high', 'medium', 'low'].includes(r.severity) && r.status === 'new'));
  assert.equal(new Set(data.recommendations.map((r) => r.id)).size, data.recommendations.length, 'ids are unique and stable');
  assert.equal(data.awaiting, data.recommendations.length);
});

test('the full question set of any IP can be read, and a decision on a recommendation is remembered', async () => {
  const one = JSON.parse((await analysisCall('GET', null, { quest: 'diagnostic' })).body);
  assert.ok(one.quest.nodes.length > 20);
  assert.equal((await analysisCall('GET', null, { quest: 'nope' })).statusCode, 404);

  const rec = JSON.parse((await analysisCall('GET')).body).recommendations[0];
  assert.equal((await analysisCall('POST', { id: rec.id, status: 'declined' })).statusCode, 400);
  assert.equal((await analysisCall('POST', { id: rec.id, status: 'planned', note: 'Next quarter' })).statusCode, 200);
  const after = JSON.parse((await analysisCall('GET')).body);
  assert.equal(after.recommendations.find((r) => r.id === rec.id).status, 'planned');
  assert.equal(after.awaiting, after.recommendations.length - 1);
});

test('content audit flags missing phases, bare labels and repeated prompts', () => {
  const q = { key: 'x', title: 'Test IP', archetype: 'workbook', phase: 'Phase I · Foundations', nodes: [
    { id: 'n1', type: 'text', phase: 0, section: 'A', prompt: 'Our mission:' },
    { id: 'n2', type: 'text', phase: 0, section: 'A', prompt: 'Our vision:' },
    { id: 'n3', type: 'text', phase: 0, section: 'A', prompt: 'Our values:' },
    { id: 'n4', type: 'text', phase: 0, section: 'A', prompt: 'Our values:' },
  ] };
  const f = auditQuest(q).findings.map((x) => x.id.split('-').pop());
  assert.ok(f.includes('gap'));
  assert.ok(f.includes('labels'));
  assert.ok(f.includes('duplicates'));
});
