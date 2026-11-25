// The IV Phases™ in every guided IP, and the 14 improvement ideas: Phase Readiness, the Legacy
// Statement, commitment check-ins, team mode, industry editions, the facilitator guide, the public
// changelog, the free Succession quest, and the .LLab Collaborating Enterprises upgrades.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const { quests, validateAnswers } = require('../netlify/functions/lib/quests');
const { auditQuest, catalog, portfolio } = require('../netlify/functions/lib/ip-audit');
const pricing = require('../netlify/functions/lib/pricing');
const { fulfillCheckoutSession } = require('../netlify/functions/lib/fulfill');
const signup = require('../netlify/functions/signup');
const quest = require('../netlify/functions/quest');
const legacy = require('../netlify/functions/legacy-statement');
const checkin = require('../netlify/functions/checkin');
const reminders = require('../netlify/functions/checkin-reminders');
const team = require('../netlify/functions/team');
const directory = require('../netlify/functions/directory');
const adminDirectory = require('../netlify/functions/admin-directory');
const me = require('../netlify/functions/me');
const overlay = require('../content/quest-phases.json').quests;
const PHASES = ['Foundations', 'Infrastructure Planning & Management', 'Internal Operating Systems', 'Preservation'];

let sent = [];
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
  process.env.ADMIN_TOKEN = 'tok';
});
test.afterEach(() => { mailer._setTransportForTests(null); delete process.env.ADMIN_TOKEN; });

async function member(email, { verified = true, membership = false } = {}) {
  await signup.handler({ httpMethod: 'POST', headers: {}, body: JSON.stringify({ email, password: 'free-pass-1' }) });
  const token = await fakeStore.getTokenByEmail(email);
  const r = await fakeStore.getCustomerByToken(token);
  r.emailVerified = verified;
  if (membership) r.memberships = { membership: { status: 'active', interval: 'month', subscriptionId: `sub_${email}`, currentPeriodEnd: null } };
  await fakeStore.saveCustomer(r);
  sent = [];
  return token;
}
async function buyer(email, key) {
  const product = pricing.registry.products.find((p) => p.key === key);
  await fulfillCheckoutSession({ id: `cs_${email}_${key}`, customer_details: { email }, amount_total: 1 }, [product.stripe_price_id]);
  const token = await fakeStore.getTokenByEmail(email);
  const r = await fakeStore.getCustomerByToken(token);
  r.emailVerified = true;
  await fakeStore.saveCustomer(r);
  sent = [];
  return token;
}
const fn = (handler, token, method, body, qs) => handler.handler({ httpMethod: method, headers: token ? { cookie: `collab_token=${token}` } : {}, queryStringParameters: qs || {}, body: body ? JSON.stringify(body) : undefined });
const answersFor = (q, nodes, v = 4) => {
  const a = {};
  for (const n of nodes || q.nodes) a[n.id] = n.type === 'check' ? true : n.type === 'scale' ? v : n.type === 'choose' ? n.options.slice(0, n.pickMin || 1) : 'Our weekly leadership meeting reviews this with the team, owned by our operations lead, by March.';
  a[q.closing.id] = 'I will brief the team on Monday and our COO owns the follow-up by Friday.';
  return a;
};

// ---------- The IV Phases™ in every guided IP ----------

test('every guided IP carries all four phases, with a four-part build guide, and the audit finds nothing left to fix', () => {
  for (const q of quests.values()) {
    const counts = [0, 0, 0, 0];
    [...q.nodes, ...(q.extend || [])].forEach((n) => { counts[Number.isInteger(n.phase) ? n.phase : auditQuest({ ...q, nodes: [n] }).phaseCounts.findIndex((c) => c)] += 1; });
    assert.ok(counts.every((c) => c > 0), `${q.key} covers every phase: ${counts.join('/')}`);
    assert.ok(Array.isArray(q.guide) && q.guide.length === 4 && q.guide.every((g) => g[0] && g[1]), `${q.key} has a deliverable and guidance for each phase`);
  }
  const items = catalog();
  const recs = [...items.flatMap((i) => (i.audit ? i.audit.findings : [])), ...portfolio(items).recommendations];
  assert.deepEqual(recs.map((r) => r.id), []);
});

