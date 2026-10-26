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

// Welcome message, sent once after a free member confirms their email (they asked for the account,
// so this is a confirmed opt-in). Points to the free tools and the $20 first diagnostic.
async function sendWelcomeEmail(record) {
  const first = record.name ? String(record.name).split(' ')[0] : '';
  const tools = `${SITE}/pages/all-products.html`;
  const strength = 'https://buy.stripe.com/bJeeVcbf01JHaFRelg9ws0k';
  const text = [
    `Hello${first ? ` ${first}` : ''},`,
    '',
    'Welcome to The Co.LLab™. Your free account is ready.',
    '',
    'Every free leadership infrastructure tool is organized by phase, from Foundations to Preservation. Start with the Leadership Foundations Checklist; it shows where your foundation is strongest and where it is thin:',
    tools,
    '',
    'When you are ready for a first diagnostic, the Leadership Infrastructure Strength Map™ ($20) identifies one organizational strength and shows how to build infrastructure around it:',
    strength,
    '',
    `Questions? Reply to this email or write to ${CONTACT}.`,
    '',
    'Best,',
    'Ashley E. Clasby',
    'The Co.LLab™ | Building Leadership Infrastructure™',
  ].join('\n');
  const btn = 'display:inline-block;background:#ff602e;color:#0f1d13;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;';
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17301d;max-width:560px;"><p>Hello${first ? ` ${first}` : ''},</p><p>Welcome to The Co.LLab™. Your free account is ready.</p><p>Every free leadership infrastructure tool is organized by phase, from Foundations to Preservation. Start with the Leadership Foundations Checklist; it shows where your foundation is strongest and where it is thin.</p><p><a href="${tools}" style="${btn}">Open my free tools</a></p><p>When you are ready for a first diagnostic, the <a href="${strength}">Leadership Infrastructure Strength Map™ ($20)</a> identifies one organizational strength and shows how to build infrastructure around it.</p><p style="font-size:13px;color:#6b7a70;">Questions? Reply to this email or write to ${CONTACT}.</p><p>Best,<br>Ashley E. Clasby<br>The Co.LLab™ | Building Leadership Infrastructure™</p></div>`;
  return sendMail({ to: record.email, subject: 'Welcome to The Co.LLab™: your free leadership tools', text, html, replyTo: CONTACT, template: 'welcome', vars: { firstName: first, toolsUrl: tools, strengthMapUrl: strength, contact: CONTACT } });
}

module.exports = { sendVerificationEmail, sendWelcomeEmail };
