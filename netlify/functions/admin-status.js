// Secret-free configuration check for the owner. Reveals only whether each
// environment variable is *set* — never its value. Anonymous callers learn
// only whether ADMIN_TOKEN exists (so the admin page can prompt setup); the
// Stripe/setup details require the admin token.
const { json } = require('./lib/http');
const { isAdmin } = require('./lib/admin-auth');

exports.handler = async (event) => {
  const isPost = event.httpMethod === 'POST';
  if (event.httpMethod !== 'GET' && !isPost) return json(405, { error: 'Method Not Allowed' });

  if (!isAdmin(event)) return json(200, { adminTokenConfigured: !!process.env.ADMIN_TOKEN });

  // Admin-only: send a test email to the sending account and report the real result.
  if (isPost) {
    const mailer = require('./lib/mailer');
    if (!mailer.isConfigured()) return json(200, { sent: false, error: 'No email settings found (SMTP_USER / SMTP_PASS).' });
    try {
      const to = process.env.SMTP_USER || 'letsbuildleadership@gmail.com';
      await mailer.sendMail({ to, subject: 'The Co.LLab™ email test', text: 'Email sending works.', html: '<p>Email sending works.</p>' });
      return json(200, { sent: true, to });
    } catch (err) {
      return json(200, { sent: false, error: String(err && err.message || err) });
    }
  }

  return json(200, {
    adminTokenConfigured: true,
    devSetupSecretConfigured: !!process.env.DEV_SETUP_SECRET,
    stripeLiveKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeTestKeyConfigured: !!process.env.STRIPE_SECRET_KEY_TEST,
  });
};
