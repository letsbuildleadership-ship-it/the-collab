// Synchronous fallback fulfillment: called by the browser immediately after
// a Stripe Checkout redirect (Payment Links are configured to bounce back
// to /pages/account.html?session_id=...). Stripe's webhook
// (stripe-webhook.js) is the real source of truth and usually wins the
// race, but webhooks can lag by a few seconds — this lets a customer land
// on their account with access already granted instead of staring at a
// spinner. Calling fulfillCheckoutSession twice for the same session is
// safe: it's idempotent.
const { getStripe } = require('./lib/stripe-client');
const { fulfillCheckoutSession } = require('./lib/fulfill');
const { json, setTokenCookie } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const sessionId = (event.queryStringParameters || {}).session_id;
  if (!sessionId || !sessionId.startsWith('cs_')) {
    return json(400, { error: 'Missing or invalid session_id' });
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price'],
    });

    if (session.payment_status !== 'paid') {
      return json(202, { ok: false, status: session.payment_status, message: 'Payment not yet confirmed.' });
    }

    const priceIds = (session.line_items?.data || []).map((li) => li.price && li.price.id).filter(Boolean);
    const result = await fulfillCheckoutSession(session, priceIds);

    if (!result) {
      return json(400, { error: 'No customer email on this checkout session.' });
    }

    return json(
      200,
      { ok: true, token: result.token, email: result.record.email, grantedKeys: result.grantedKeys },
      { 'Set-Cookie': setTokenCookie(result.token) }
    );
  } catch (err) {
    console.error('verify-session error', err);
    return json(500, { error: 'Could not verify checkout session.' });
  }
};
