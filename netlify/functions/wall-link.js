// Signed-in members who have purchased set (or remove) the website their name
// links to on the Legacy Walls. POST { url } — an empty url removes the link.
const store = require('./lib/store');
const { tokenFromEvent, json } = require('./lib/http');
const { canLinkOnWall, cleanWallUrl } = require('./lib/wall-link');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Sign in first.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Sign in first.' });
  if (!canLinkOnWall(record)) return json(403, { error: 'Linking your website on the Legacy Wall comes with any purchase.' });
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Bad request.' });
  }
  const url = cleanWallUrl(body.url);
  if (url && url.error) return json(400, { error: url.error });
  record.wallUrl = url;
  await store.saveCustomer(record);
  return json(200, { ok: true, url });
};
