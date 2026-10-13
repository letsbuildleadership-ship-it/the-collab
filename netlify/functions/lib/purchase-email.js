// Purchase confirmation email: one per completed Checkout Session, sent by
// the Stripe webhook after fulfillment. Content is built from what the
// session actually granted (the customer record), so it covers every kind
// of purchase: one-time products, Blueprint™ issues, memberships, Founders
// tiers, and Partnerships.
const pricing = require('./pricing');
const store = require('./store');
const { sendMail } = require('./mailer');

const SITE = (process.env.URL || 'https://wearethellab.netlify.app').replace(/\/$/, '');
const CONTACT = 'letsbuildleadership@gmail.com';

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function money(amount, currency) {
  if (amount == null) return null;
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: (currency || 'usd').toUpperCase() }).format(amount / 100);
  } catch (e) {
    return `$${(amount / 100).toFixed(2)}`;
  }
}

function longDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

/** Keys bought in this session, in purchase order (not bonus or included grants). */
function purchasedKeys(record, sessionId) {
  const keys = (record.purchases || []).filter((p) => p.sessionId === sessionId).map((p) => p.key);
  return Array.from(new Set(keys));
}

/**
 * Builds the message. Returns null when the session bought nothing this
 * site sells (e.g. a price on the same Stripe account for another product).
 */
