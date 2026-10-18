// Secret-free configuration check for the owner. Reveals only whether each
// environment variable is *set* — never its value. Anonymous callers learn
// only whether ADMIN_TOKEN exists (so the admin page can prompt setup); the
// Stripe/setup details require the admin token.
const { json } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const expected = process.env.ADMIN_TOKEN;
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  if (!expected || header !== expected) return json(200, { adminTokenConfigured: !!expected });

  return json(200, {
    adminTokenConfigured: true,
    devSetupSecretConfigured: !!process.env.DEV_SETUP_SECRET,
    stripeLiveKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeTestKeyConfigured: !!process.env.STRIPE_SECRET_KEY_TEST,
  });
};
