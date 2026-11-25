const { ownerLink } = require('./lib/owner-link');
// Weekly IP progress report (scheduled in netlify.toml). Nothing waits for approval: routine
// improvements are approved and queued automatically and closed once implemented and verified
// (lib/ip-autopilot.js). The email reports what was done this week, what is in progress, any
// genuine founder decision (legal, financial, security or material business), and patterns
// in member activity. It is not sent when there is nothing to report.
const { sendMail } = require('./lib/mailer');
const { load } = require('./admin-ip');
const { analyze } = require('./admin-ip-analysis');

const WEEK = 7 * 24 * 60 * 60 * 1000;

exports.handler = async () => {
  const data = await load();
  const analysis = await analyze();
  const since = Date.now() - WEEK;
  const doneThisWeek = data.trail.filter((t) => t.to === 'done' && new Date(t.at).getTime() >= since);
  const inProgress = [...data.backlog.filter((b) => b.status === 'planned'), ...data.feedback.filter((f) => f.status === 'planned'), ...analysis.recommendations.filter((r) => r.status === 'planned')];
  const decisions = data.founderDecisions;
  const patterns = data.insights.suggestions;
  if (!doneThisWeek.length && !inProgress.length && !decisions.length && !patterns.length) return { statusCode: 200, body: 'nothing to send' };

  const lines = [];
  if (decisions.length) lines.push(`Needs your decision (${decisions.length}):`, ...decisions.map((d) => `- ${d.title}: ${d.founderDecision}`), '');
  if (doneThisWeek.length) lines.push(`Implemented and verified this week (${doneThisWeek.length}):`, ...doneThisWeek.slice(0, 15).map((t) => `- ${t.id}: ${String(t.note || '').slice(0, 160)}`), '');
  if (inProgress.length) lines.push(`In progress, approved automatically (${inProgress.length}):`, ...inProgress.slice(0, 10).map((i) => `- ${i.title || i.questTitle || `${i.ip}: ${String(i.text).slice(0, 120)}`}`), '');
  if (patterns.length) lines.push('Patterns in member activity:', ...patterns.slice(0, 6).map((s) => `- ${s.text}`), '');
  lines.push(`Full review and audit trail: ${ownerLink('ip-feedback.html')}`, `IP analysis: ${ownerLink('ip-analysis.html')}`, 'You can override any item there; nothing else needs your approval.');

  const to = process.env.OWNER_EMAIL || process.env.SMTP_USER || 'letsbuildleadership@gmail.com';
  const text = lines.join('\n');
  const subject = decisions.length
    ? `IP progress: ${decisions.length} founder decision${decisions.length === 1 ? '' : 's'} needed`
    : `IP progress: ${doneThisWeek.length} done this week, ${inProgress.length} in progress`;
  try {
    await sendMail({ to, subject, text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/</g, '&lt;').replace(/https:\/\/[^\s<]+/g, (u) => `<a href="${u}">${u}</a>`)}</pre>` });
  } catch (err) {
    console.error('IP digest email failed:', err.message);
  }
  return { statusCode: 200, body: 'sent' };
};