test('the integration keeps saved answers valid: ids are stable, unique, and added prompts never reuse an id', () => {
  for (const [key, o] of Object.entries(overlay)) {
    const q = quests.get(key);
    assert.ok(q, `overlay for a real quest: ${key}`);
    const ids = [...q.nodes, ...(q.extend || [])].map((n) => n.id);
    assert.equal(new Set(ids).size, ids.length, `${key} ids unique`);
    for (const id of Object.keys(o.fix || {}).concat(Object.keys(o.pin || {}), o.drop || [])) {
      const base = JSON.parse(fs.readFileSync(`content/quests/${key}.json`, 'utf8'));
      assert.ok(base.nodes.some((n) => n.id === id), `${key}: ${id} exists in the base quest`);
    }
    for (const id of o.shortPath || []) assert.ok(q.nodes.some((n) => n.id === id), `${key} short path step ${id}`);
  }
});

test('scored tools keep their scoring: the four-phase steps there are optional and unscored', () => {
  const q = quests.get('free-continuity-quick-check');
  assert.ok(q.extend.length >= 1 && q.extend.every((n) => n.optional && n.type === 'text'));
  const a = answersFor(q);
  assert.equal(validateAnswers(q, a, { complete: true }).ok, true, 'finishes without the optional steps');
  assert.equal(validateAnswers(q, { ...a, [q.extend[0].id]: 'A written answer' }, { complete: true }).ok, true);
});

test('a long quest offers a short path that can be finished on its own', async () => {
  const token = await member('short@example.com', { membership: true });
  const q = quests.get('diagnostic');
  assert.ok(q.shortPath.length <= 30 && q.shortPath.length < q.nodes.length);
  const short = q.nodes.filter((n) => q.shortPath.includes(n.id));
  let r = await fn(quest, token, 'POST', { key: q.key, answers: answersFor(q, short), path: 'full', complete: true });
  assert.equal(r.statusCode, 400, 'the full path needs more');
  r = await fn(quest, token, 'POST', { key: q.key, answers: answersFor(q, short), path: 'short', complete: true });
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse(r.body).saved.path, 'short');
  const pdf = await fn(quest, token, 'GET', null, { key: q.key, pdf: '1' });
  assert.equal(Buffer.from(pdf.body, 'base64').subarray(0, 4).toString(), '%PDF');
});

// ---------- Industry editions ----------

test('the Diagnostic has Nonprofit and Small Enterprise editions, unlocked by the Diagnostic', async () => {
  const np = quests.get('diagnostic-nonprofit');
  const se = quests.get('diagnostic-small-enterprise');
  assert.equal(np.editionOf, 'diagnostic');
  assert.equal(np.direction, 'Nonprofits');
  assert.equal(se.direction, 'Enterprises');
  assert.deepEqual(np.nodes.map((n) => n.id), quests.get('diagnostic').nodes.map((n) => n.id), 'same steps, so the same model');
  assert.ok(np.nodes.some((n) => /nonprofit|board|volunteer/i.test(n.prompt)));
  assert.ok(se.nodes.some((n) => /enterprise|owner/i.test(n.prompt)));
  assert.ok(!JSON.stringify(se).match(/\bcompan(y|ies)\b/i), 'enterprise language');

  const free = await member('free-ed@example.com');
  assert.equal((await fn(quest, free, 'GET', null, { key: 'diagnostic-nonprofit' })).statusCode, 403);
  const owner = await buyer('diag@example.com', 'diagnostic');
  const r = await fn(quest, owner, 'GET', null, { key: 'diagnostic-nonprofit' });
  assert.equal(r.statusCode, 200);
  assert.equal(JSON.parse(r.body).canAnalyze, true);
  const view = JSON.parse((await fn(me, owner, 'GET')).body);
  assert.ok(view.questEditions.some((e) => e.key === 'diagnostic-small-enterprise' && e.of === 'diagnostic'));
});

// ---------- Free Succession quest ----------

