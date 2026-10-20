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
  assert.match(main, /Generating value and capturing value/);
  assert.ok(!/class="ps-block"/.test(main) && !/oe-phases/.test(main), 'the long sections stay off the cover');
});

test('the product hub lists every product once, with its link from the pricing registry', () => {
  const html = read('pages/all-products.html');
  const links = [
    ...pricing.products.map((p) => p.payment_link).filter(Boolean),
    ...(pricing.blueprint_series || []).map((p) => p.payment_link),
    ...(pricing.partner_ip || []).map((p) => p.payment_link),
    ...pricing.partnerships.map((p) => p.payment_link),
    ...pricing.memberships.flatMap((m) => m.plans.map((pl) => pl.payment_link)),
  ];
  for (const l of links) assert.equal(html.split(`href="${l}"`).length - 1, 1, `hub links ${l} once`);
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

test('every footer Navigate/More link, and so every contents row, uses the exact title of the page it opens', () => {
  const decode = (t) => t.replace(/&amp;/g, '&');
  const exact = (file) => decode(/<title>([^<]*)<\/title>/.exec(read(`pages/${file}.html`))[1]).split(/ [—|] /)[0].trim();
  for (const f of ['index.html', ...fs.readdirSync(path.join(root, 'pages')).map((n) => `pages/${n}`)]) {
    const html = read(f);
    for (const h of ['Navigate', 'More']) {
      const block = (new RegExp(`<h4>${h}</h4>\\s*<ul>([\\s\\S]*?)</ul>`).exec(html) || [])[1] || '';
      for (const m of block.matchAll(/<li><a href="(?:pages\/)?([\w-]+)\.html"[^>]*>([^<]+)<\/a><\/li>/g)) {
        assert.equal(decode(m[2]), exact(m[1]), `${f}: ${h} link to ${m[1]}.html`);
      }
    }
  }
});
