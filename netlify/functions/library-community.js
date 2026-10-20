// GET the Community Reflections other members have contributed for one
// month of The .LLab Legacy Library™ cycle. Members-only (must be signed in with
// an active Library Card) — this is the shared wall behind Community
// Mark™ contributions, keyed by Member ID rather than email.
const store = require('./lib/store');
const { tokenFromEvent, json } = require('./lib/http');
const membershipStatus = require('./lib/membership-status');
const { resolveAccess } = require('./lib/access');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  // Access view includes a Partnership seat; progress is still saved on `record`.
  const access = await resolveAccess(record);
  const libraryCard = access.memberships && access.memberships['library-card'];
  if (!membershipStatus.isMembershipActive(libraryCard)) {
    return json(403, { error: 'The .LLab Legacy Library™ is available with an active .LLab Library Card™.' });
  }

  const params = event.queryStringParameters || {};
  const monthOrder = Number(params.month);
  if (!Number.isInteger(monthOrder) || monthOrder < 1 || monthOrder > 12) {
    return json(400, { error: 'Invalid month.' });
  }

  const entries = await store.getCommunityReflections(monthOrder);
  const sorted = entries
    .slice()
    .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
    .slice(0, 100);

  return json(200, { monthOrder, entries: sorted });
};
