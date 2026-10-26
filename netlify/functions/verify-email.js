// Confirms a free member's email. POST { code } finishes the confirmation from the emailed link;
// POST { action: 'resend' } (signed in) sends a fresh link, at most once every 5 minutes.
const store = require('./lib/store');
const { sendVerificationEmail, sendWelcomeEmail } = require('./lib/account-emails');
const { json, tokenFromEvent, setTokenCookie } = require('./lib/http');

const RESEND_MS = 5 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  if (body.action === 'resend') {
    const token = tokenFromEvent(event);
    const record = token ? await store.getCustomerByToken(token) : null;
    if (!record) return json(401, { error: 'Not signed in.' });
    if (record.emailVerified === true) return json(200, { ok: true, alreadyConfirmed: true });
    if (record.verifyEmailSentAt && Date.now() - Date.parse(record.verifyEmailSentAt) < RESEND_MS) {
      return json(429, { error: 'A link was just sent. Check your inbox, or wait a few minutes to send another.' });
    }
    record.verifyEmailSentAt = new Date().toISOString();
    await store.saveCustomer(record);
    try {
      await sendVerificationEmail(record);
    } catch (err) {
      console.error('verification email failed', err.message);
    }
    return json(200, { ok: true });
  }

  const code = typeof body.code === 'string' ? body.code : '';
  const info = code ? await store.getVerifyCode(code) : null;
  const valid = info && info.expiresAt && Date.parse(info.expiresAt) > Date.now();
  const record = valid ? await store.getCustomerByToken(info.token) : null;
  if (!record) return json(400, { error: 'This confirmation link has expired or was already used. Sign in and choose Resend.' });
  record.emailVerified = true;
  record.emailVerifiedAt = new Date().toISOString();
  await store.saveCustomer(record);
  await store.deleteVerifyCode(code);
  if (!record.welcomeSentAt) {
    try {
      await sendWelcomeEmail(record);
      record.welcomeSentAt = new Date().toISOString();
      await store.saveCustomer(record);
    } catch (err) {
      console.error('welcome email failed', err.message);
    }
  }
  return json(200, { ok: true, memberId: record.memberId }, { 'Set-Cookie': setTokenCookie(record.token) });
};
