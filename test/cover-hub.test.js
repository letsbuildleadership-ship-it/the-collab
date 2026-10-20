const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const pricing = require('../content/pricing.json');
const freeTools = require('../content/free-tools.json').tools;

test('the home page is a book cover: eight chapters, each a real page, no long copy', () => {
  const html = read('index.html');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const rows = [...main.matchAll(/<a class="toc-main" href="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(rows.length, 8, 'eight chapters');
  for (const href of [...rows, ...[...main.matchAll(/class="toc-chip" href="([^"#]+)/g)].map((m) => m[1])]) {
    assert.ok(fs.existsSync(path.join(root, href)), `${href} exists`);
  }
  assert.ok(main.replace(/<[^>]+>/g, ' ').split(/\s+/).length < 520, 'the cover stays short');
  assert.ok(!/class="ps-block"/.test(main) && !/id="model"/.test(main), 'the long sections moved off the cover');
});

test('the product hub lists every product once, with its link from the pricing registry', () => {
  const html = read('pages/all-products.html');
  const links = [
    ...pricing.products.map((p) => p.payment_link).filter(Boolean),
    ...(pricing.blueprint_series || []).map((p) => p.payment_link),
    ...pricing.partnerships.map((p) => p.payment_link),
    ...pricing.memberships.flatMap((m) => m.plans.map((pl) => pl.payment_link)),
  ];
  for (const l of links) assert.equal(html.split(`href="${l}"`).length - 1, 1, `hub links ${l} once`);
  for (const t of freeTools) assert.ok(html.includes(`href="..${t.file}"`), t.key);
  assert.match(html, /<h1[^>]*><strong>All products\.<\/strong>/);
});

test('the hub is in the More lists and the sitemap, and the cover chapters point at its sections', () => {
  for (const f of ['index.html', ...fs.readdirSync(path.join(root, 'pages')).map((n) => `pages/${n}`)]) {
    assert.match(read(f), /all-products\.html"[^>]*>All Products · The \.LLab™</, f);
  }
  assert.match(read('sitemap.xml'), /pages\/all-products\.html/);
  const hub = read('pages/all-products.html');
  for (const id of ['phase-i', 'phase-ii', 'phase-iii', 'phase-iv', 'founders']) assert.ok(hub.includes(`id="${id}"`), id);
});