function buildPurchaseEmail(record, session) {
  const keys = purchasedKeys(record, session.id);
  if (!keys.length) return null;
  const entries = keys.map((k) => pricing.entryForKey(k)).filter(Boolean);
  if (!entries.length) return null;

  const firstName = record.name ? String(record.name).trim().split(/\s+/)[0] : null;
  const total = money(session.amount_total, session.currency);
  const partnershipEntry = entries.find((e) => e.kind === 'partnership');
  const isFounder = entries.some((e) => pricing.founderRankForKey(e.key));
  const accountUrl = `${SITE}/pages/account.html?token=${encodeURIComponent(record.token)}`;

  const subject = partnershipEntry
    ? `Welcome, Partner. Your ${partnershipEntry.tier_label || 'Co.LLab™'} Partnership is active`
    : isFounder
      ? 'Welcome to the Founders Organization. Your purchase is confirmed'
      : 'Your Co.LLab™ purchase is confirmed';

  // "What happens next" — one block per kind of purchase in this session.
  const sections = [];
  for (const e of entries) {
    if (e.kind === 'partnership') {
      const p = record.partnership || {};
      const lines = [
        `Your products are in your account to keep: ${e.grant_scope === 'complete' ? 'the complete designated Co.LLab™ IP portfolio' : 'every product included in your tier'}.`,
        `Every membership is active through ${p.expiresAt ? longDate(p.expiresAt) : 'the end of your 12-month term'}: .LLab Membership™, the Library Card™ and The Legacy Library™, and The .LLab Journal™.`,
      ];
      if ((e.seats || 1) > 1) lines.push(`Your Partnership includes ${e.seats} individual seats, including yours. Invite your team from the Partnership panel in your account; each invite link works once and expires after 14 days.`);
      if (e.engagement && e.engagement.label) lines.push(`Included session: ${e.engagement.label}. We'll be in touch to schedule it.`);
      lines.push('About 30 days before your term ends, your account will show your options to continue any membership at its regular price.');
      sections.push({ title: e.tier_label ? `${e.tier_label} Partnership` : e.name, lines });
    } else if (e.kind === 'membership') {
      sections.push({
        title: e.name,
        lines: [
          'Your membership is active now. Sign in any time to use everything it includes.',
          'It renews automatically on the plan you chose. To change or cancel, reply to this email.',
        ],
      });
    } else {
      const founderLabel = pricing.founderRankForKey(e.key) ? pricing.founderLevelLabelForKey(e.key) : null;
      const lines = ['Ready in your library now. Sign in to download it any time.'];
      if (founderLabel && record.founder) {
        lines.push(`You're recognized as a ${founderLabel}${record.founder.founderNumber ? `, Founder Number ${record.founder.founderNumber}` : ''}.`);
      }
      sections.push({ title: e.name, lines });
    }
  }

  const signInLines = record.passwordHash
    ? [`Sign in with your Member ID (${record.memberId}) and password, or use the button below.`]
    : [
        `Your Member ID is ${record.memberId}. The button below opens your account; create a password there so you can sign in from any device.`,
      ];

  // Plain-text version.
  const text = [
    `${firstName ? `Hi ${firstName},` : 'Hello,'}`,
    '',
    'Thank you. Your purchase is confirmed and your access is ready.',
    '',
    'WHAT YOU PURCHASED',
    ...entries.map((e) => `- ${e.name}`),
    total ? `Total: ${total}` : null,
    `Member ID: ${record.memberId}`,
    '',
    ...sections.flatMap((s) => [s.title.toUpperCase(), ...s.lines.map((l) => `- ${l}`), '']),
    'YOUR ACCOUNT',
    ...signInLines,
    accountUrl,
    'This link signs you in. Keep it private and do not forward it.',
    '',
    `Your products are licensed for your internal use under the Co.LLab™ IP License: ${SITE}/pages/ip-license.html`,
    `Questions? Reply to this email or write to ${CONTACT}.`,
    '',
    'The Co.LLab™ Building Leadership Infrastructure™',
  ].filter((l) => l !== null).join('\n');

  // HTML version (inline styles; email clients ignore stylesheets).
  const C = { ink: '#17301d', soft: '#3b4a40', accent: '#e03a12', line: '#eadfd3', bg: '#fdf6ec' };
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${C.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid ${C.line};font-family:Arial,Helvetica,sans-serif;color:${C.ink};">
<tr><td style="background:#0f1d13;padding:22px 32px;border-bottom:4px solid #ff602e;">
<span style="font-size:20px;color:#fdf6ec;font-weight:bold;">The Co.LLab™</span>
</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 6px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.accent};font-weight:bold;">Purchase confirmed</p>
<h1 style="margin:0 0 18px;font-size:26px;line-height:1.25;font-weight:normal;color:${C.ink};">${firstName ? `Thank you, ${esc(firstName)}.` : 'Thank you.'} Your access is ready.</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.line};border-bottom:1px solid ${C.line};margin:0 0 24px;">
${entries.map((e) => `<tr><td style="padding:10px 0;font-size:15px;color:${C.ink};">${esc(e.name)}</td></tr>`).join('')}
${total ? `<tr><td style="padding:10px 0;border-top:1px solid ${C.line};font-size:15px;color:${C.ink};"><strong>Total: ${esc(total)}</strong></td></tr>` : ''}
<tr><td style="padding:10px 0;border-top:1px solid ${C.line};font-size:14px;color:${C.soft};">Member ID: <strong style="color:${C.ink};">${esc(record.memberId)}</strong></td></tr>
</table>
${sections.map((s) => `<h2 style="margin:0 0 8px;font-size:16px;color:${C.ink};">${esc(s.title)}</h2>
<ul style="margin:0 0 22px;padding-left:20px;color:${C.soft};font-size:14px;line-height:1.6;">${s.lines.map((l) => `<li style="margin:0 0 6px;">${esc(l)}</li>`).join('')}</ul>`).join('')}
<h2 style="margin:0 0 8px;font-size:16px;color:${C.ink};">Your account</h2>
${signInLines.map((l) => `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${C.soft};">${esc(l)}</p>`).join('')}
<p style="margin:0 0 8px;"><a href="${esc(accountUrl)}" style="display:inline-block;background:#ff602e;color:#0f1d13;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;text-transform:uppercase;padding:13px 24px;border-radius:999px;">Open your account</a></p>
<p style="margin:0 0 24px;font-size:12px;color:#6b7a70;">This button signs you in. Keep this email private and do not forward it.</p>
<p style="margin:0;font-size:12px;line-height:1.6;color:#6b7a70;">Your products are licensed for your internal use under the <a href="${SITE}/pages/ip-license.html" style="color:${C.accent};">Co.LLab™ IP License</a>. Questions? Reply to this email or write to <a href="mailto:${CONTACT}" style="color:${C.accent};">${CONTACT}</a>.</p>
</td></tr>
<tr><td style="padding:16px 32px;border-top:1px solid ${C.line};font-size:12px;color:#6b7a70;">The Co.LLab™ Building Leadership Infrastructure™</td></tr>
</table></td></tr></table></body></html>`;

  return { to: record.email, subject, text, html, replyTo: CONTACT };
}

/**
 * Sends the confirmation for this session once. A marker is written after a
 * successful send, so Stripe's webhook retries never email twice. Errors are
 * logged, never thrown: email must not block fulfillment.
 */
async function sendPurchaseConfirmation(result, session) {
  try {
    if (!result || !result.record || !session || !session.id) return { sent: false };
    if (await store.hasSentPurchaseEmail(session.id)) return { sent: false, duplicate: true };
    const message = buildPurchaseEmail(result.record, session);
    if (!message) return { sent: false };
    const outcome = await sendMail(message);
    if (outcome.sent) await store.markPurchaseEmailSent(session.id, { to: message.to, subject: message.subject });
    return outcome;
  } catch (err) {
    console.error(`Purchase confirmation email failed for ${session && session.id}`, err);
    return { sent: false, error: err.message };
  }
}

module.exports = { buildPurchaseEmail, sendPurchaseConfirmation };
