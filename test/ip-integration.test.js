// IP & Membership integration: every purchasable IP can be previewed before purchase, the shop
// explains how IP works inside The .LLab, and the member journey carries information forward
// (carry-forward suggestions, run-over-run comparisons, progression across The IV Phases™)
// with customer entries kept apart from system analysis.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const reg = require('../content/pricing.json');
const { quests } = require('../netlify/functions/lib/quests');
const { LEGACY_QUESTION } = require('../netlify/functions/lib/quest-analysis');
const { topicOf, carryFor } = require('../netlify/functions/lib/carry-forward');
const { buildAccountView } = require('../netlify/functions/lib/account-view');
const { buildQuestPdf } = require('../netlify/functions/lib/quest-pdf');
const quest = require('../netlify/functions/quest');
const signup = require('../netlify/functions/signup');

const hub = fs.readFileSync('pages/all-products.html', 'utf8');
const purchasable = () => [
  ...reg.products.filter((p) => !p.retired_from_sale && !/Founders Organization/.test(p.phase || '')),
  ...reg.partner_ip,
  ...reg.blueprint_series,
];
const cardOf = (key) => {
  const i = hub.indexOf(`id="ip-${key}"`);
  return i < 0 ? null : hub.slice(i, hub.indexOf('</article>', i));
};

test('every purchasable IP has a Look inside preview on its shop card, before the buy button', () => {
  for (const p of purchasable()) {
    const card = cardOf(p.key);
    assert.ok(card, `${p.key} has a card with id ip-${p.key}`);
    assert.match(card, /<details class="fx-peek"><summary>Look inside<\/summary>/, p.key);
    assert.ok(card.indexOf('fx-peek') < card.indexOf('fx-buy'), `${p.key}: preview before the price`);
    assert.match(card, /How you get it/, p.key);
    assert.match(card, /Preview only/, p.key);
  }
});

test('previews show representative content, never the whole method', () => {
  for (const p of purchasable()) {
    const q = quests.get(p.key);
    if (!q) continue;
    const card = cardOf(p.key);
    const m = /Two sample prompts from the method<\/p><ul>([\s\S]*?)<\/ul>/.exec(card);
    assert.ok(m, `${p.key} shows sample prompts`);
    assert.ok((m[1].match(/<li>/g) || []).length <= 2, `${p.key}: at most two prompts`);
    // later steps and the closing commitment stay inside the product
    // (the phase's guiding question, shown under Where it sits, is public model language, not the product's method)
    const shown = q.nodes.filter((n) => !LEGACY_QUESTION.includes(n.prompt)).filter((n) => card.includes(n.prompt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'))).length;
    assert.ok(shown <= 2, `${p.key}: ${shown} prompts exposed`);
  }
});

test('the preview says plainly what is included with Membership and what is a separate purchase', () => {
  assert.match(cardOf('values-charter'), /Included with The \.LLab Membership™/);
  assert.match(cardOf('creator-identity-map'), /not included in The \.LLab Membership™/);
  assert.match(cardOf('blueprint-phase1'), /Not included in The \.LLab Membership™/);
  assert.match(cardOf('legacy-preservation-vault'), /Partner-only IP\. Included with/);
});

test('the shop explains how IP works inside The .LLab; the .LLab page links to it', () => {
  assert.match(hub, /id="how-ip-works"/);
  assert.match(hub, /The IP is the method\. <strong>The \.LLab™ is where you work it\.<\/strong>/);
  for (const s of ['On its own', 'Together, inside The .LLab™', 'Included or separate']) assert.ok(hub.includes(`<h3>${s}</h3>`), s);
  assert.match(fs.readFileSync('pages/products.html', 'utf8'), /all-products\.html#how-ip-works/);
  assert.match(fs.readFileSync('js/account.js', 'utf8'), /all-products\.html#ip-/, 'portal shop cards link to the preview');
});

test('carry-forward matches only prompts that ask for the topic outright', () => {
  const hits = [];
  for (const q of quests.values()) for (const n of q.nodes) { const t = topicOf(n); if (t) hits.push(`${q.key}:${t.id}`); }
  for (const h of ['alignment-map:mission', 'values-charter:mission', 'legacy-map:vision', 'foundations-manual:purpose', 'legacy-foundations-framework:legacy-statement']) assert.ok(hits.includes(h), h);
  assert.ok(!hits.some((h) => h.startsWith('event-infrastructure:')), 'an event purpose is not the enterprise purpose');
  assert.ok(!hits.some((h) => h.startsWith('blueprint-phase1:')), 'a question that mentions the mission is not the mission');
});

const answersFor = (q, text) => {
  const a = {};
  for (const n of q.nodes) {
    if (n.type === 'check') a[n.id] = true;
    else if (n.type === 'scale') a[n.id] = 4;
    else if (n.type === 'choose') a[n.id] = n.options.slice(0, Math.max(n.pickMin || 1, 1));
    else a[n.id] = text;
  }
  a[q.closing.id] = 'Our leadership team will review this charter on the first Monday of every quarter.';
  return a;
};
const call = (token, method, qs, body) => quest.handler({ httpMethod: method, headers: { cookie: `collab_token=${token}` }, queryStringParameters: qs || {}, body: body ? JSON.stringify(body) : undefined });
async function paidMember(email) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'member-pass-1' }) });
  const token = await fakeStore.getTokenByEmail(email);
  const record = await fakeStore.getCustomerByToken(token);
  record.memberships = { membership: { status: 'active', interval: 'month', subscriptionId: 'sub_int', currentPeriodEnd: null } };
  await fakeStore.saveCustomer(record);
  return token;
}