test('the free Succession quest is open to every signed-in member and covers all four phases', async () => {
  const q = quests.get('free-succession');
  assert.equal(q.open, true);
  assert.deepEqual([0, 1, 2, 3].map((p) => q.nodes.filter((n) => n.phase === p).length), [3, 3, 3, 3]);
  const free = await member('succ@example.com');
  assert.equal((await fn(quest, free, 'GET', null, { key: q.key })).statusCode, 200);
  const r = await fn(quest, free, 'POST', { key: q.key, answers: answersFor(q), complete: true });
  assert.equal(r.statusCode, 200);
  assert.ok(JSON.parse(r.body).preview, 'free members get the Infrastructure Snapshot™');
  const view = JSON.parse((await fn(me, free, 'GET')).body);
  assert.ok(view.openQuests.some((o) => o.key === 'free-succession'));
});

// ---------- Phase Readiness, Legacy Statement, check-ins ----------

test('Phase Readiness totals every finished quest across The IV Phases™', async () => {
  const token = await member('ready@example.com', { membership: true });
  let view = JSON.parse((await fn(me, token, 'GET')).body);
  assert.equal(view.phaseReadiness.quests, 0);
  for (const key of ['values-charter', 'legacy-map']) {
    const q = quests.get(key);
    assert.equal((await fn(quest, token, 'POST', { key, answers: answersFor(q), complete: true })).statusCode, 200);
  }
  view = JSON.parse((await fn(me, token, 'GET')).body);
  assert.equal(view.phaseReadiness.quests, 2);
  assert.deepEqual(view.phaseReadiness.phases.map((p) => p.name), PHASES);
  assert.ok(view.phaseReadiness.phases.every((p) => p.readiness === null || (p.readiness >= 0 && p.readiness <= 100)));
  assert.ok(view.phaseReadiness.read.length > 10);
});

test('one Legacy Statement per member: drafted from their answers, saved privately, downloadable', async () => {
  const token = await member('legacy@example.com', { membership: true });
  const other = await member('other@example.com', { membership: true });
  const q = quests.get('values-charter');
  await fn(quest, token, 'POST', { key: q.key, answers: answersFor(q), complete: true });

  let r = JSON.parse((await fn(legacy, token, 'GET')).body);
  assert.equal(r.draft.phases.length, 4);
  assert.ok(r.suggested.some(Boolean), 'drafted from their own words');
  assert.equal(r.saved, null);
  assert.equal((await fn(legacy, token, 'GET', null, { pdf: '1' })).statusCode, 404, 'no PDF before saving');
  assert.equal((await fn(legacy, token, 'POST', { phases: ['', '', '', ''] })).statusCode, 400);
  const save = await fn(legacy, token, 'POST', { title: 'What we are building', phases: ['Our purpose.', 'Owners and backups.', 'A weekly rhythm.', 'A record for the next leader.'], closing: 'A lasting enterprise.' });
  assert.equal(save.statusCode, 200);
  r = JSON.parse((await fn(legacy, token, 'GET')).body);
  assert.equal(r.saved.phases[3], 'A record for the next leader.');
  const pdf = await fn(legacy, token, 'GET', null, { pdf: '1' });
  assert.equal(pdf.headers['Content-Type'], 'application/pdf');
  assert.equal(Buffer.from(pdf.body, 'base64').subarray(0, 4).toString(), '%PDF');
  // Private: another member sees only their own (none), and signed-out callers nothing.
  assert.equal(JSON.parse((await fn(legacy, other, 'GET')).body).saved, null);
  assert.equal((await fn(legacy, null, 'GET')).statusCode, 401);
  assert.equal(JSON.parse((await fn(me, token, 'GET')).body).hasLegacyStatement, true);
});

