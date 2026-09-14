// Public, unauthenticated: maps every live Stripe Payment Link on the site
// to its internal catalog key (+ interval, for subscriptions). Nothing
// sensitive — these payment_link URLs are already printed on every product
// page. Lets client-side code (js/main.js) recognize a "Buy" link it's
// looking at so it can route a signed-in Founder's purchase through the
// dynamic, discount-aware checkout (checkout-create.js) instead, without
// hardcoding or duplicating the pricing registry in the browser.
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  return json(200, pricing.paymentLinkMap(), { 'Cache-Control': 'public, max-age=300' });
};
