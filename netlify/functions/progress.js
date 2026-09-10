// Toggles one step of a product's on-console "mission" checklist for the
// signed-in member. Missions are display/engagement only — they never
// gate downloads or entitlements (download.js is untouched) — so this is
// low-stakes state, but it's still per-account and auth-gated like
// everything else that touches a customer record.
const store = require('./lib/store');
const { tokenFromEvent, json } = require('./lib/http');

const STEPS_PER_ITEM = 3;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });

  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid request body.' });
  }

  const itemKey = typeof body.itemKey === 'string' ? body.itemKey.trim() : '';
  const stepIndex = Number.isInteger(body.stepIndex) ? body.stepIndex : -1;
  const done = !!body.done;

  if (!itemKey || stepIndex < 0 || stepIndex >= STEPS_PER_ITEM) {
    return json(400, { error: 'Invalid itemKey or stepIndex.' });
  }

  record.activityProgress = record.activityProgress || {};
  const current = new Set(record.activityProgress[itemKey] || []);
  if (done) current.add(stepIndex);
  else current.delete(stepIndex);
  record.activityProgress[itemKey] = Array.from(current).sort((a, b) => a - b);

  await store.saveCustomer(record);

  return json(200, { itemKey, steps: record.activityProgress[itemKey] });
};
