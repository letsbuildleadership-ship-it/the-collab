// Team mode for a quest. GET ?key (&team=id for an invitee) returns the team and the
// team view; POST { key, emails } invites colleagues (the member must have the quest).
// Invitees sign in with the invited email to answer; everyone on the team sees the
// team's answers to that quest, and the invitation says so.
const crypto = require('crypto');
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests } = require('./lib/quests');
const { resolveAccess } = require('./lib/access');
const membershipStatus = require('./lib/membership-status');
const freeToolKeys = new Set(require('../../content/free-tools.json').tools.map((t) => t.key));
const { sendMail } = require('./lib/mailer');
const { MAX_INVITES, COLLECTION, getTeam, isOnTeam, compare } = require('./lib/teams');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function canUseQuest(record, key) {
  const q = quests.get(key);
  if (!q) return false;
  if (q.open || freeToolKeys.has(key)) return true;
  const access = await resolveAccess(record);
  return new Set(membershipStatus.effectiveEntitlements(access)).has(key) || membershipStatus.catalogUnlockKeys(access).includes(key);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record || !record.memberId) return json(401, { error: 'Invalid or expired access link.' });

  let body = {};
  if (event.httpMethod === 'POST') {
    try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  }
  const src = event.httpMethod === 'GET' ? event.queryStringParameters || {} : body;
  const key = String(src.key || '');
  const quest = quests.get(key);
  if (!quest) return json(404, { error: 'Quest not found.' });

  const ownId = (record.teams || {})[key] || null;
  const team = src.team ? await getTeam(src.team) : ownId ? await getTeam(ownId) : null;

  if (event.httpMethod === 'GET') {
    if (team && team.key === key && isOnTeam(team, record)) {
      return json(200, { team: { id: team.id, owner: team.ownerMemberId === record.memberId, emails: team.ownerMemberId === record.memberId ? team.emails : undefined, max: MAX_INVITES }, view: await compare(team, quest, record) });
    }
    return json(200, { team: null, canInvite: await canUseQuest(record, key), max: MAX_INVITES });
  }

  if (!(await canUseQuest(record, key))) return json(403, { error: 'You need this quest in your portal to invite a team.' });
  const emails = [...new Set((Array.isArray(body.emails) ? body.emails : String(body.emails || '').split(/[\s,;]+/)).map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  if (!emails.length) return json(400, { error: 'Add at least one colleague’s email.' });
  if (emails.some((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || e.length > 120)) return json(400, { error: 'One of those emails does not look right.' });

  let mine = ownId ? await getTeam(ownId) : null;
  if (!mine) {
    mine = { id: crypto.randomBytes(8).toString('hex'), key, ownerMemberId: record.memberId, emails: [], createdAt: new Date().toISOString() };
    record.teams = { ...(record.teams || {}), [key]: mine.id };
    await store.saveCustomer(record);
  }
  const fresh = emails.filter((e) => e !== record.email && !mine.emails.includes(e));
  if (mine.emails.length + fresh.length > MAX_INVITES) return json(400, { error: `A team can have up to ${MAX_INVITES} colleagues on one quest.` });
  mine.emails = [...mine.emails, ...fresh];
  await store.opsPut(COLLECTION, mine.id, mine);

  const link = `https://wearethellab.com/pages/quest.html?key=${encodeURIComponent(key)}&team=${mine.id}`;
  const who = record.name || record.email;
  const lines = [
    `${who} has invited you to work through ${quest.title} with their leadership team.`,
    'Each leader answers on their own. The team view then shows everyone’s answers side by side, so you can see where you align and where you differ. Your answers to this quest are shared with the team.',
    `Begin here: ${link}`,
    'Sign in or create a free account with this email address to open it.',
    'The Co.LLab™',
  ];
  let failed = 0;
  for (const to of fresh) {
    try {
      await sendMail({ to, replyTo: record.email, subject: `${who} invited you to ${quest.title}`, text: lines.join('\n\n'), html: lines.map((l) => `<p>${esc(l).replace(/(https:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>`).join('') });
    } catch (err) {
      failed += 1;
      console.error('Team invite email failed:', err.message);
    }
  }
  return json(200, { team: { id: mine.id, owner: true, emails: mine.emails, max: MAX_INVITES }, invited: fresh.length - failed, failed });
};
