// Stripe webhook: the source of truth for fulfillment. Configured in the
// live Stripe account to receive checkout.session.completed,
// customer.subscription.updated/deleted, and invoice.payment_failed for
// every .LLab product, Membership, Library Card, Journal, and Founders
// tier. Runs independently of the pre-existing Blueprint (Google Apps
// Script) webhook on the same Stripe account — both fire on the same
// events without interfering with each other.
const { getStripe } = require('./lib/stripe-client');
const { fulfillCheckoutSession, revokeMembership, reactivateMembership } = require('./lib/fulfill');
const store = require('./lib/store');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const signature = event.headers['stripe-signature'] || event.headers['Stripe-Signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return { statusCode: 500, body: 'Webhook not configured' };
  }

  const rawBody = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body;

  let stripeEvent;
  try {
    const stripe = getStripe();
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  try {
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object;
        if (session.payment_status !== 'paid' && session.mode !== 'subscription') break;
        const stripe = getStripe();
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
        const priceIds = lineItems.data.map((li) => li.price && li.price.id).filter(Boolean);
        await fulfillCheckoutSession(session, priceIds);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = stripeEvent.data.object;
        const link = await store.getSubscriptionLink(subscription.id);
        if (link) await revokeMembership(link.token, link.membershipKey);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = stripeEvent.data.object;
        const link = await store.getSubscriptionLink(subscription.id);
        if (link) {
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await reactivateMembership(link.token, link.membershipKey);
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await revokeMembership(link.token, link.membershipKey);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        // Grace period: we don't revoke on the first failed payment — Stripe
        // will retry and, if it ultimately gives up, emits
        // customer.subscription.deleted (handled above), which does revoke.
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`Error handling ${stripeEvent.type}`, err);
    // Return 200 anyway for errors we can't recover from by retrying, to
    // avoid Stripe hammering the endpoint with the same bad event forever.
    // Genuine transient errors (Blobs hiccup, etc.) are rare enough that
    // logging + manual admin follow-up is an acceptable tradeoff here.
    return { statusCode: 200, body: JSON.stringify({ received: true, error: err.message }) };
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
