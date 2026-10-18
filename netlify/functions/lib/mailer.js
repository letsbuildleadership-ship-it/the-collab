// Outbound email over SMTP. Works with Gmail (an app password on the
// sending account) or any SMTP provider, configured entirely by Netlify
// environment variables:
//
//   SMTP_USER   sending account, e.g. letsbuildleadership@gmail.com
//   SMTP_PASS   its app password (Gmail: Google Account -> Security -> App passwords)
//   SMTP_HOST   optional, default smtp.gmail.com
//   SMTP_PORT   optional, default 465 (implicit TLS); 587 uses STARTTLS
//   EMAIL_FROM  optional display sender, default "The Co.LLab™ <SMTP_USER>"
//
// Until SMTP_USER and SMTP_PASS are set, sendMail() logs and skips, so
// purchases keep fulfilling normally without email configured.
const nodemailer = require('nodemailer');

let transport = null;
let testTransport = null; // tests inject a stand-in via _setTransportForTests

// Two ways to send. If MAIL_WEBHOOK_URL and MAIL_WEBHOOK_SECRET are set, mail goes through the
// owner's Google Apps Script web app (templates in Google Docs, log in Google Sheets; see
// docs/google-apps-script/). Otherwise it falls back to SMTP.
function webhookConfigured() {
  return Boolean(process.env.MAIL_WEBHOOK_URL && process.env.MAIL_WEBHOOK_SECRET);
}

function isConfigured() {
  return Boolean(testTransport || webhookConfigured() || (process.env.SMTP_USER && process.env.SMTP_PASS));
}

async function sendViaWebhook(msg) {
  const res = await fetch(process.env.MAIL_WEBHOOK_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      secret: process.env.MAIL_WEBHOOK_SECRET,
      template: msg.template || null,
      vars: msg.vars || {},
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
      replyTo: msg.replyTo || null,
    }),
  });
  let data = null;
  try { data = await res.json(); } catch (e) { /* non-JSON reply */ }
  if (!res.ok || !data || data.ok !== true) throw new Error(`Mail relay failed: ${(data && data.error) || res.status}`);
  return { sent: true };
}

function getTransport() {
  if (testTransport) return testTransport;
  if (!transport) {
    const port = Number(process.env.SMTP_PORT || 465);
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transport;
}

function fromAddress() {
  if (process.env.EMAIL_FROM) return process.env.EMAIL_FROM;
  return `"The Co.LLab™" <${process.env.SMTP_USER || 'letsbuildleadership@gmail.com'}>`;
}

/**
 * @param {{ to: string, subject: string, html: string, text: string, replyTo?: string }} msg
 * @returns {Promise<{ sent: boolean, skipped?: boolean }>}
 */
async function sendMail(msg) {
  if (!isConfigured()) {
    console.log(`Email not configured (MAIL_WEBHOOK_URL or SMTP_USER/SMTP_PASS); skipped "${msg.subject}" to ${msg.to}`);
    return { sent: false, skipped: true };
  }
  if (!testTransport && webhookConfigured()) return sendViaWebhook(msg);
  const { template, vars, ...smtpMsg } = msg;
  await getTransport().sendMail({ from: fromAddress(), ...smtpMsg });
  return { sent: true };
}

function _setTransportForTests(t) {
  testTransport = t;
}

module.exports = { sendMail, isConfigured, _setTransportForTests };
