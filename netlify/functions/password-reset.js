// "Forgot password?" for members.
//   POST { action: 'request', email }           -> emails a 1-hour reset link
//        (same response whether or not the account exists)
//   POST { action: 'complete', code, password } -> sets the new password and
//        signs the browser in
const store = require('./lib/store');
const { hashPassword } = require('./lib/password');
const { sendMail } = require('./lib/mailer');
const { createResetLink, tokenForResetCode } = require('./lib/password-reset');
const { json, setTokenCookie } = require('./lib/http');

const CONTACT = 'letsbuildleadership@gmail.com';

function resetEmail(record, url) {
  const text = [
    'Hello,',
    '',
    'We received a request to reset the password for your Co.LLab™ account.',
    `Your username is this email address${record.memberId ? ` (Member ID ${record.memberId})` : ''}.`,
    '',
    'Choose a new password here (the link works once, for 1 hour):',
    url,
    '',
    "If you didn't ask for this, you can ignore this email; your password won't change.",
    '',
    'The Co.LLab™',
  ].join('\n');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#17301d;max-width:560px;">
<p>Hello,</p>
<p>We received a request to reset the password for your Co.LLab™ account. Your username is this email address${record.memberId ? ` (Member ID <strong>${record.memberId}</strong>)` : ''}.</p>
<p><a href="${url}" style="display:inline-block;background:#ff602e;color:#0f1d13;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px;">Choose a new password</a></p>
<p style="font-size:13px;color:#6b7a70;">The link works once, for 1 hour. If you didn't ask for this, you can ignore this email; your password won't change.</p>
<p style="font-size:13px;color:#6b7a70;">The Co.LLab™</p></div>`;
  return { to: record.email, subject: 'Reset your Co.LLab™ password', text, html, replyTo: CONTACT, template: 'password-reset', vars: { url, memberId: record.memberId || '', contact: CONTACT } };
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  if (body.action === 'request') {
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    if (!email.includes('@')) return json(400, { error: 'Enter the email you purchased with.' });
    try {
      const token = await store.getTokenByEmail(email);
      const record = token ? await store.getCustomerByToken(token) : null;
      if (record) {
        const { url } = await createResetLink(record.token, 1);
        await sendMail(resetEmail(record, url));
      }
    } catch (err) {
      console.error('password reset request failed', err);
    }
    // Never reveal whether an account exists.
    return json(200, { ok: true });
  }

  if (body.action === 'complete') {
    const code = typeof body.code === 'string' ? body.code : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (password.length < 8) return json(400, { error: 'Password must be at least 8 characters.' });
    const token = await tokenForResetCode(code);
    const record = token ? await store.getCustomerByToken(token) : null;
    if (!record) return json(400, { error: 'This reset link has expired or was already used. Request a new one.' });
    record.passwordHash = hashPassword(password);
    await store.saveCustomer(record);
    await store.deleteResetCode(code);
    return json(200, { ok: true, memberId: record.memberId }, { 'Set-Cookie': setTokenCookie(record.token) });
  }

  return json(400, { error: 'Unknown action.' });
};
