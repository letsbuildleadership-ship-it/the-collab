// Team mode: a member invites colleagues to work the same quest. Each leader answers on
// their own; the team view shows every answer side by side and marks where they differ.
const store = require('./store');

const MAX_INVITES = 8;
const COLLECTION = 'quest-teams';

async function getTeam(id) {
  if (!/^[a-f0-9]{16}$/.test(String(id || ''))) return null;
  return store.opsGet(COLLECTION, id);
}

/** True when this signed-in record may work the team's quest (owner or invited by email). */
function isOnTeam(team, record) {
  return !!(team && record && (team.ownerMemberId === record.memberId || team.emails.includes(String(record.email || '').toLowerCase())));
}

function nameOf(rec, viewer) {
  if (rec.memberId && viewer && rec.memberId === viewer.memberId) return 'You';
  return rec.name || String(rec.email || '').split('@')[0] || 'A colleague';
}

function differs(type, values) {
  if (values.length < 2) return false;
  if (type === 'scale') return Math.max(...values) - Math.min(...values) >= 2;
  if (type === 'check') return new Set(values).size > 1;
  if (type === 'choose') return new Set(values.map((v) => [...v].sort().join('|'))).size > 1;
  return true; // written answers are always worth reading side by side
}

/** The team view: each step with every member's answer, differences first. */
async function compare(team, quest, viewer) {
  const people = [];
  const ownerToken = await store.getTokenByMemberId(team.ownerMemberId);
  const owner = ownerToken && (await store.getCustomerByToken(ownerToken));
  if (owner) people.push(owner);
  for (const email of team.emails) {
    const t = await store.getTokenByEmail(email);
    const r = t && (await store.getCustomerByToken(t));
    if (r && !people.some((p) => p.token === r.token)) people.push(r);
  }
  const answered = people.filter((p) => p.quests && p.quests[quest.key] && p.quests[quest.key].answers);
  const steps = [...quest.nodes, quest.closing].map((n) => {
    const rows = answered.map((p) => ({ who: nameOf(p, viewer), value: p.quests[quest.key].answers[n.id] })).filter((r) => r.value !== undefined && r.value !== '');
    return { id: n.id, section: n.section || '', prompt: n.prompt, type: n.type, answers: rows, differs: differs(n.type, rows.map((r) => r.value)) };
  }).filter((s) => s.answers.length);
  return { invited: team.emails.length, answering: answered.length, steps, differences: steps.filter((s) => s.differs && s.type !== 'text').length };
}

module.exports = { MAX_INVITES, COLLECTION, getTeam, isOnTeam, compare };
