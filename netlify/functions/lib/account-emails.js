// Confirm-your-email message for free sign-ups. Sent through lib/mailer.js, so it uses the
// Google Apps Script relay (and its Google Doc template "verify-email") when configured.
const store = require('./store');
const { sendMail } = require('./mailer');

const SITE = (process.env.URL || 'https://wearethellab.com').replace(/\/$/, '');
const CONTACT = 'support@wearethellab.com';
const DAY = 24 * 60 * 60 * 1000;

async function sendVerificationEmail(record) {
  const code = store.randomToken();
  await store.saveVerifyCode(code, { token: record.token, expiresAt: new Date(Date.now() + DAY).toISOString() });
  const url = `${SITE}/pages/login.html?verify=${encodeURIComponent(code)}`;
  const first = record.name ? String(record.name).split(' ')[0] : '';
  const text = [
    `Hello${first ? ` ${first}` : ''},`,
    '',
    'Please confirm your email to finish setting up your free Co.LLab™ account:',
    url,
    '',
    'The link works once, for 24 hours. If you did not sign up, ignore this email.',
    '',
    'The Co.LLab™',
  ].join('\n');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17301d;max-width:560px;"><p>Hello${first ? ` ${first}` : ''},</p><p>Please confirm your email to finish setting up your free Co.LLab™ account.</p><p><a href="${url}" style="display:inline-block;background:#ff602e;color:#0f1d13;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;">Confirm my email</a></p><p style="font-size:13px;color:#6b7a70;">The link works once, for 24 hours. If you did not sign up, ignore this email.</p><p style="font-size:13px;color:#6b7a70;">The Co.LLab™</p></div>`;
  return sendMail({ to: record.email, subject: 'Confirm your email for The Co.LLab™', text, html, replyTo: CONTACT, template: 'verify-email', vars: { firstName: first, url, memberId: record.memberId || '', contact: CONTACT } });
}

module.exports = { sendVerificationEmail };
