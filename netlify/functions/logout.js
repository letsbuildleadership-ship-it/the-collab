// Sign out: clears the session cookie on this device.
const { json, clearTokenCookie } = require('./lib/http');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  return json(200, { ok: true }, { 'Set-Cookie': clearTokenCookie() });
};
