const Stripe = require('stripe');

let client = null;

/** Lazily construct the Stripe client so functions that don't need it (or
 * run in a test harness without the env var set) don't crash at require time. */
function getStripe() {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    client = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return client;
}

module.exports = { getStripe };
