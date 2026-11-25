// Team mode: several leaders work the same quest, each in their own account, then see where
// their answers differ. A member starts a team on a quest and invites colleagues by email.
// Consent: an invitee's answers are shown to the team only after they accept, and stop being
// shown the moment they leave (or the lead removes them). Nothing is shown to anyone outside
// the team, and the owner never sees team answers.
//   GET                      my teams and invitations
//   GET ?key=<quest>         my teams on that quest
//   GET ?team=<id>           the team's comparison (accepted members only)
//   POST { action: create | invite | accept | decline | leave | remove, ... }
const crypto = require('crypto');
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests } = require('./lib/quests');
const { sendMail } = require('./lib/mailer');

const COLLECTION = 'quest-teams';
const MAX_MEMBERS = 12;
const MAX_TEAMS = 10;
const SITE = (process.env.URL || 'https://wearethellab.com').replace(/\/$/, '');
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const newMid = () => crypto.randomBytes(5).toString('hex');
const displayName = (r) => (r && r.name ? String(r.name).split(' ')[0] : r && r.email ? r.email.split('@')[0] : 'A colleague');

function myRole(team, rec) {
  const email = String(rec.email || '').toLowerCase();
  return team.members.find((m) => (m.memberId && m.memberId === rec.memberId) || (!m.memberId && m.email === email) || m.email === email) || null;
}

function view(team, rec) {
  const me = myRole(team, rec);
  const q = quests.get(team.questKey);
  const accepted = team.members.filter((m) => m.status === 'accepted');
  return {
    id: team.id,
    name: team.name,
    questKey: team.questKey,
    questTitle: q ? q.title : team.questKey,
    lead: team.leadName,
    isLead: team.leadMemberId === rec.memberId,
    myStatus: me ? me.status : null,
    // Invitees' emails are shown only to the lead who invited them; others see "Invitation pending".
    members: me && me.status === 'accepted' ? team.members.filter((m) => ['invited', 'accepted'].includes(m.status)).map((m) => ({ id: m.mid, label: m.status === 'accepted' ? m.label : team.leadMemberId === rec.memberId ? m.email : 'Invitation pending', status: m.status, me: m === me })) : [],
    acceptedCount: accepted.length,
  };
}

async function recordFor(m) {
  if (!m.memberId) return null;
  const token = await store.getTokenByMemberId(m.memberId);
  return token ? store.getCustomerByToken(token) : null;
}

