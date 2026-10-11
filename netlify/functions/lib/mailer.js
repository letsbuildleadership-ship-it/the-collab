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

function isConfigured() {
  return Boolean(testTransport || (process.env.SMTP_USER && process.env.SMTP_PASS));
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
    console.log(`Email not configured (SMTP_USER/SMTP_PASS); skipped "${msg.subject}" to ${msg.to}`);
    return { sent: false, skipped: true };
  }
  await getTransport().sendMail({ from: fromAddress(), ...msg });
  return { sent: true };
}

function _setTransportForTests(t) {
  testTransport = t;
}

module.exports = { sendMail, isConfigured, _setTransportForTests };
