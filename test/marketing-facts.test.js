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
  const m = html.match(/<ul class="factbar">([\s\S]*?)<\/ul>/);
  assert.ok(m, 'factbar present');
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

test('spec strip on Home and Partnership matches the pricing registry', () => {
  const lo = fmt(Math.min(...tiers.map(dollars))), hi = fmt(Math.max(...tiers.map(dollars)));
  const seats = tiers.map((t) => t.seats).join(' · ');
  for (const f of ['index.html', 'pages/partnership.html']) {
    const text = factbar(read(f));
    assert.ok(text.includes(`${tiers.length} levels of partnership`), `${f}: level count`);
    assert.ok(text.includes(`${lo}–${hi}`), `${f}: price range ${lo}–${hi}`);
    assert.ok(text.includes(seats), `${f}: seats ${seats}`);
    assert.match(text, /one-time purchase · no subscription/);
    assert.match(text, /Free to join The \.LLab · no card needed/i);
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
  assert.equal(ads.length, 11);
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
