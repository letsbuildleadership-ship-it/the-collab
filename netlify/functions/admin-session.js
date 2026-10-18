// Owner sign-in: POST { token } sets the admin session cookie; POST { logout: true }
// ends it. Failed attempts are limited per address, like member sign-in.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { tokenMatches, sessionCookie, clearCookie } = require('./lib/admin-auth');

const MAX_TRIES = 7;
const LOCK_MS = 15 * 60 * 1000;
const FORGET_MS = 30 * 60 * 1000;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  if (body.logout) return json(200, { ok: true }, { 'Set-Cookie': clearCookie() });

  const h = event.headers || {};
  const ip = String(h['x-nf-client-connection-ip'] || h['x-forwarded-for'] || 'unknown').split(',')[0].trim();
  const key = `admin:${ip}`;
  const throttle = await store.getLoginThrottle(key);
  if (throttle && throttle.lockedUntil && Date.parse(throttle.lockedUntil) > Date.now()) {
    return json(429, { error: 'Too many tries. Please wait and try again.', retryAfterSeconds: Math.ceil((Date.parse(throttle.lockedUntil) - Date.now()) / 1000) });
  }
  if (!process.env.ADMIN_TOKEN) return json(503, { error: 'Admin access is not configured.' });

  if (!tokenMatches(String(body.token || '').trim())) {
    const recent = throttle && throttle.lastFailAt && Date.now() - Date.parse(throttle.lastFailAt) < FORGET_MS;
    const count = (recent ? throttle.count : 0) + 1;
    await store.saveLoginThrottle(key, { count, lastFailAt: new Date().toISOString(), lockedUntil: count >= MAX_TRIES ? new Date(Date.now() + LOCK_MS).toISOString() : null });
    return json(401, { error: 'That token is not right.', triesLeft: Math.max(0, MAX_TRIES - count) });
  }
  if (throttle) await store.clearLoginThrottle(key);
  return json(200, { ok: true }, { 'Set-Cookie': sessionCookie() });
};
