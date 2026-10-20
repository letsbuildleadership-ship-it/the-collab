// Builds pages/all-products.html: every product on one page, one line each, link only.
// Names, prices and links come straight from content/pricing.json and content/free-tools.json,
// so a price or link can only be changed in one place. The header, footer and More lists are
// taken from pages/legacy-library.html so the hub always matches the rest of the site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const reg = JSON.parse(read('content/pricing.json'));
const free = JSON.parse(read('content/free-tools.json')).tools;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FOUR = new Set(['strength-map', 'alignment-map', 'build-plan', 'legacy-profile', 'operating-system', 'legacy-map', 'diagnostic', 'blueprint', 'legacy-architecture']);
const isCreator = (p) => /^creator|^creative/.test(p.key);
const isFounders = (p) => (p.phase || '').includes('Founders Organization');
const phaseShort = (p) => (p.phase || '').replace(/^Phase (\w+) · /, 'Phase $1 · ');

const row = (name, meta, price, href, ext = true) =>
  `<a class="hub-row" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener"' : ''}><span class="hub-name">${esc(name)}</span><span class="hub-meta">${esc(meta)}</span><span class="hub-price">${esc(price)}</span><span class="arrow">→</span></a>`;
const planRow = (m) =>
  `<div class="hub-row hub-row--plans"><span class="hub-name">${esc(m.name)}</span><span class="hub-meta"></span><span class="hub-plans">${m.plans.map((pl) => `<a class="pill" href="${esc(pl.payment_link)}" target="_blank" rel="noopener">${esc(pl.price_display)}</a>`).join('')}</span></div>`;

const groups = [
  { id: 'memberships', title: 'Memberships', rows: reg.memberships.map(planRow) },
  { id: 'iv-phases', title: 'The IV Phases™', rows: reg.products.filter((p) => FOUR.has(p.key)).map((p) => row(p.name, phaseShort(p), p.price_display, p.payment_link)) },
  { id: 'creators', title: '.LLab Creators™', rows: reg.products.filter(isCreator).map((p) => row(p.name, phaseShort(p), p.price_display, p.payment_link)) },
  { id: 'blueprint', title: 'The Blueprint™', rows: (reg.blueprint_series || []).map((p) => row(p.name, '', p.price_display, p.payment_link)) },
  { id: 'founders', title: 'Founders Organization™', rows: reg.products.filter(isFounders).map((p) => row(p.name.replace(/^The Co\.LLab™ Founders Organization — /, ''), 'Founders Organization™', p.price_display, p.payment_link)) },
  { id: 'partnerships', title: 'Partnerships', rows: reg.partnerships.map((p) => row(`Partnership — ${p.tier_label}`, `${p.seats} seat${p.seats === 1 ? '' : 's'}`, p.price_display, p.payment_link)) },
  { id: 'free-tools', title: 'Free tools', rows: free.map((t) => row(t.name, t.phase, 'Free', `..${t.file}`, true)) },
].filter((g) => g.rows.length);

const main = `<main>

  <section class="hero hub-hero" style="text-align:center;">
    <div class="glow"></div>
    <div class="wrap" style="position:relative;">
      <p class="eyebrow" style="justify-content:center;"><a href="products.html" style="color:inherit;">The .LLab™</a> · Product hub</p>
      <h1 class="display" style="margin-top:1.5rem;"><strong>All products.</strong></h1>
      <p class="subhead" style="margin:1.5rem auto 0;">Every product on one page, one line each.</p>
      <div class="hub-jump">${groups.map((g) => `<a class="toc-chip" href="#${g.id}">${esc(g.title)}</a>`).join('')}</div>
    </div>
  </section>
${groups.map((g) => `
  <section class="band hub-group" id="${g.id}">
    <div class="wrap">
      <p class="eyebrow">${esc(g.title)}</p>
      <div class="hub-list">
        ${g.rows.join('\n        ')}
      </div>
    </div>
  </section>`).join('\n')}

  <section class="next-links" aria-label="Continue">
    <div class="wrap">
      <p class="eyebrow">Continue</p>
      <div class="next-grid"><a href="products.html"><span>The .LLab™</span><em>→</em></a><a href="partnership.html"><span>Partnership™</span><em>→</em></a></div>
    </div>
  </section>
</main>`;

let t = read('pages/legacy-library.html');
t = t.replace(/ data-field(-href|-src)?="[^"]*"/g, '');
const TITLE = 'All Products · The .LLab™ | The Co.LLab™';
const DESC = 'Every product from The Co.LLab™ on one page: memberships, The IV Phases™, .LLab Creators™, Founders Organization™, partnerships and free tools.';
t = t.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
t = t.replace(/(<meta name="description" content=")[^"]*/, `$1${DESC}`);
t = t.replace(/(<meta property="og:title" content=")[^"]*/, `$1${TITLE}`).replace(/(<meta property="og:description" content=")[^"]*/, `$1${DESC}`);
t = t.replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${TITLE}`).replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${DESC}`);
t = t.replace(/legacy-library\.html/g, 'all-products.html');
t = t.replace(/"name": "The \.LLab Legacy Library™ — The Co\.LLab™"/, `"name": "${TITLE}"`).replace(/"description": "The \.LLab Legacy Library™[^"]*"/, `"description": "${DESC}"`).replace(/"name": "The \.LLab Legacy Library"/, '"name": "All Products"');
// the legacy-library entry in the lists goes back to a plain link; the hub entry is current
t = t.replace(/<a href="all-products\.html" aria-current="page">The \.LLab Legacy Library™<\/a>/g, '<a href="legacy-library.html">The .LLab Legacy Library™</a>');
t = t.replace(/<li><a href="all-products\.html">All Products · The \.LLab™<\/a><\/li>/g, '<li><a href="all-products.html" aria-current="page">All Products · The .LLab™</a></li>');
t = t.replace(/<li><a href="all-products\.html">The \.LLab Legacy Library™<\/a><\/li>/g, '<li><a href="legacy-library.html">The .LLab Legacy Library™</a></li>');
t = t.replace('<a href="think.html" class="is-on" aria-current="true">Knowledge + IP</a>', '<a href="think.html">Knowledge + IP</a>');
t = t.replace(/<main>[\s\S]*<\/main>/, main);
fs.writeFileSync(path.join(root, 'pages/all-products.html'), t);
console.log(`all-products.html: ${groups.map((g) => `${g.title} ${g.rows.length}`).join(' · ')}`);
