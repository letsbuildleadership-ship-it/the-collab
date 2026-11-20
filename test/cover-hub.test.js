const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pricing = require('../content/pricing.json');
const freeTools = require('../content/free-tools.json').tools;

test('the home page has no contents list; the Omnidirectional wheel sits above the economic case', () => {
  const html = read('index.html');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  assert.ok(!/id="contents"|class="toc-/.test(main), 'no contents section on the home page');
  assert.match(main, /id="model"/);
  assert.equal((main.match(/class="oe-link"/g) || []).length, 18, 'nine branches in the wheel and in its mobile version');
  assert.ok(main.indexOf('id="model"') < main.indexOf('id="economic"'), 'the wheel is above the economic case');
  assert.match(main, /id="economic"/);
  assert.match(main, /Creating value is half the work/);
  assert.ok(!/class="ps-block"/.test(main) && !/oe-phases/.test(main), 'the long sections stay off the cover');
});

test('the product hub lists every product once, with its link from the pricing registry', () => {
  const html = read('pages/all-products.html');
  const links = [
    ...pricing.products.filter((p) => !p.retired_from_sale).map((p) => p.payment_link).filter(Boolean),
    ...(pricing.blueprint_series || []).map((p) => p.payment_link),
    ...(pricing.partner_ip || []).map((p) => p.payment_link),
    ...pricing.partnerships.map((p) => p.payment_link),
    ...pricing.memberships.flatMap((m) => m.plans.map((pl) => pl.payment_link)),
  ];
  for (const l of links) assert.equal(html.split(`href="${l}"`).length - 1, 1, `hub links ${l} once`);
  for (const p of pricing.products.filter((x) => x.retired_from_sale)) assert.ok(!html.includes(p.payment_link), `retired ${p.key} is not sold`);
  for (const t of freeTools) assert.ok(html.includes(`href="..${t.file}"`), t.key);
  assert.match(html, /<h1[^>]*><strong>The \.LLab products\.<\/strong>/);
});

test('the hub is in the More lists and the sitemap, and the cover chapters point at its sections', () => {
  for (const f of ['index.html', ...fs.readdirSync(path.join(root, 'pages')).map((n) => `pages/${n}`)]) {
    assert.match(read(f), /all-products\.html"[^>]*>The \.LLab Products™</, f);
  }
  assert.match(read('sitemap.xml'), /pages\/all-products\.html/);
  const hub = read('pages/all-products.html');
  for (const id of ['phase-i', 'phase-ii', 'phase-iii', 'phase-iv', 'founders']) assert.ok(hub.includes(`id="${id}"`), id);
});

test('every top-menu link uses the exact title of the page it opens (or its short label)', async () => {
  const { MENU } = await import('../scripts/build-nav.mjs');
  const decode = (t) => t.replace(/&amp;/g, '&');
  const exact = (file) => decode(/<title>([^<]*)<\/title>/.exec(read(`pages/${file}.html`))[1]).split(/ [—|] /)[0].trim();
  for (const m of MENU) for (const it of m.items || []) {
    if (typeof it === 'string' || it[0].includes('#')) continue;
    assert.equal(it[1], exact(it[0]), `${m.label}: ${it[0]}.html`);
  }
});

test('the top menu reaches every page; the footer keeps only secondary, member, contact, legal and social links', async () => {
  const { MENU, FOOTER } = await import('../scripts/build-nav.mjs');
  const inMenu = new Set(MENU.flatMap((m) => (m.items || [[m.page]]).filter((it) => typeof it !== 'string' && it[0]).map((it) => it[0].split('#')[0])));
  const exempt = new Set(['login', 'account', 'quest', 'ip-license', 'journal-preview']); // reached from Sign in, the portal, the footer, and (free preview) The .LLab Journal page
  for (const n of fs.readdirSync(path.join(root, 'pages')).filter((x) => x.endsWith('.html'))) {
    const p = n.replace(/\.html$/, '');
    if (!exempt.has(p)) assert.ok(inMenu.has(p), `top menu reaches ${p}`);
  }
  assert.deepEqual(FOOTER.map((c) => c.label), ['Explore', 'Members', 'Contact', 'Legal', 'Follow']);
  for (const f of ['index.html', ...fs.readdirSync(path.join(root, 'pages')).map((n) => `pages/${n}`)]) {
    const html = read(f);
    if (!html.includes('<ul class="nav-links">')) continue;
    const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
    const heads = [...footer.matchAll(/<h4>([^<]+)<\/h4>/g)].map((m) => m[1]);
    assert.deepEqual(heads, FOOTER.map((c) => c.label), f);
    assert.ok(footer.includes('ip-license.html"') && footer.includes('mailto:hello@wearethellab.com'), `${f}: legal + contact in footer`);
    const nav = html.match(/<ul class="nav-links">[\s\S]*?nav-signin/)[0];
    for (const p of inMenu) assert.ok(nav.includes(`${p}.html"`), `${f}: top menu has ${p}`);
  }
});
