const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const storePath = require.resolve('../netlify/functions/lib/store');
const fakeStore = require('./lib/fake-store');
require.cache[storePath] = { id: storePath, filename: storePath, loaded: true, exports: fakeStore };

const mailer = require('../netlify/functions/lib/mailer');
const apply = require('../netlify/functions/career-apply');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let sent = [];
test.beforeEach(() => {
  fakeStore.reset();
  sent = [];
  mailer._setTransportForTests({ sendMail: async (m) => { sent.push(m); } });
});
test.afterEach(() => { mailer._setTransportForTests(null); });

const good = {
  fullName: 'Avery Example',
  email: 'Avery@Example.com',
  country: 'Canada',
  area: 'sales-partner',
  experience: 'Ten years of B2B enterprise sales across North America.',
  website: 'avery.example.com',
  introduction: 'I build long-term client relationships and want to grow with The Co.LLab.',
  consent: true,
};
const post = (body, ip = '203.0.113.7') => apply.handler({ httpMethod: 'POST', headers: { 'x-nf-client-connection-ip': ip }, body: JSON.stringify(body) });

test('a valid application is saved for the owner and emailed with the applicant as reply-to', async () => {
  const r = await post(good);
  assert.equal(r.statusCode, 201);
  const { reference } = JSON.parse(r.body);
  const saved = await fakeStore.opsList('career-applications');
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, reference);
  assert.equal(saved[0].email, 'avery@example.com');
  assert.equal(saved[0].website, 'https://avery.example.com/');
  assert.equal(saved[0].areaLabel, 'Independent Sales Partner');
  assert.equal(sent.length, 1);
  assert.equal(sent[0].replyTo, 'avery@example.com');
  assert.match(sent[0].subject, /Independent Sales Partner/);
});

test('required fields, area, email, website and consent are validated', async () => {
  for (const [k, v] of [['fullName', ''], ['email', 'nope'], ['country', ''], ['area', 'employee'], ['experience', 'short'], ['introduction', ''], ['website', 'not a url'], ['consent', false]]) {
    const r = await post({ ...good, [k]: v });
    assert.equal(r.statusCode, 400, k);
    assert.ok(JSON.parse(r.body).fields[k], k);
  }
  assert.equal((await post({ ...good, website: '' })).statusCode, 201, 'website is optional');
  assert.equal(sent.length, 1);
});

test('script in submissions is escaped in the owner email; honeypot and rate limit stop spam', async () => {
  await post({ ...good, introduction: '<script>alert(1)</script> hello there friends' });
  assert.ok(!sent[0].html.includes('<script>'));
  sent = [];
  const bot = await post({ ...good, org_url: 'http://spam.example' });
  assert.equal(bot.statusCode, 201);
  assert.equal(sent.length, 0);
  for (let i = 0; i < 4; i++) assert.equal((await post(good)).statusCode, 201);
  assert.equal((await post(good)).statusCode, 429);
  assert.equal((await post(good, '198.51.100.9')).statusCode, 201, 'other connections are unaffected');
  assert.equal((await apply.handler({ httpMethod: 'GET', headers: {} })).statusCode, 405);
});

test('the Careers page has the form, the engagement terms, no social-profile field, and is in the menu and footer', () => {
  const html = read('pages/careers.html');
  for (const name of ['fullName', 'email', 'country', 'area', 'experience', 'website', 'introduction', 'consent']) assert.ok(html.includes(`name="${name}"`), name);
  assert.ok(!/linkedin/i.test(html), 'no LinkedIn');
  assert.match(html, /10% commission on eligible sales/);
  assert.match(html, /No employment, compensation or engagement is guaranteed/);
  assert.ok(!/\bcompan(y|ies)\b/i.test(html.replace(/collaborating-companies/g, '')), 'enterprise, never company');
  for (const f of ['index.html', 'pages/about.html', 'pages/careers.html']) {
    const page = read(f);
    const footer = page.slice(page.indexOf('<footer'), page.indexOf('</footer>'));
    assert.ok(footer.includes('careers.html"'), `${f}: footer`);
  }
  assert.match(read('netlify.toml'), /from = "\/careers"\s+to = "\/pages\/careers\.html"/);
});