/** Where the accepted members' answers differ, biggest gaps first. Text answers are shown side by side. */
async function compare(team) {
  const q = quests.get(team.questKey);
  const people = [];
  for (const m of team.members.filter((x) => x.status === 'accepted')) {
    const r = await recordFor(m);
    const saved = r && r.quests ? r.quests[team.questKey] : null;
    people.push({ label: m.label || displayName(r), answers: (saved && saved.answers) || {}, status: saved ? saved.status : 'not started' });
  }
  const show = (n, v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 'Yes' : 'Not yet') : Array.isArray(v) ? v.join(', ') || 'None yet' : String(v));
  const nodes = [...q.nodes, q.closing].map((n) => {
    const raw = people.map((p) => p.answers[n.id]);
    const given = raw.filter((v) => v !== undefined && v !== '');
    let spread = 0;
    let differ = false;
    if (n.type === 'scale' && given.length > 1) { spread = Math.max(...given) - Math.min(...given); differ = spread >= 2; }
    else if (n.type === 'check' && given.length > 1) differ = new Set(given).size > 1;
    else if (n.type === 'choose' && given.length > 1) differ = new Set(given.map((v) => [...v].sort().join('|'))).size > 1;
    return { id: n.id, section: n.section || '', prompt: n.prompt, type: n.type, spread, differ, answers: people.map((p, i) => ({ label: p.label, value: show(n, raw[i]) })) };
  });
  return {
    quest: { key: q.key, title: q.title },
    people: people.map((p) => ({ label: p.label, status: p.status, answered: Object.keys(p.answers).length })),
    differences: nodes.filter((n) => n.differ).sort((a, b) => b.spread - a.spread),
    nodes,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const rec = await store.getCustomerByToken(token);
  if (!rec || !rec.memberId) return json(401, { error: 'Invalid or expired access link.' });
  const qs = event.queryStringParameters || {};
  const all = await store.opsList(COLLECTION);
  const mine = all.filter((t) => myRole(t, rec) && ['invited', 'accepted'].includes(myRole(t, rec).status));

  if (event.httpMethod === 'GET') {
    if (qs.team) {
      const t = all.find((x) => x.id === qs.team);
      const me = t && myRole(t, rec);
      if (!t || !me || me.status !== 'accepted') return json(404, { error: 'Team not found.' });
      return json(200, { team: view(t, rec), comparison: await compare(t) }, { 'Cache-Control': 'private, no-store' });
    }
    const list = mine.filter((t) => !qs.key || t.questKey === qs.key).map((t) => view(t, rec));
    return json(200, { teams: list }, { 'Cache-Control': 'private, no-store' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const action = String(body.action || '');
  const now = new Date().toISOString();

  if (action === 'create') {
    const q = quests.get(String(body.questKey || ''));
    if (!q) return json(400, { error: 'Unknown quest.' });
    if (all.filter((t) => t.leadMemberId === rec.memberId).length >= MAX_TEAMS) return json(429, { error: `You can lead up to ${MAX_TEAMS} teams.` });
    const team = {
      id: crypto.randomBytes(8).toString('hex'),
      questKey: q.key,
      name: clean(body.name, 80) || `${q.title} team`,
      leadMemberId: rec.memberId,
      leadName: displayName(rec),
      createdAt: now,
      members: [{ mid: newMid(), memberId: rec.memberId, email: String(rec.email || '').toLowerCase(), label: displayName(rec), status: 'accepted', invitedAt: now, acceptedAt: now }],
    };
    await store.opsPut(COLLECTION, team.id, team);
    return json(201, { team: view(team, rec) });
  }

  const team = all.find((t) => t.id === String(body.teamId || ''));
  if (!team) return json(404, { error: 'Team not found.' });
  const me = myRole(team, rec);

  if (!me || !['invited', 'accepted'].includes(me.status)) return json(404, { error: 'Team not found.' });

  if (action === 'invite') {
    if (team.leadMemberId !== rec.memberId) return json(403, { error: 'Only the person who started the team can invite.' });
    const email = clean(body.email, 120).toLowerCase();
    if (!emailOk(email)) return json(400, { error: 'That email does not look right.' });
    if (team.members.some((m) => m.email === email && ['invited', 'accepted'].includes(m.status))) return json(409, { error: 'Already on the team.' });
    if (team.members.filter((m) => ['invited', 'accepted'].includes(m.status)).length >= MAX_MEMBERS) return json(400, { error: `A team holds up to ${MAX_MEMBERS} people.` });
    const today = now.slice(0, 10);
    const day = rec.teamInviteDay && rec.teamInviteDay.date === today ? rec.teamInviteDay : { date: today, count: 0 };
    if (day.count >= 20) return json(429, { error: 'That is enough invitations for today.' });
    rec.teamInviteDay = { date: today, count: day.count + 1 };
    await store.saveCustomer(rec);
    team.members = team.members.filter((m) => m.email !== email);
    team.members.push({ mid: newMid(), memberId: null, email, label: null, status: 'invited', invitedAt: now });
    await store.opsPut(COLLECTION, team.id, team);
    const q = quests.get(team.questKey);
    const url = `${SITE}/pages/quest.html?key=${encodeURIComponent(team.questKey)}#team`;
    try {
      await sendMail({
        to: email,
        subject: `${team.leadName} invited you to work ${q.title} as a team`,
        text: `${team.leadName} invited you to work ${q.title} with their team on The Co.LLab™.\n\nEach person answers on their own; once you accept, your answers are shared with this team only, so you can see where you agree and where you differ. You can leave at any time.\n\nSign in (or join free) with this email address, then accept here:\n${url}\n\nIf you were not expecting this, ignore it: nothing is shared unless you accept.`,
        html: `<p>${team.leadName.replace(/</g, '&lt;')} invited you to work <strong>${q.title}</strong> with their team on The Co.LLab™.</p><p>Each person answers on their own; once you accept, your answers are shared with this team only, so you can see where you agree and where you differ. You can leave at any time.</p><p><a href="${url}">Sign in (or join free) with this email address, then accept</a></p><p style="font-size:13px;color:#6b7a70;">If you were not expecting this, ignore it: nothing is shared unless you accept.</p>`,
      });
    } catch (err) { console.error('Team invite email failed:', err.message); }
    return json(200, { team: view(team, rec) });
  }

  if (action === 'accept' || action === 'decline') {
    if (me.status !== 'invited') return json(400, { error: 'There is no invitation to answer.' });
    me.status = action === 'accept' ? 'accepted' : 'declined';
    me.memberId = rec.memberId;
    me.label = displayName(rec);
    if (action === 'accept') me.acceptedAt = now;
    await store.opsPut(COLLECTION, team.id, team);
    return json(200, { team: view(team, rec) });
  }
  if (action === 'leave') {
    if (team.leadMemberId === rec.memberId) {
      await store.opsDelete(COLLECTION, team.id); // the lead leaving closes the team for everyone
      return json(200, { closed: true });
    }
    me.status = 'left';
    me.leftAt = now;
    await store.opsPut(COLLECTION, team.id, team);
    return json(200, { left: true });
  }
  if (action === 'remove') {
    if (team.leadMemberId !== rec.memberId) return json(403, { error: 'Only the person who started the team can remove people.' });
    const target = team.members.find((m) => m.mid === String(body.memberRef || '') && m.memberId !== rec.memberId && ['invited', 'accepted'].includes(m.status));
    if (!target) return json(404, { error: 'Not on the team.' });
    target.status = 'removed';
    await store.opsPut(COLLECTION, team.id, team);
    return json(200, { team: view(team, rec) });
  }
  return json(400, { error: 'Unknown action.' });
};
