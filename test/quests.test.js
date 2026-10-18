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

test('every free tool has a quest', () => {
  assert.equal(quests.size, freeTools.length);
  for (const t of freeTools) assert.ok(quests.get(t.key), t.key);
});

test('a perfect score still gets ways to improve, a low score gets a build list', () => {
  for (const q of quests.values()) {
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
  const q = [...quests.values()][0];
  assert.equal((await call(null, 'GET', { key: q.key })).statusCode, 401);
});

test('draft saves, finishing stores the outcome, report is a PDF, drafts never overwrite it', async () => {
  const token = await member('quester@example.com');
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
  const q = [...quests.values()][0];
  await call(a, 'POST', {}, { key: q.key, answers: fullAnswers(q, true), complete: true });
  assert.equal((await call(b, 'GET', { key: q.key, pdf: '1' })).statusCode, 404);
});
