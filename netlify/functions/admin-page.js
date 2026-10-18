// The owner pages (/admin/*) are not static files and are invisible to everyone but
// the owner: without a valid owner session every request looks like a page that does
// not exist. The sign-in form appears only at an address carrying the private entry
// key (ADMIN_ENTRY, kept in the site's environment, never in the code).
const fs = require('fs');
const path = require('path');
const { hasSession } = require('./lib/admin-auth');
const crypto = require('crypto');

const TYPES = { '.html': 'text/html; charset=utf-8', '.yml': 'text/yaml; charset=utf-8' };
const HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'X-Content-Type-Options': 'nosniff' };

function locate(name) {
  const candidates = [
    path.join(__dirname, '..', '..', 'admin', name),
    path.join(process.cwd(), 'admin', name),
    process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'admin', name) : null,
  ].filter(Boolean);
  return candidates.find((c) => fs.existsSync(c)) || null;
}

const NOT_FOUND = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex"><title>Page Not Found</title><style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;color:#222}main{max-width:32rem;padding:2rem}h1{font-weight:600;margin:0 0 .5rem}p{margin:0;color:#555}</style></head><body><main><h1>Page Not Found</h1><p>Looks like you\'ve followed a broken link or entered a URL that doesn\'t exist on this site.</p></main></body></html>';
const notFound = () => ({ statusCode: 404, headers: { ...HEADERS, 'Content-Type': TYPES['.html'] }, body: NOT_FOUND });

function entryKeyOk(supplied) {
  const expected = process.env.ADMIN_ENTRY;
  if (!expected || !supplied) return false;
  const a = crypto.createHash('sha256').update(String(supplied)).digest();
  const b = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(a, b);
}

const LOGIN = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>Owner sign-in</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1d13;color:#fdf6ec;font-family:system-ui,sans-serif}form{width:min(92vw,380px);display:grid;gap:.8rem}h1{font-weight:300;margin:0 0 .5rem}input{background:transparent;border:1px solid rgba(253,246,236,.35);border-radius:999px;padding:.85em 1.2em;color:#fdf6ec;font:inherit}button{background:#ff4a1f;color:#0f1d13;border:0;border-radius:999px;padding:.85em 1.2em;font:inherit;font-weight:800;cursor:pointer}p{margin:0;color:#ff8a5c;min-height:1.2em;font-weight:700}</style></head>
<body><form id="f"><h1>Owner sign-in</h1><input id="t" type="password" placeholder="Admin token" autocomplete="current-password" autofocus><button type="submit">Enter</button><p id="m" aria-live="polite"></p></form>
<script>document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();var m=document.getElementById('m');m.textContent='Checking…';fetch('/.netlify/functions/admin-session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:document.getElementById('t').value})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){if(x.ok){location.replace('__NEXT__')}else{m.textContent=x.d.error||'Could not sign in.'}}).catch(function(){m.textContent='Could not reach the site.'})});</script></body></html>`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
  // The private entry address is /admin/<ADMIN_ENTRY>/<page>; every other address is just a page name.
  const parts = String((event.queryStringParameters || {}).p || '').replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  let entry = false;
  if (parts.length && parts.length <= 2 && process.env.ADMIN_TOKEN && entryKeyOk(parts[0])) { entry = true; parts.shift(); if (!parts.length) parts.push('customers.html'); }
  const name = parts.length ? parts.join('/') : 'index.html';
  if (!/^[a-z0-9-]+\.(html|yml)$/.test(name)) return notFound();

  if (!hasSession(event)) {
    // Not signed in: the page does not exist, unless it was reached through the private entry address.
    if (entry && name.endsWith('.html')) return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': TYPES['.html'] }, body: LOGIN.replace('__NEXT__', `/admin/${name}`) };
    return notFound();
  }
  if (entry) return { statusCode: 302, headers: { ...HEADERS, Location: `/admin/${name}` }, body: '' };
  const file = locate(name);
  if (!file) return notFound();
  return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': TYPES[path.extname(name)] }, body: fs.readFileSync(file, 'utf8') };
};
