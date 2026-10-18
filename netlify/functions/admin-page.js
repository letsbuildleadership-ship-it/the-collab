// The owner pages (/admin/*) are not static files: they are served only to a valid
// owner session. Everyone else gets a bare sign-in form and nothing else.
const fs = require('fs');
const path = require('path');
const { hasSession } = require('./lib/admin-auth');

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

const LOGIN = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="robots" content="noindex, nofollow"><title>Owner sign-in</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f1d13;color:#fdf6ec;font-family:system-ui,sans-serif}form{width:min(92vw,380px);display:grid;gap:.8rem}h1{font-weight:300;margin:0 0 .5rem}input{background:transparent;border:1px solid rgba(253,246,236,.35);border-radius:999px;padding:.85em 1.2em;color:#fdf6ec;font:inherit}button{background:#ff4a1f;color:#0f1d13;border:0;border-radius:999px;padding:.85em 1.2em;font:inherit;font-weight:800;cursor:pointer}p{margin:0;color:#ff8a5c;min-height:1.2em;font-weight:700}</style></head>
<body><form id="f"><h1>Owner sign-in</h1><input id="t" type="password" placeholder="Admin token" autocomplete="current-password" autofocus><button type="submit">Enter</button><p id="m" aria-live="polite"></p></form>
<script>document.getElementById('f').addEventListener('submit',function(e){e.preventDefault();var m=document.getElementById('m');m.textContent='Checking…';fetch('/.netlify/functions/admin-session',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:document.getElementById('t').value})}).then(function(r){return r.json().then(function(d){return{ok:r.ok,d:d}})}).then(function(x){if(x.ok){location.reload()}else{m.textContent=x.d.error||'Could not sign in.'}}).catch(function(){m.textContent='Could not reach the site.'})});</script></body></html>`;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD') return { statusCode: 405, headers: HEADERS, body: 'Method Not Allowed' };
  let name = String((event.queryStringParameters || {}).p || '').replace(/^\/+|\/+$/g, '');
  if (!name) name = 'index.html';
  if (!/^[a-z0-9-]+\.(html|yml)$/.test(name)) return { statusCode: 404, headers: HEADERS, body: 'Not found' };

  if (!hasSession(event)) {
    if (!name.endsWith('.html')) return { statusCode: 401, headers: HEADERS, body: 'Unauthorized' };
    return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': TYPES['.html'] }, body: LOGIN };
  }
  const file = locate(name);
  if (!file) return { statusCode: 404, headers: HEADERS, body: 'Not found' };
  return { statusCode: 200, headers: { ...HEADERS, 'Content-Type': TYPES[path.extname(name)] }, body: fs.readFileSync(file, 'utf8') };
};
