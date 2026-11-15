// Netlify event function: runs automatically after every successful deploy.
// Keeps Founders Organization Payment Links paying like Partnerships (card or ACH):
// same idempotent steps as admin-founders-ach, no owner token needed.
const pricing = require('./lib/pricing');
const { enableAch, addWebhookEvents, applyAch, foundersLinks } = require('./admin-founders-ach');

async function run(stripe) {
  const ach = await enableAch(stripe);
  const webhook = await addWebhookEvents(stripe);
  const links = await applyAch(stripe, foundersLinks(pricing.registry));
  return { ach, webhook, links };
}

exports.run = run;

exports.handler = async () => {
  if (!process.env.STRIPE_SECRET_KEY) return { statusCode: 200, body: 'skipped: no STRIPE_SECRET_KEY' };
  try {
    const { getStripe } = require('./lib/stripe-client');
    const result = await run(getStripe());
    console.log('founders payment links', JSON.stringify(result));
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err) {
    console.error('deploy-succeeded founders links', err.message);
    return { statusCode: 200, body: `error: ${err.message}` };
  }
};