test('each commitment comes back at 30, 90 and 365 days; replies are private; reminders are sent once', async () => {
  const token = await member('commit@example.com', { membership: true });
  const q = quests.get('strength-map');
  await fn(quest, token, 'POST', { key: q.key, answers: answersFor(q), complete: true });
  let list = JSON.parse((await fn(checkin, token, 'GET')).body).checkins;
  assert.deepEqual(list.map((c) => c.day), [30, 90, 365]);
  assert.ok(list.every((c) => !c.due && c.commitment.includes('brief the team')));
  assert.equal((await fn(checkin, token, 'POST', { questKey: q.key, day: 30, status: 'kept' })).statusCode, 400, 'not due yet');

  // 31 days later
  const rec = await fakeStore.getCustomerByToken(token);
  rec.commitments[q.key].checkins[0].dueAt = new Date(Date.now() - 86400000).toISOString();
  await fakeStore.saveCustomer(rec);
  await reminders.handler();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'commit@example.com');
  assert.match(sent[0].text, /account\.html#checkins/);
  await reminders.handler();
  assert.equal(sent.length, 1, 'one email per check-in');

  assert.equal((await fn(checkin, token, 'POST', { questKey: q.key, day: 30, status: 'nope' })).statusCode, 400);
  const r = await fn(checkin, token, 'POST', { questKey: q.key, day: 30, status: 'in-progress', note: 'Halfway there' });
  assert.equal(r.statusCode, 200);
  list = JSON.parse(r.body).checkins;
  assert.equal(list[0].reply.status, 'in-progress');

  // The owner sees anonymous counts only.
  const { checkinInsights } = require('../netlify/functions/lib/member-ip');
  const counts = checkinInsights(await fakeStore.listCustomers());
  assert.deepEqual(counts.map((c) => [c.key, c.replies, c.inProgress]), [[q.key, 1, 1]]);
  assert.equal(JSON.stringify(counts).includes('Halfway'), false);
  assert.equal(JSON.stringify(counts).includes('commit@example.com'), false);
});

test('unconfirmed emails get no check-in reminders', async () => {
  const token = await member('unverified@example.com', { membership: true, verified: false });
  const q = quests.get('strength-map');
  await fn(quest, token, 'POST', { key: q.key, answers: answersFor(q), complete: true });
  const rec = await fakeStore.getCustomerByToken(token);
  rec.commitments[q.key].checkins[0].dueAt = new Date(Date.now() - 86400000).toISOString();
  await fakeStore.saveCustomer(rec);
  await reminders.handler();
  assert.equal(sent.length, 0);
});

// ---------- Team mode ----------

test('team mode: invite by email, answers shared only after accepting, and never after leaving', async () => {
  const lead = await member('lead@example.com', { membership: true });
  const mate = await member('mate@example.com', { membership: true });
  const outsider = await member('outsider@example.com', { membership: true });
  const key = 'free-foundation-strength-snapshot';
  const q = quests.get(key);

  const created = JSON.parse((await fn(team, lead, 'POST', { action: 'create', questKey: key, name: 'Leadership team' })).body).team;
  assert.equal(created.isLead, true);
  assert.equal((await fn(team, mate, 'POST', { action: 'invite', teamId: created.id, email: 'x@example.com' })).statusCode, 404, 'not on the team');
  assert.equal((await fn(team, lead, 'POST', { action: 'invite', teamId: created.id, email: 'bad' })).statusCode, 400);
  assert.equal((await fn(team, lead, 'POST', { action: 'invite', teamId: created.id, email: 'MATE@example.com' })).statusCode, 200);
  assert.equal(sent.length, 1);
  assert.match(sent[0].text, /nothing is shared unless you accept/);

  // Invited, not yet accepted: no comparison, and the lead sees no answers from them.
  const invited = JSON.parse((await fn(team, mate, 'GET')).body).teams;
  assert.equal(invited[0].myStatus, 'invited');
  assert.equal((await fn(team, mate, 'GET', null, { team: created.id })).statusCode, 404);
  assert.equal((await fn(team, outsider, 'GET', null, { team: created.id })).statusCode, 404);

  await fn(quest, lead, 'POST', { key, answers: { n1: 5, n2: 5, n3: 4, n4: 4 } });
  await fn(quest, mate, 'POST', { key, answers: { n1: 2, n2: 5, n3: 4, n4: 3 } });
  let cmp = JSON.parse((await fn(team, lead, 'GET', null, { team: created.id })).body).comparison;
  assert.equal(cmp.people.length, 1, 'only accepted members are compared');

  assert.equal((await fn(team, mate, 'POST', { action: 'accept', teamId: created.id })).statusCode, 200);
  cmp = JSON.parse((await fn(team, lead, 'GET', null, { team: created.id })).body).comparison;
  assert.equal(cmp.people.length, 2);
  assert.deepEqual(cmp.differences.map((d) => d.id), ['n1'], 'Clarity differs by 3 points');
  assert.equal(cmp.differences[0].spread, 3);
  assert.equal(cmp.quest.title, q.title);

  // A non-lead never sees invitees' emails.
  await fn(team, lead, 'POST', { action: 'invite', teamId: created.id, email: 'third@example.com' });
  const mateView = JSON.parse((await fn(team, mate, 'GET', null, { key })).body).teams[0];
  assert.ok(mateView.members.some((m) => m.label === 'Invitation pending'));
  assert.equal(JSON.stringify(mateView).includes('third@example.com'), false);
  const leadView = JSON.parse((await fn(team, lead, 'GET', null, { key })).body).teams[0];
  assert.ok(leadView.members.some((m) => m.label === 'third@example.com'));

  assert.equal((await fn(team, mate, 'POST', { action: 'leave', teamId: created.id })).statusCode, 200);
  cmp = JSON.parse((await fn(team, lead, 'GET', null, { team: created.id })).body).comparison;
  assert.equal(cmp.people.length, 1, 'leaving stops sharing');
  assert.equal((await fn(team, mate, 'GET', null, { team: created.id })).statusCode, 404);
});

