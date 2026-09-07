const COOKIE_NAME = 'collab_token';
const ONE_YEAR = 60 * 60 * 24 * 365;

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(';').forEach((pair) => {
    const idx = pair.indexOf('=');
    if (idx === -1) return;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

function tokenFromEvent(event) {
  const header = event.headers && (event.headers.cookie || event.headers.Cookie);
  const cookies = parseCookies(header);
  if (cookies[COOKIE_NAME]) return cookies[COOKIE_NAME];
  const qs = event.queryStringParameters || {};
  return qs.token || null;
}

function setTokenCookie(token) {
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${ONE_YEAR}; HttpOnly; Secure; SameSite=Lax`;
}

function clearTokenCookie() {
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(extraHeaders || {}) },
    body: JSON.stringify(body),
  };
}

module.exports = { COOKIE_NAME, parseCookies, tokenFromEvent, setTokenCookie, clearTokenCookie, json, CORS_HEADERS };
