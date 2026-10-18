const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const session = require('../netlify/functions/admin-session');
const page = require('../netlify/functions/admin-page');
const analysis = require('../netlify/functions/admin-ip-analysis');
const customers = require('../netlify/functions/admin-customers');
const auth = require('../netlify/functions/lib/admin-auth');

test.beforeEach(() => { fakeStore.reset(); process.env.ADMIN_TOKEN = 'owner-secret-token'; process.env.ADMIN_ENTRY = 'entrykey123'; });
test.afterEach(() => { delete process.env.ADMIN_TOKEN; delete process.env.ADMIN_ENTRY; });

const signIn = (token, ip = '1.2.3.4') => session.handler({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': ip }, body: JSON.stringify({ token }) });
const cookieOf = (res) => res.headers['Set-Cookie'].split(';')[0];
const getPage = (name, cookie, enter) => page.handler({ httpMethod: 'GET', headers: cookie ? { cookie } : {}, queryStringParameters: { p: enter ? `${enter}/${name}` : name } });

test('only the owner token opens a session; the cookie is HttpOnly, Secure and SameSite=Strict', async () => {
  assert.equal((await signIn('nope')).statusCode, 401);
  const ok = await signIn('owner-secret-token');
  assert.equal(ok.statusCode, 200);
  assert.match(ok.headers['Set-Cookie'], /HttpOnly/);
  assert.match(ok.headers['Set-Cookie'], /Secure/);
  assert.match(ok.headers['Set-Cookie'], /SameSite=Strict/);
});

test('guessing is limited: seven wrong tries lock that address', async () => {
  for (let i = 0; i < 7; i += 1) await signIn('wrong', '9.9.9.9');
  assert.equal((await signIn('owner-secret-token', '9.9.9.9')).statusCode, 429);
  assert.equal((await signIn('owner-secret-token', '8.8.8.8')).statusCode, 200, 'other addresses are unaffected');
});

test('owner pages are invisible: without a session every address looks like a page that does not exist', async () => {
  for (const name of ['', 'index.html', 'ip-analysis.html', 'customers.html', 'config.yml', 'nothing.html']) {
    const r = await getPage(name);
    assert.equal(r.statusCode, 404, name || '(root)');
    assert.match(r.body, /Page Not Found/);
    assert.equal(r.body.includes('Owner'), false);
    assert.equal(r.body.includes('IP Analysis'), false);
  }
  assert.equal((await getPage('ip-analysis.html', 'collab_admin=1.abc')).statusCode, 404, 'a forged cookie gets nothing');
  assert.equal((await getPage('ip-analysis.html', null, 'wrong-key')).statusCode, 404, 'a wrong entry key gets nothing');
});

test('the sign-in form appears only at the private entry address, then the page opens', async () => {
  const form = await getPage('ip-analysis.html', null, 'entrykey123');
  assert.equal(form.statusCode, 200);
  assert.match(form.body, /Owner sign-in/);
  assert.match(form.body, /location\.replace\('\/admin\/ip-analysis\.html'\)/);
  assert.equal(form.body.includes('IP Analysis'), false);
  assert.equal((await getPage('config.yml', null, 'entrykey123')).statusCode, 404);

  delete process.env.ADMIN_ENTRY;
  assert.equal((await getPage('ip-analysis.html', null, 'entrykey123')).statusCode, 404, 'with no entry key configured the form never appears');
  process.env.ADMIN_ENTRY = 'entrykey123';

  const cookie = cookieOf(await signIn('owner-secret-token'));
  const viaEntry = await getPage('ip-analysis.html', cookie, 'entrykey123');
  assert.equal(viaEntry.statusCode, 302, 'a signed-in owner on the entry address is sent to the clean page address');
  assert.equal(viaEntry.headers.Location, '/admin/ip-analysis.html');
  const real = await getPage('ip-analysis.html', cookie);
  assert.equal(real.statusCode, 200);
  assert.match(real.body, /IP Analysis/);
  assert.match(real.headers['X-Robots-Tag'], /noindex/);
  assert.equal(real.headers['Cache-Control'], 'private, no-store');
});

test('only real owner pages can be requested', async () => {
  const cookie = cookieOf(await signIn('owner-secret-token'));
  for (const bad of ['../netlify/functions/login.js', '..%2fpackage.json', 'ip-analysis.js', '.env', 'a/b.html', 'ip-analysis.html/../../x.html']) {
    assert.equal((await getPage(bad, cookie)).statusCode, 404, bad);
  }
});

test('the session works for owner functions; changes need the same-site marker; token header still works', async () => {
  const cookie = cookieOf(await signIn('owner-secret-token'));
  const get = (extra) => analysis.handler({ httpMethod: 'GET', headers: { cookie, ...extra }, queryStringParameters: {} });
  assert.equal((await get()).statusCode, 200);

  const post = (headers) => analysis.handler({ httpMethod: 'POST', headers: { cookie, ...headers }, queryStringParameters: {}, body: JSON.stringify({ id: 'x', status: 'planned', note: 'n' }) });
  assert.equal((await post({})).statusCode, 401, 'cross-site style request without the marker is refused');
  assert.equal((await post({ 'x-requested-with': 'collab-admin' })).statusCode, 200);

  assert.equal((await analysis.handler({ httpMethod: 'GET', headers: { 'x-admin-token': 'owner-secret-token' }, queryStringParameters: {} })).statusCode, 200);
  assert.equal((await customers.handler({ httpMethod: 'GET', headers: {}, queryStringParameters: {} })).statusCode, 401);
});

test('expired or tampered sessions are refused', () => {
  const past = Math.floor(Date.now() / 1000) - 10;
  assert.equal(auth.hasSession({ headers: { cookie: `collab_admin=${past}.deadbeef` } }), false);
  const good = auth.sessionCookie().split(';')[0];
  assert.equal(auth.hasSession({ headers: { cookie: good } }), true);
  assert.equal(auth.hasSession({ headers: { cookie: `${good}0` } }), false);
  delete process.env.ADMIN_TOKEN;
  assert.equal(auth.hasSession({ headers: { cookie: good } }), false, 'no token configured means no sessions');
});

test('every owner page is routed through the gate and loads the session shim', () => {
  const toml = fs.readFileSync(path.join(__dirname, '..', 'netlify.toml'), 'utf8');
  assert.match(toml, /from = "\/admin\/\*"\s+to = "\/\.netlify\/functions\/admin-page\?p=:splat"\s+status = 200\s+force = true/);
  for (const f of fs.readdirSync(path.join(__dirname, '..', 'admin')).filter((n) => /^(customers|ip-feedback|ip-analysis|collaborating-companies)\.html$/.test(n))) {
    assert.match(fs.readFileSync(path.join(__dirname, '..', 'admin', f), 'utf8'), /admin-shim\.js/, f);
  }
});
