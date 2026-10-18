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

test.beforeEach(() => { fakeStore.reset(); process.env.ADMIN_TOKEN = 'owner-secret-token'; });
test.afterEach(() => { delete process.env.ADMIN_TOKEN; });

const signIn = (token, ip = '1.2.3.4') => session.handler({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': ip }, body: JSON.stringify({ token }) });
const cookieOf = (res) => res.headers['Set-Cookie'].split(';')[0];
const getPage = (name, cookie) => page.handler({ httpMethod: 'GET', headers: cookie ? { cookie } : {}, queryStringParameters: { p: name } });

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

test('owner pages are not public: no session gets only a sign-in form', async () => {
  const anon = await getPage('ip-analysis.html');
  assert.equal(anon.statusCode, 200);
  assert.match(anon.body, /Owner sign-in/);
  assert.equal(anon.body.includes('IP Analysis'), false);
  assert.equal((await getPage('ip-analysis.html', 'collab_admin=1.abc')).body.includes('IP Analysis'), false, 'a forged cookie is not accepted');
  assert.equal((await getPage('config.yml')).statusCode, 401);

  const cookie = cookieOf(await signIn('owner-secret-token'));
  const real = await getPage('ip-analysis.html', cookie);
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
