// Give any amount, today: opens a Stripe Checkout for the amount the giver
// chose on pages/founders.html, with an inline price (no Payment Link
// needed). Every giver becomes a Founder; fulfill.js reads the key from the
// session metadata, the Omnidirectional Enterprise(TM) area they directed it
// to, and the name they want on the Legacy Wall (a person or a company).
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json, tokenFromEvent } = require('./lib/http');

const KEY = 'founder-give';
const MIN = 20;
const MAX = 999999;

function getStripe() {
  return require('./lib/stripe-client').getStripe();
}

function slug(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Pure validation, unit-testable: whole or cents dollar amount within limits, known area or none. */
function parseGift(params) {
  const amount = Math.round(Number(String((params && params.amount) || '').replace(/[$,\s]/g, '')) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN || amount > MAX) return { error: `Choose an amount from $${MIN} to $${MAX.toLocaleString('en-US')}.` };
  const direct = params && params.direct ? slug(params.direct) : '';
  const node = pricing.designationNodes().find((n) => slug(n) === direct) || null;
  return { amount, cents: Math.round(amount * 100), direct: node ? slug(node) : '', node, level: pricing.founderLevelForAmount(amount) };
}

exports.parseGift = parseGift;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let params = event.queryStringParameters || {};
  if (event.httpMethod === 'POST' && event.body) params = Object.fromEntries(new URLSearchParams(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body));
  const gift = parseGift(params);
  if (gift.error) return json(400, { error: gift.error });
  if (!process.env.STRIPE_SECRET_KEY) return json(500, { error: 'STRIPE_SECRET_KEY is not configured.' });

  const entry = pricing.entryForKey(KEY);
  const token = tokenFromEvent(event);
  const record = token ? await store.getCustomerByToken(token) : null;
  const host = (event.headers && (event.headers.host || event.headers.Host)) || 'wearethellab.com';
  const origin = `https://${host}`;

  try {
    const sessionParams = {
      mode: 'payment',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: gift.cents,
          product_data: { name: entry.name, description: gift.node ? `Directed to ${gift.node} · Omnidirectional Enterprise™` : 'Omnidirectional Enterprise™', metadata: { collab_key: KEY } },
        },
      }],
      custom_fields: [{ key: 'wall_name', label: { type: 'custom', custom: 'Name for the Legacy Wall (you or your company)' }, type: 'text', optional: true, text: { maximum_length: 80 } }],
      success_url: `${origin}/pages/account.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pages/founders.html#give`,
      metadata: { purpose: 'founder_give', key: KEY, direct_to: gift.direct, level: gift.level || '' },
    };
    if (record && record.stripeCustomerId) sessionParams.customer = record.stripeCustomerId;
    else if (record) sessionParams.customer_email = record.email;
    else sessionParams.customer_creation = 'always';
    const session = await getStripe().checkout.sessions.create(sessionParams);
    return { statusCode: 303, headers: { Location: session.url }, body: '' };
  } catch (err) {
    console.error('give error', err);
    return json(500, { error: 'Could not start checkout. Please try again.' });
  }
};
