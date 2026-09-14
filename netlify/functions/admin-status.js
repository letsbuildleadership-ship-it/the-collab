// Public, secret-free configuration check for the owner. Reveals only
// whether each required environment variable is *set* — never its value —
// so the owner (or anyone helping them debug) can confirm admin access and
// Stripe wiring are configured without needing the secrets themselves.
// Safe to leave unauthenticated: knowing a variable exists doesn't help an
// attacker guess it.
const { json } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  return json(200, {
    adminTokenConfigured: !!process.env.ADMIN_TOKEN,
    devSetupSecretConfigured: !!process.env.DEV_SETUP_SECRET,
    stripeLiveKeyConfigured: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripeTestKeyConfigured: !!process.env.STRIPE_SECRET_KEY_TEST,
  });
};