// ---------- Facilitator guide and changelog pages ----------

test('the facilitator guide and the What Changed page are public, in the menu, and name no member', () => {
  const guide = fs.readFileSync('pages/facilitator-guide.html', 'utf8');
  assert.match(guide, /Foundation Strength Snapshot™/);
  assert.match(guide, /Compare our answers/);
  assert.match(guide, /Foundations, Infrastructure Planning &amp; Management, Internal Operating Systems, Preservation/);
  const cl = fs.readFileSync('pages/changelog.html', 'utf8');
  const entries = require('../content/changelog.json').entries;
  for (const e of entries) assert.ok(cl.includes(e.title.replace(/&/g, '&amp;')), e.title);
  assert.equal(/@[a-z0-9-]+\.[a-z]/i.test(cl.slice(cl.indexOf('<main>'), cl.indexOf('</main>'))), false, 'no email addresses');
  for (const p of ['pages/account.html', 'pages/quest.html']) assert.match(fs.readFileSync(p, 'utf8'), /facilitator-guide\.html/);
});

// ---------- The .LLab Collaborating Enterprises ----------

const listing = {
  companyName: 'Harbor Studio',
  description: 'We help small organizations build a clear brand and a site that lasts.',
  website: 'https://harborstudio.example.com',
  directions: ['Products & Services', 'Creators'],
  offerings: [{ name: 'Brand audit', kind: 'service', description: 'A two-week review', url: 'https://harborstudio.example.com/audit' }],
};
async function liveListing(email, extra) {
  const token = await buyer(email, 'strength-map');
  const r = await fn(directory, token, 'POST', { ...listing, ...extra });
  assert.equal(r.statusCode, 200, r.body);
  const rows = JSON.parse((await adminDirectory.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'tok' } })).body).listings;
  const row = rows.find((x) => x.companyName === (extra.companyName || listing.companyName));
  await adminDirectory.handler({ httpMethod: 'POST', headers: { 'x-admin-token': 'tok' }, body: JSON.stringify({ memberId: row.memberId, status: 'approved' }) });
  sent = [];
  return token;
}

test('directory filters span all nine Omnidirectional Enterprise™ directions', async () => {
  const d = JSON.parse((await fn(directory, null, 'GET')).body);
  assert.deepEqual(d.directions, ['Enterprises', 'Nonprofits', 'Communities', 'People', 'Products & Services', 'Technology', 'Capital', 'Knowledge + IP', 'Creators']);
  const { OE_NODES } = require('../netlify/functions/lib/quest-analysis');
  assert.deepEqual(d.directions, OE_NODES.map(([n]) => n));
  const js = fs.readFileSync('js/directory.js', 'utf8');
  for (const f of ['Nonprofit & Community', 'Welcomes introductions', 'Member offer', 'Seeking a successor', 'Seeking an apprentice']) assert.ok(js.includes(f), f);
});

