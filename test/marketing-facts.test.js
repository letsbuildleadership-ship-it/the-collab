'use strict';

// The spec strip and ad copy state commercial facts. They must come from the approved pricing data, never drift.
// Text colour tokens must stay readable (WCAG AA 4.5:1) on the site background.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pricing = require('../netlify/functions/lib/pricing');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const tiers = pricing.registry.partnerships;
const dollars = (t) => Number(t.price_display.replace(/[^0-9]/g, ''));
const fmt = (n) => '$' + n.toLocaleString('en-US');

function factbar(html) {
  const m = html.match(/<table class="factbar[^"]*">([\s\S]*?)<\/table>/);
  assert.ok(m, 'factbar present');
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('Partnership spec strip matches the pricing registry', () => {
  const lo = fmt(Math.min(...tiers.map(dollars))), hi = fmt(Math.max(...tiers.map(dollars)));
  const seats = tiers.map((t) => t.seats).join(' · ');
  for (const f of ['pages/partnership.html']) {
    const text = factbar(read(f));
    assert.ok(text.includes(`${tiers.length} levels of partnership`), `${f}: level count`);
    assert.ok(text.includes(`${lo}–${hi}`), `${f}: price range ${lo}–${hi}`);
    const rows = [...read(f).match(/<table class="factbar[^"]*">[\s\S]*?<\/table>/)[0].matchAll(/<tr><th scope="row">([^<]*)<\/th><td>[^<]*<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g)];
    assert.equal(rows.length, tiers.length, `${f}: one row per level`);
    tiers.forEach((tier, i) => {
      assert.equal(rows[i][2], tier.price_display, `${f}: row ${i + 1} price`);
      assert.equal(Number(rows[i][3]), tier.seats, `${f}: row ${i + 1} seats`);
    });
    assert.match(text, /one-time purchase · no subscription/);
    assert.ok(!/guarantee|return on|roi|limited spots|only \d+ left/i.test(text), `${f}: no invented claims`);
  }
});

test('generated ad copy states the registry price range and seat counts', () => {
  const ads = JSON.parse(read('marketing/ads/index.json'));
  const lo = fmt(Math.min(...tiers.map(dollars))), hi = fmt(Math.max(...tiers.map(dollars)));
  const all = ads.map((a) => `${a.hook} ${a.support}`).join(' ');
  assert.ok(all.includes(`${lo}–${hi}`), 'price range in an ad');
  assert.ok(all.includes('Seats for 1, 3, 5, or 10'), 'seat counts in an ad');
  assert.ok(!/guarantee|return on|roi|limited|hurry|last chance/i.test(all), 'no invented scarcity or claims');
  assert.equal(ads.length, 15);
  // every tactic is modeled under Omnidirectional Enterprise (node) x The IV Phases (1-4)
  const NODES = ['Businesses', 'Nonprofits', 'Communities', 'People', 'Products & Services', 'Technology', 'Capital', 'Knowledge + IP', 'Creators'];
  for (const a of ads) { assert.ok(NODES.includes(a.node), `${a.id}: node`); assert.ok([1, 2, 3, 4].includes(a.phase), `${a.id}: phase`); assert.ok(a.lands, `${a.id}: landing`); }
  for (const n of NODES) assert.ok(ads.some((a) => a.node === n), `a tactic for node ${n}`);
  for (const ph of [1, 2, 3, 4]) assert.ok(ads.some((a) => a.phase === ph), `a tactic for phase ${ph}`);
});

function tokens(css) {
  const t = {};
  for (const m of css.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) t[m[1]] = m[2].trim();
  return t;
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test('text colour tokens keep AA contrast (4.5:1) on the site background', () => {
  const t = tokens(read('css/base.css'));   // later declarations win, like the cascade
  const bg = hex(t['black']);
  const text = rgb(t['text-rgb']);
  for (const name of ['white-dim', 'white-faint', 'paper', 'filament-2']) {
    const v = t[name];
    const c = v.startsWith('#') ? hex(v) : text;
    assert.ok(ratio(c, bg) >= 4.5, `--${name} ${v}: ${ratio(c, bg).toFixed(2)}:1`);
  }
  assert.ok(ratio(text, bg) >= 4.5, '--white (body) contrast');
});
function rgb(s) { return s.split(',').map((n) => parseInt(n, 10)); }

test('canonical node links: every circle (full model, mini strips, mobile lists) and ribbon chip goes to its one aligned page', () => {
  const CAN = { Businesses: 'partnership.html#tiers', Capital: 'partnership.html#tiers', Communities: 'founders.html', Nonprofits: 'impact.html', People: 'products.html', 'Products & Services': 'all-products.html', Technology: 'technology.html', 'Knowledge + IP': 'think.html', Creators: 'creator.html' };
  const names = Object.keys(CAN).map((n) => n.replace(/[+]/g, '\\+').replace('&', '&amp;')).join('|');
  let checked = 0;
  for (const f of ['index.html', ...fs.readdirSync(path.join(root, 'pages')).map((n) => `pages/${n}`)]) {
    const html = read(f), pre = f === 'index.html' ? 'pages/' : '';
    for (const m of html.matchAll(new RegExp(`<a [^>]*href="([^"]+)"[^>]*aria-label="(${names})(?: —|")`, 'g'))) { assert.equal(m[1], pre + CAN[m[2].replace('&amp;', '&')], `${f}: circle ${m[2]}`); checked++; }
    for (const m of html.matchAll(new RegExp(`<a href="([^"]+)"><span class="oe-node-title">(${names})</span>`, 'g'))) { assert.equal(m[1], pre + CAN[m[2].replace('&amp;', '&')], `${f}: node list ${m[2]}`); checked++; }
    for (const m of html.matchAll(new RegExp(`<li><a href="([^"]+)"[^>]*>(${names})</a></li>`, 'g'))) { assert.equal(m[1], pre + CAN[m[2].replace('&amp;', '&')], `${f}: ribbon ${m[2]}`); checked++; }
  }
  assert.ok(checked > 150, 'maps found: ' + checked);
});

test('every "where this fits" circle map highlights at least two nodes', () => {
  for (const f of fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html'))) {
    const html = read(`pages/${f}`);
    if (!html.includes('class="fits"')) continue;
    const on = (html.match(/class="oem-n on"/g) || []).length;
    assert.ok(on >= 2, `${f}: ${on} highlighted node(s)`);
  }
});

test('every "where this fits" strip states its marketing position', () => {
  for (const f of fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html'))) {
    const html = read(`pages/${f}`);
    if (!html.includes('class="fits"')) continue;
    const why = (html.match(/<p class="fits-why">([^<]+)<\/p>/) || [])[1];
    assert.ok(why, `${f}: fits-why present`);
    assert.ok(!/guarantee|return on|roi\b|limited spots|buys a license/i.test(why), `${f}: no invented claims`);
  }
});
