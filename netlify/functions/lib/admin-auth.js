// Owner authentication. The owner proves they hold ADMIN_TOKEN once (admin-session),
// which sets a signed, HttpOnly, short-lived cookie; admin pages are only served
// to a valid session (admin-page), and every admin function accepts either the
// token header (scripts, tests) or that session. Cookie-authenticated requests
// that change anything must also send X-Requested-With, which other sites cannot
// add to a request, so a page on another site cannot act as the owner.
const crypto = require('crypto');
const { parseCookies } = require('./http');

const COOKIE = 'collab_admin';
const MAX_AGE = 8 * 60 * 60;

const secret = () => process.env.ADMIN_TOKEN || '';
const sign = (exp) => crypto.createHmac('sha256', secret()).update(`admin-session:${exp}`).digest('hex');

function safeEqual(a, b) {
  const x = crypto.createHash('sha256').update(String(a)).digest();
  const y = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

const tokenMatches = (t) => !!secret() && typeof t === 'string' && t.length > 0 && safeEqual(t, secret());

function sessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Strict`;
}
const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

function hasSession(event) {
  if (!secret()) return false;
  const value = parseCookies((event.headers || {}).cookie || (event.headers || {}).Cookie)[COOKIE];
  if (!value) return false;
  const [exp, mac] = String(value).split('.');
  if (!/^\d+$/.test(exp || '') || Number(exp) < Date.now() / 1000 || !mac) return false;
  return safeEqual(mac, sign(exp));
}

function isAdmin(event) {
  const headers = event.headers || {};
  const header = headers['x-admin-token'] || headers['X-Admin-Token'];
  if (tokenMatches(header)) return true;
  if (!hasSession(event)) return false;
  const method = event.httpMethod || 'GET';
  if (method === 'GET' || method === 'HEAD') return true;
  return (headers['x-requested-with'] || headers['X-Requested-With']) === 'collab-admin';
}

module.exports = { isAdmin, hasSession, tokenMatches, sessionCookie, clearCookie, COOKIE };
