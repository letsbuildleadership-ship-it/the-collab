// Daily (netlify.toml): emails each member a check-in that has come due on a quest
// commitment (30, 90 or 365 days after they made it), once, with a link to answer it in
// their portal. Members who never confirmed their email are not written to.
const store = require('./lib/store');
const { sendMail } = require('./lib/mailer');

const SITE = (process.env.URL || 'https://wearethellab.com').replace(/\/$/, '');
const MAX_PER_RUN = 200;

exports.handler = async () => {
  const customers = await store.listCustomers();
  const now = Date.now();
  let sent = 0;
  for (const r of customers) {
    if (sent >= MAX_PER_RUN) break;
    if (!r.email || r.emailVerified === false) continue;
    const due = [];
    Object.entries(r.commitments || {}).forEach(([key, c]) => (c.checkins || []).forEach((k) => {
      if (!k.reply && !k.emailedAt && new Date(k.dueAt).getTime() <= now) due.push({ key, c, k });
    }));
    if (!due.length) continue;
    const url = `${SITE}/pages/account.html#checkins`;
    const lines = due.map(({ c, k }) => `- ${k.day} days ago you committed to: "${c.text}"`);
    const text = [
      'Hello,',
      '',
      'A check-in on the commitment you made at the end of a quest:',
      ...lines,
      '',
      'What happened? Answer in one click in your Member Portal™ (kept, in progress, changed, or not yet):',
      url,
      '',
      'Your answer stays in your portal. The Co.LLab™ only sees anonymous counts of which quests help commitments stick.',
      '',
      'The Co.LLab™',
    ].join('\n');
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17301d;max-width:560px;"><p>Hello,</p><p>A check-in on the commitment you made at the end of a quest:</p><ul>${due.map(({ c, k }) => `<li>${k.day} days ago: “${String(c.text).replace(/</g, '&lt;')}”</li>`).join('')}</ul><p><a href="${url}" style="display:inline-block;background:#ff602e;color:#0f1d13;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;">Answer my check-in</a></p><p style="font-size:13px;color:#6b7a70;">Your answer stays in your portal. The Co.LLab™ only sees anonymous counts of which quests help commitments stick.</p></div>`;
    try {
      await sendMail({ to: r.email, subject: 'Your commitment check-in from The Co.LLab™', text, html, replyTo: 'support@wearethellab.com' });
      const at = new Date().toISOString();
      due.forEach(({ k }) => { k.emailedAt = at; });
      await store.saveCustomer(r);
      sent += 1;
    } catch (err) {
      console.error('Check-in reminder failed:', err.message);
    }
  }
  return { statusCode: 200, body: `sent ${sent}` };
};
