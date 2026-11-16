// Commitment check-ins: every finished quest ends with a commitment. At 30, 90 and 365
// days the member is asked what happened, and their reply is kept on that quest. Only
// the newest milestone due is sent (older missed ones are skipped, never sent late), at
// most one email per member per run, and a member can turn check-ins off.
const { quests } = require('./quests');

const MILESTONES = [30, 90, 365];
const DAY = 24 * 60 * 60 * 1000;
const STATUSES = ['yes', 'partly', 'not-yet'];
const SITE = 'https://wearethellab.com';
const LABEL = { 30: 'Thirty days', 90: 'Ninety days', 365: 'One year' };

function commitmentOf(key, saved) {
  const q = quests.get(key);
  const c = q && q.closing && saved && saved.answers ? saved.answers[q.closing.id] : null;
  return typeof c === 'string' && c.trim() ? c.trim() : null;
}

/** Which check-ins are due for this member now: [{ key, title, days, commitment }]. Marks skipped milestones. */
function dueFor(record, now = Date.now()) {
  if (!record || record.checkinsOff || !record.email) return [];
  const due = [];
  Object.entries(record.quests || {}).forEach(([key, v]) => {
    if (!v || v.status !== 'done' || !v.completedAt || !quests.has(key)) return;
    const commitment = commitmentOf(key, v);
    if (!commitment) return;
    const days = Math.floor((now - Date.parse(v.completedAt)) / DAY);
    const sent = v.checkins || {};
    const next = [...MILESTONES].reverse().find((d) => days >= d && !sent[d]);
    if (!next) return;
    v.checkins = { ...sent };
    MILESTONES.filter((d) => d < next && !v.checkins[d]).forEach((d) => { v.checkins[d] = { skipped: true }; });
    due.push({ key, title: quests.get(key).title, days: next, commitment });
  });
  return due;
}

function emailFor(record, due) {
  const lines = ['Every quest you finish ends with a commitment. Here is where you stood, and the one question that keeps the practice alive: what happened?', ''];
  due.forEach((d) => {
    lines.push(`${LABEL[d.days]} ago, in ${d.title}, you committed:`, `"${d.commitment}"`, `Tell us what happened: ${SITE}/pages/checkin.html?key=${encodeURIComponent(d.key)}&d=${d.days}`, '');
  });
  lines.push('Your reply stays in your portal with your quest report.', `Prefer not to receive check-ins? Turn them off here: ${SITE}/pages/checkin.html?off=1`, '', 'The Co.LLab™');
  const text = lines.join('\n');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const html = lines.map((l) => (!l ? '' : /^https?:|: https:/.test(l) ? `<p>${esc(l).replace(/(https:\/\/\S+)/g, '<a href="$1">$1</a>')}</p>` : `<p>${esc(l)}</p>`)).join('');
  const subject = due.length === 1 ? `${LABEL[due[0].days]} on: what happened with your commitment?` : 'Your commitment check-ins: what happened?';
  return { to: record.email, subject, text, html };
}

/** Anonymous totals for the owner: how many check-ins went out and how members answered. */
function summarize(customers) {
  const t = { sent: 0, replied: 0, yes: 0, partly: 0, 'not-yet': 0 };
  customers.forEach((c) => Object.values(c.quests || {}).forEach((v) => Object.values((v && v.checkins) || {}).forEach((ci) => {
    if (ci.sentAt) t.sent += 1;
    if (ci.status) { t.replied += 1; if (t[ci.status] !== undefined) t[ci.status] += 1; }
  })));
  return t;
}

module.exports = { MILESTONES, STATUSES, dueFor, emailFor, commitmentOf, summarize };