test('introductions: only to enterprises that opted in, the owner email stays private, and each is counted', async () => {
  await liveListing('open@example.com', { companyName: 'Open Door', introOptIn: true });
  await liveListing('closed@example.com', { companyName: 'Closed Door', introOptIn: false });
  const asker = await member('asker@example.com');
  const pub = JSON.parse((await fn(directory, null, 'GET')).body).listings;
  const open = pub.find((l) => l.companyName === 'Open Door');
  const closed = pub.find((l) => l.companyName === 'Closed Door');
  assert.equal(open.acceptsIntros, true);
  assert.equal(JSON.stringify(pub).includes('open@example.com'), false);

  assert.equal((await fn(directory, null, 'POST', { action: 'intro', listingId: open.id, message: 'x'.repeat(30) })).statusCode, 401);
  assert.equal((await fn(directory, asker, 'POST', { action: 'intro', listingId: closed.id, message: 'Hello, I run a studio nearby.' })).statusCode, 404);
  assert.equal((await fn(directory, asker, 'POST', { action: 'intro', listingId: open.id, message: 'short' })).statusCode, 400);
  const r = await fn(directory, asker, 'POST', { action: 'intro', listingId: open.id, message: 'Hello, I run a studio nearby and would like to collaborate.' });
  assert.equal(r.statusCode, 200);
  assert.equal(r.body.includes('open@example.com'), false, 'the requester never sees the owner address');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'open@example.com');
  assert.equal(sent[0].replyTo, 'asker@example.com');

  const unverified = await member('unv@example.com', { verified: false });
  assert.equal((await fn(directory, unverified, 'POST', { action: 'intro', listingId: open.id, message: 'Hello, I run a studio nearby and would like to collaborate.' })).statusCode, 403);

  const report = JSON.parse((await adminDirectory.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'tok' } })).body).report;
  const year = report.years.find((y) => y.year === new Date().toISOString().slice(0, 4));
  assert.equal(year.intros, 1);
  assert.equal(report.live.acceptingIntros, 1);
});

test('member offers are for signed-in members; Nonprofit & Community requests and successor flags are shown and counted', async () => {
  await liveListing('offer@example.com', { companyName: 'Offer Co', memberOffer: { text: '15% off a brand audit', terms: 'Members only, until June 30.' }, seeking: ['successor', 'bogus'] });
  await liveListing('np@example.com', { companyName: 'Riverside Pantry', category: 'nonprofit-community', directions: ['Nonprofits', 'Communities'], offerings: [], requests: [{ kind: 'volunteer', text: 'Saturday food sorting' }, { kind: 'skill', text: 'Bookkeeping help' }] });
  assert.match((await fn(directory, await buyer('noterms@example.com', 'strength-map'), 'POST', { ...listing, companyName: 'No Terms', memberOffer: { text: 'A deal' } })).body, /terms/);

  const pub = JSON.parse((await fn(directory, null, 'GET', null, { members: '1' })).body).listings;
  const offer = pub.find((l) => l.companyName === 'Offer Co');
  assert.equal(offer.hasMemberOffer, true);
  assert.equal(offer.memberOffer, undefined, 'signed out: no offer text');
  assert.deepEqual(offer.seeking, ['successor']);
  const np = pub.find((l) => l.companyName === 'Riverside Pantry');
  assert.equal(np.category, 'nonprofit-community');
  assert.equal(np.requests.length, 2);

  const viewer = await member('viewer@example.com');
  const signedIn = JSON.parse((await fn(directory, viewer, 'GET', null, { members: '1' })).body);
  assert.equal(signedIn.member, true);
  assert.equal(signedIn.listings.find((l) => l.companyName === 'Offer Co').memberOffer.terms, 'Members only, until June 30.');

  const report = JSON.parse((await adminDirectory.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'tok' } })).body).report;
  assert.equal(report.live.memberOffers, 1);
  assert.equal(report.live.nonprofitCommunity, 1);
  assert.equal(report.live.seekingSuccessor, 1);
  assert.equal(report.years[0].offers, 1, 'a published offer is counted once');
  assert.equal(JSON.stringify(report).includes('offer@example.com'), false);
});
