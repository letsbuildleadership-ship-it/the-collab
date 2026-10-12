// Claim a TRIARCH™ tier reward: POST { tier, key }. See lib/membership-rewards.js.
const store = require('./lib/store');
const { claimPick } = require('./lib/membership-rewards');
const { buildAccountView } = require('./lib/account-view');
const { resolveAccess } = require('./lib/access');
const { json, tokenFromEvent } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Not signed in.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  // Rewards are judged on the member's own access (a seat holder's included
  // membership counts, as it does everywhere else).
  const access = await resolveAccess(record);
  try {
    claimPick(access, body.tier, typeof body.key === 'string' ? body.key : '');
  } catch (err) {
    return json(400, { error: err.message });
  }
  record.membershipPicks = access.membershipPicks;
  record.entitlements = Array.from(new Set([...(record.entitlements || []), access.membershipPicks[Number(body.tier)].key]));
  await store.saveCustomer(record);
  return json(200, buildAccountView(await resolveAccess(record)));
};
