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

test('member feedback is recorded for the owner, emailed, and queued automatically (no approval queue)', async () => {
  const token = await member('m@example.com');
  const key = [...quests.keys()][0];
  assert.equal((await post(feedback, token, { questKey: key })).statusCode, 400);
  assert.equal((await post(feedback, token, { questKey: 'nope', unclear: 'x' })).statusCode, 400);
  const r = await post(feedback, token, { questKey: key, unclear: 'Step 2 was unclear', ecosystem: 'Introduce member enterprises' });
  assert.equal(r.statusCode, 201);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /Step 2 was unclear/);

  assert.equal((await admin('GET', null, 'wrong')).statusCode, 401);
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.feedback.length, 1);
  assert.equal(data.feedback[0].status, 'planned', 'approved automatically');
  assert.equal(data.awaiting, 0, 'only genuine founder decisions wait');
  assert.ok(data.trail.some((t) => t.collection === 'ip-feedback' && t.to === 'planned' && t.by === 'auto'));
});

test('the owner can still override; declining needs a note; every change is in the audit trail', async () => {
  const token = await member('m2@example.com');
  const key = [...quests.keys()][0];
  await post(feedback, token, { questKey: key, support: 'More templates' });
  const fb = JSON.parse((await admin('GET')).body).feedback[0];
  assert.equal((await admin('POST', { kind: 'feedback', id: fb.id, status: 'declined' })).statusCode, 400);
  assert.equal((await admin('POST', { kind: 'feedback', id: fb.id, status: 'declined', note: 'Out of scope for now' })).statusCode, 200);
  assert.equal((await admin('POST', { kind: 'backlog', id: backlog[0].id, status: 'considering', note: 'Q1' })).statusCode, 200);
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.feedback[0].status, 'declined');
  assert.equal(data.feedback[0].note, 'Out of scope for now');
  assert.equal(data.backlog.find((b) => b.id === backlog[0].id).status, 'considering', 'an owner decision is kept');
  assert.equal(data.awaiting, 0);
  assert.ok(data.trail.some((t) => t.id === fb.id && t.to === 'declined' && t.by === 'owner'));
  assert.ok(data.trail.some((t) => t.id === backlog[0].id && t.to === 'considering' && t.by === 'owner'));
});

test('every improvement idea is recorded done from the release that implemented and verified it', async () => {
  const data = JSON.parse((await admin('GET')).body);
  assert.equal(data.backlog.length, 14);
  for (const b of data.backlog) {
    assert.equal(b.status, 'done', b.id);
    assert.match(b.note, /Implemented in the 2026-11-25 release: .+ Verified:/);
  }
  // the trail shows work beginning (planned) before done, for every idea
  for (const b of backlog) {
    const steps = data.trail.filter((t) => t.id === b.id).map((t) => t.to);
    assert.ok(steps.includes('planned') && steps.includes('done'), b.id);
  }
  // reloading never duplicates the trail
  const again = JSON.parse((await admin('GET')).body);
  assert.equal(again.trail.length, data.trail.length);
});

test('closing feedback with a public note publishes only the note, never the member or their words', async () => {
  const token = await member('pub@example.com');
  const key = [...quests.keys()][0];
  await post(feedback, token, { questKey: key, unclear: 'PRIVATE-WORDS step 3 confused me' });
  const fb = JSON.parse((await admin('GET')).body).feedback[0];
  await admin('POST', { kind: 'feedback', id: fb.id, status: 'done', note: 'reworded', publicNote: 'Step 3 now says what a strong answer looks like.' });
  const changelog = require('../netlify/functions/changelog');
  const out = JSON.parse((await changelog.handler({ httpMethod: 'GET', headers: {} })).body);
  const e = out.entries.find((x) => x.source === 'Member feedback');
  assert.equal(e.text, 'Step 3 now says what a strong answer looks like.');
  const raw = JSON.stringify(out);
  assert.equal(raw.includes('PRIVATE-WORDS'), false);
  assert.equal(raw.includes('pub@example.com'), false);
  assert.equal(raw.includes(fb.memberId), false);
});