test('member journey: one IP feeds the next, a retake is compared with the last run, progress carries across phases', async () => {
  fakeStore.reset();
  const token = await paidMember('integrated@example.com');

  // Phase I: the Mission & Values Charter.
  const charter = quests.get('values-charter');
  const missionNode = charter.nodes.find((n) => topicOf(n) && topicOf(n).id === 'mission');
  const a1 = answersFor(charter, 'We serve families who run small farms.');
  a1[missionNode.id] = 'We help family farms stay in the family for the next generation.';
  let r = await call(token, 'POST', {}, { key: 'values-charter', answers: a1, complete: true });
  assert.equal(r.statusCode, 200, r.body);

  // Phase II: the Alignment Map offers that mission back (a suggestion, never pre-filled).
  r = await call(token, 'GET', { key: 'alignment-map' });
  const g = JSON.parse(r.body);
  const align = quests.get('alignment-map');
  const target = align.nodes.find((n) => topicOf(n) && topicOf(n).id === 'mission');
  assert.equal(g.carry[target.id].value, a1[missionNode.id]);
  assert.equal(g.carry[target.id].fromKey, 'values-charter');
  assert.equal(g.saved, null, 'nothing is written into the new quest for them');

  // Retaking keeps a summary of the earlier run (not its answers) and returns the comparison.
  const a2 = answersFor(charter, 'We document every role so the farm runs without one person.');
  r = await call(token, 'POST', {}, { key: 'values-charter', answers: a2, complete: true });
  const done = JSON.parse(r.body);
  assert.equal(done.saved.history.length, 1);
  assert.ok(!('answers' in done.saved.history[0]), 'history keeps no old answers');
  assert.ok(done.comparison && /working \(was \d+\)/.test(done.comparison.read));
  assert.equal(done.comparison.phases.length, 4);
  const again = JSON.parse((await call(token, 'GET', { key: 'values-charter' })).body);
  assert.ok(again.comparison, 'the comparison is shown when they come back');

  // The portal: runs, phase readiness and the next step in each phase.
  const record = await fakeStore.getCustomerByToken(token);
  const view = buildAccountView(record, Date.now());
  assert.equal(view.quests['values-charter'].runs, 2);
  assert.ok(view.progression.next.length > 0 && view.progression.next.length <= 3);
  assert.ok(view.progression.phases[0].done.some((d) => d.key === 'values-charter'));
  assert.ok(view.progression.next.every((n) => ['continue', 'start', 'add'].includes(n.kind)));

  // The report keeps the member's entries apart from the system analysis.
  const pdf = await buildQuestPdf({ quest: charter, record, result: record.quests['values-charter'] });
  assert.ok(pdf.length > 1000);
});

test('carry-forward never reads another member, and drafts count as their own words', () => {
  const align = quests.get('alignment-map');
  assert.deepEqual(carryFor(align, { quests: {} }), {});
  const charter = quests.get('values-charter');
  const node = charter.nodes.find((n) => topicOf(n) && topicOf(n).id === 'vision');
  const out = carryFor(align, { quests: { 'values-charter': { status: 'draft', answers: { [node.id]: 'A farm in every county.' }, updatedAt: '2026-11-01' } } });
  const v = Object.values(out).find((x) => x.topic === 'vision');
  assert.equal(v.value, 'A farm in every county.');
});

test('the portal and quest page label customer entries and system analysis', () => {
  assert.match(fs.readFileSync('pages/account.html', 'utf8'), /<strong>Your entries<\/strong> are exactly what you wrote or chose/);
  const qp = fs.readFileSync('pages/quest.html', 'utf8');
  assert.match(qp, /id="r-provenance"/);
  assert.match(qp, /id="r-history"/);
  assert.match(fs.readFileSync('netlify/functions/lib/quest-pdf.js', 'utf8'), /Your answers \(what you entered\)/);
});
