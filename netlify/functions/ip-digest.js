// Weekly reminder (scheduled in netlify.toml) so nothing waits in the IP review
// without the owner deciding on it: lists what is still undecided and any
// usage insights, and links to the review page.
const { sendMail } = require('./lib/mailer');
const { load } = require('./admin-ip');
const { analyze } = require('./admin-ip-analysis');

exports.handler = async () => {
  const data = await load();
  const newBacklog = data.backlog.filter((b) => b.status === 'new');
  const newFeedback = data.feedback.filter((f) => f.status === 'new');
  const analysis = await analyze();
  const newRecs = analysis.recommendations.filter((r) => r.status === 'new');
  const total = newBacklog.length + newFeedback.length + newRecs.length;
  if (!total && !data.insights.suggestions.length) return { statusCode: 200, body: 'nothing to send' };

  const lines = [];
  if (newFeedback.length) lines.push(`Member feedback awaiting your decision (${newFeedback.length}):`, ...newFeedback.slice(0, 10).map((f) => `- ${f.questTitle}: ${[f.unclear, f.support, f.ecosystem].filter(Boolean)[0].slice(0, 140)}`), '');
  if (newBacklog.length) lines.push(`Improvement ideas awaiting your decision (${newBacklog.length}):`, ...newBacklog.slice(0, 10).map((b) => `- ${b.title} (${b.area})`), '');
  if (newRecs.length) lines.push(`IP analysis recommendations awaiting your decision (${newRecs.length}, ${newRecs.filter((r) => r.severity === 'high').length} high):`, ...newRecs.slice(0, 8).map((r) => `- [${r.severity}] ${r.ip}: ${r.text.slice(0, 150)}`), '', 'Full analysis: https://wearethellab.netlify.app/admin/ip-analysis.html', '');
  if (data.insights.suggestions.length) lines.push('Patterns in member activity:', ...data.insights.suggestions.slice(0, 6).map((s) => `- ${s.text}`), '');
  lines.push('Decide on them here: https://wearethellab.netlify.app/admin/ip-feedback.html', 'Every item stays in this email until you mark it considering, planned, done or declined.');

  const to = process.env.OWNER_EMAIL || process.env.SMTP_USER || 'letsbuildleadership@gmail.com';
  const text = lines.join('\n');
  try {
    await sendMail({ to, subject: `IP review: ${total} item${total === 1 ? '' : 's'} awaiting your decision`, text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>` });
  } catch (err) {
    console.error('IP digest email failed:', err.message);
  }
  return { statusCode: 200, body: 'sent' };
};