test('the weekly email reports progress, not an approval queue', async () => {
  await digest.handler();
  assert.equal(sent.length, 1);
  assert.match(sent[0].subject, /^IP progress: \d+ done this week/);
  assert.doesNotMatch(sent[0].text + sent[0].subject, /awaiting your decision/);
  assert.match(sent[0].text, /Implemented and verified this week/);
  assert.match(sent[0].text, /ip-feedback\.html/);
  assert.match(sent[0].text, new RegExp(backlog[0].id));
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
  assert.equal(data.portfolio.oe.length, 9); // every substation of the model, Products & Services included
  // The content audit finds nothing left to fix; every recommendation it made is recorded as implemented and verified.
  assert.equal(data.recommendations.filter((r) => r.source === 'content').length, 0);
  const log = require('../content/ip-implementation-log.json');
  const recIds = log.releases[0].items.filter((i) => /^(content|portfolio)-/.test(i.id)).map((i) => i.id);
  assert.equal(recIds.length, 69);
  assert.equal(log.releases[0].items.filter((i) => i.severity === 'high').length, 20);
  const done = new Map(data.resolved.map((r) => [r.id, r]));
  for (const id of recIds) {
    assert.equal((done.get(id) || {}).status, 'done', id);
    assert.match(done.get(id).note, /Implemented in the 2026-11-25 release/);
  }
  assert.equal(data.awaiting, 0);
});

test('the full question set of any IP can be read, and a decision on a recommendation is remembered', async () => {
  const one = JSON.parse((await analysisCall('GET', null, { quest: 'diagnostic' })).body);
  assert.ok(one.quest.nodes.length > 20);
  assert.equal((await analysisCall('GET', null, { quest: 'nope' })).statusCode, 404);

  // Two members say the same IP was unclear: a new recommendation appears, already approved as planned.
  const key = [...quests.keys()][0];
  for (const e of ['u1@example.com', 'u2@example.com']) await post(feedback, await member(e), { questKey: key, unclear: 'The third step was unclear to me' });
  const rec = JSON.parse((await analysisCall('GET')).body).recommendations.find((r) => r.source === 'feedback');
  assert.equal(rec.status, 'planned');
  assert.equal(rec.by, 'auto');
  assert.equal((await analysisCall('POST', { id: rec.id, status: 'declined' })).statusCode, 400);
  assert.equal((await analysisCall('POST', { id: rec.id, status: 'considering', note: 'Next quarter' })).statusCode, 200);
  const after = JSON.parse((await analysisCall('GET')).body);
  assert.equal(after.recommendations.find((r) => r.id === rec.id).status, 'considering');
  assert.equal(after.recommendations.find((r) => r.id === rec.id).by, 'owner');
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

test('content audit: balance is read outside the home phase, and a short path answers a long quest', () => {
  const nodes = (counts) => counts.flatMap((c, p) => Array.from({ length: c }, (_, i) => ({ id: `p${p}n${i}`, type: 'text', phase: p, section: 'S', prompt: `Question ${p}-${i}?` })));
  const balanced = { key: 'b', title: 'Home F', archetype: 'workbook', phase: 'Phase I · Foundations', nodes: nodes([12, 3, 3, 3]) };
  assert.ok(!auditQuest(balanced).findings.some((x) => x.id.endsWith('phase-balance')), 'a Foundations IP may go deepest in Foundations');
  const thin = { ...balanced, nodes: nodes([12, 6, 1, 3]) };
  assert.ok(auditQuest(thin).findings.some((x) => x.id.endsWith('phase-balance')));
  const allPhase = { ...balanced, phase: 'The IV Phases™', nodes: nodes([12, 3, 3, 3]) };
  assert.ok(auditQuest(allPhase).findings.some((x) => x.id.endsWith('phase-balance')), 'IP spanning all phases is balanced across all four');
  const long = { ...balanced, nodes: nodes([20, 8, 8, 8]) };
  assert.ok(auditQuest(long).findings.some((x) => x.id.endsWith('length')));
  assert.ok(!auditQuest({ ...long, shortPath: long.nodes.slice(0, 20).map((n) => n.id) }).findings.some((x) => x.id.endsWith('length')));
});

test('owner email links go through the private entry address so they open signed in', async () => {
  const { ownerLink } = require('../netlify/functions/lib/owner-link');
  const before = process.env.ADMIN_ENTRY;
  process.env.ADMIN_ENTRY = 'entry-key-test';
  assert.equal(ownerLink('ip-feedback.html'), 'https://wearethellab.com/admin/entry-key-test/ip-feedback.html');
  sent.length = 0;
  await digest.handler();
  assert.match(sent[0].text, /\/admin\/entry-key-test\/ip-feedback\.html/);
  assert.match(sent[0].html, /<a href="https:\/\/wearethellab\.com\/admin\/entry-key-test\/ip-feedback\.html">/);
  if (before === undefined) delete process.env.ADMIN_ENTRY; else process.env.ADMIN_ENTRY = before;
});
