// Builds pages/all-products.html: the shop. Every product as a short store card (tagline, the facts
// that matter before buying, price, buy button), organized under The IV Phases™.
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
const FOUR = new Set(['strength-map', 'values-charter', 'leadership-identity-profile', 'decision-principles-playbook', 'foundations-assessment', 'foundations-manual', 'alignment-map', 'build-plan', 'legacy-profile', 'operating-system', 'legacy-map', 'diagnostic', 'blueprint', 'legacy-architecture']);
const isCreator = (p) => /^creator|^creative/.test(p.key);
const isFounders = (p) => (p.phase || '').includes('Founders Organization');

import { PDFDocument } from 'pdf-lib';

const PHASES = [
  { key: 'foundations', no: 'I', name: 'Foundations', tag: (reg.partnerships[0] || {}).legacy_line },
  { key: 'infrastructure-planning', no: 'II', name: 'Infrastructure Planning & Management', tag: (reg.partnerships[1] || {}).legacy_line },
  { key: 'operating-systems', no: 'III', name: 'Internal Operating Systems', tag: (reg.partnerships[2] || {}).legacy_line },
  { key: 'preservation', no: 'IV', name: 'Preservation', tag: (reg.partnerships[3] || {}).legacy_line },
];
const phaseOfText = (t) => PHASES.find((p) => (t || '').includes(`Phase ${p.no} `) || (t || '').startsWith(`Phase ${p.no}`));

async function pages(file) {
  if (!file) return null;
  const f = path.join(root, 'content', 'library', file);
  if (!fs.existsSync(f)) return null;
  try { return (await PDFDocument.load(fs.readFileSync(f), { ignoreEncryption: true })).getPageCount(); } catch { return null; }
}
const tagline = (d) => {
  const text = String(d || '');
  const issue = text.match(/magazine series — (.+?)\.?$/);
  if (issue) return issue[1].charAt(0).toUpperCase() + issue[1].slice(1) + '.';
  return text.split(/(?<=[.!?])\s/)[0].replace(/\s+—.*$/, '').trim();
};

import { execFileSync } from 'node:child_process';

const IMG_DIR = path.join(root, 'assets/img/products');
fs.mkdirSync(IMG_DIR, { recursive: true });
// product cover: page 1 of the product PDF as a small JPEG (the cover only, never the content)
function cover(key, pdfPath) {
  if (!pdfPath || !fs.existsSync(pdfPath)) return null;
  const out = path.join(IMG_DIR, `${key}.jpg`);
  if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(pdfPath).mtimeMs) {
    try { execFileSync('pdftoppm', ['-jpeg', '-jpegopt', 'quality=76', '-r', '46', '-f', '1', '-l', '1', '-singlefile', pdfPath, out.replace(/\.jpg$/, '')], { stdio: 'ignore' }); } catch { return null; }
  }
  return `../assets/img/products/${key}.jpg`;
}
const dollars = (display) => { const m = String(display).replace(/,/g, '').match(/\$(\d+(?:\.\d+)?)/); return m ? Number(m[1]) : 0; };
const buy = (href, label = 'Order') => !href ? '<span class="fx-soon">Available soon</span>' : `<a class="fx-btn" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`;
const phaseCat = (key) => { const ph = PHASES.find((p) => p.key === key); return ph ? `phase-${ph.no.toLowerCase()}` : null; };

const items = [];
const add = (o) => items.push(o);
const partnerLevels = (key) => reg.partnerships.filter((t) => (t.grants || []).includes(key)).map((t) => t.tier_label);

for (const t of reg.partnerships) {
  add({ kind: 'partner', group: 'Partnerships', cats: ['partnerships'], badge: 'Partnership™', line: 'Partnership™', name: t.tier_label, tag: `${t.headline || ''} ${t.legacy_line || ''}`.trim(), meta: `${t.seats} seat${t.seats === 1 ? '' : 's'} · ${t.term_months >= 1200 ? 'Lifetime' : `${t.term_months / 12} year${t.term_months === 12 ? '' : 's'}`} of membership`, price: t.price_display, sort: dollars(t.price_display), buttons: buy(t.payment_link), mark: t.tier_label });
}
for (const m of reg.memberships) {
  add({ kind: 'member', group: 'Memberships', cats: ['memberships'], badge: 'Membership', line: 'Membership', name: m.name, tag: tagline(m.description), meta: m.unlocks_catalog ? 'Every IV Phases™ product, plus the Infrastructure Analysis™' : '', price: m.plans.map((pl) => pl.price_display).join(' · '), sort: dollars(m.plans[0].price_display), buttons: m.plans.map((pl) => buy(pl.payment_link, pl.price_display)).join(''), mark: m.name.replace(/™$/, '') });
}
for (const p of reg.products.filter(isFounders)) {
  add({ kind: 'product', group: 'Founders', cats: ['founders'], badge: 'Founders', line: 'The Co.LLab Founders Organization™', name: p.name.replace(/^The Co\.LLab™ Founders Organization — /, ''), tag: tagline(p.description), meta: '', price: p.price_display, sort: dollars(p.price_display), buttons: buy(p.payment_link), mark: p.name.replace(/^The Co\.LLab™ Founders Organization — /, '') });
}
const hasQuest = (key) => fs.existsSync(path.join(root, 'content/quests', `${key}.json`));
const productItem = async (p, extra = {}) => {
  const n = await pages(p.pdf_file);
  const pc = phaseCat(p.phase_key);
  const creator = isCreator(p);
  const line = creator ? '.LLab Creators™' : FOUR.has(p.key) ? 'The IV Phases™' : 'The .LLab Blueprint™';
  return {
    kind: 'product', group: 'Products', cats: [pc, creator ? 'creators' : null, ...(extra.cats || [])].filter(Boolean), badge: extra.badge || (pc ? `Phase ${pc.replace('phase-', '').toUpperCase()}` : 'Product'), isNew: Boolean(p.new),
    line, name: p.name, tag: tagline(p.description),
    meta: [/blueprint-/.test(p.key) ? 'PDF magazine' : 'Infrastructure planning IP · fillable PDF', n ? `${n} pages` : null, hasQuest(p.key) ? 'Guided quest' : null, 'Licensed to keep'].filter(Boolean).join(' · '),
    price: p.price_display, sort: dollars(p.price_display), buttons: buy(p.payment_link), img: cover(p.key, path.join(root, 'content/library', p.pdf_file || 'none')), mark: p.name, ...extra.override,
  };
};
const prods = reg.products.filter((p) => !isFounders(p));
for (const ph of PHASES) for (const p of prods.filter((x) => x.phase_key === ph.key && !isCreator(x))) add(await productItem(p));
for (const ph of PHASES) for (const p of prods.filter((x) => x.phase_key === ph.key && isCreator(x))) add(await productItem(p));
for (const p of reg.partner_ip || []) {
  const levels = partnerLevels(p.key);
  add(await productItem(p, { badge: 'Partner-only IP', cats: ['partner-ip'], override: { line: 'Partner-only IP · a product', tag: p.description, meta: `Infrastructure planning IP · fillable PDF${hasQuest(p.key) ? ' · Guided quest' : ''} · Licensed to keep · Included with ${levels.join(', ').replace(/, ([^,]*)$/, ' and $1')}` } }));
}
for (const p of reg.blueprint_series || []) {
  const m = /^blueprint-phase(\d)$/.exec(p.key);
  add(await productItem(p, { cats: ['blueprint', ...(m ? [`phase-${PHASES[Number(m[1]) - 1].no.toLowerCase()}`] : [])], badge: 'Magazine', override: { cats: ['blueprint', ...(m ? [`phase-${PHASES[Number(m[1]) - 1].no.toLowerCase()}`] : [])] } }));
}
for (const t of free) {
  const ph = phaseOfText(t.phase);
  add({ kind: 'product', group: 'Free tools', cats: ['free', ph ? `phase-${ph.no.toLowerCase()}` : null].filter(Boolean), badge: 'Free', line: 'Free tool', name: t.name, tag: tagline(t.description), meta: 'Free PDF · No account needed', price: 'Free', sort: 0, buttons: `<a class="fx-btn fx-btn--ghost" href="..${esc(t.file)}" target="_blank" rel="noopener">Open</a>`, img: cover(t.key, path.join(root, t.file.replace(/^\//, ''))), mark: t.name });
}

const tile = (o, i) => {
  const head = `data-cat="${o.cats.join(' ')}" data-price="${o.sort}" data-order="${i}" data-group="${esc(o.group)}"`;
  if (o.kind === 'partner') return `<article class="fx-card fx-card--partner" ${head}>
          <div class="fx-p-main">
            <p class="fx-line">${esc(o.line)}</p>
            <h3>${esc(o.name)}</h3>
            <p class="fx-tag">${esc(o.tag)}</p>
            ${o.meta ? `<p class="fx-meta">${esc(o.meta)}</p>` : ''}
          </div>
          <div class="fx-p-buy"><span class="fx-price">${esc(o.price)}</span>${o.buttons}</div>
        </article>`;
  if (o.kind === 'member') return `<article class="fx-card fx-card--member" ${head}>
          <p class="fx-line">${esc(o.line)}</p>
          <h3>${esc(o.name)}</h3>
          <p class="fx-tag">${esc(o.tag)}</p>
          ${o.meta ? `<p class="fx-meta">${esc(o.meta)}</p>` : ''}
          <div class="fx-buy"><span class="fx-price">${esc(o.price)}</span>${o.buttons}</div>
        </article>`;
  return `<article class="fx-card" ${head}>
          <div class="fx-img${o.img ? '' : ' fx-img--brand'}">${o.img ? `<img src="${o.img}" alt="${esc(o.name)} cover" width="391" height="506" loading="lazy">` : `<span class="fx-mark">${esc(o.mark)}</span>`}<span class="fx-badge">${esc(o.badge)}</span>${o.isNew ? '<span class="fx-badge fx-badge--new">New</span>' : ''}</div>
          <div class="fx-body">
            <p class="fx-line">${esc(o.line)}</p>
            <h3>${esc(o.name)}</h3>
            <p class="fx-tag">${esc(o.tag)}</p>
            ${o.meta ? `<p class="fx-meta">${esc(o.meta)}</p>` : ''}
            <div class="fx-buy"><span class="fx-price">${esc(o.price)}</span>${o.buttons}</div>
          </div>
        </article>`;
};
const GROUP_NOTE = { Partnerships: 'One purchase, seats for your team, and a place in the Omnidirectional Enterprise™.', Memberships: 'Monthly or yearly access, with the Infrastructure Analysis™.', Products: 'Infrastructure planning IP, licensed to keep.', 'Free tools': 'Open to everyone. No account needed.', Founders: 'The Co.LLab Founders Organization™.' };
const gridHtml = items.map((o, i) => ((i === 0 || items[i - 1].group !== o.group) ? `<div class="fx-group" data-heading="${esc(o.group)}"><h2>${esc(o.group)}</h2><p>${esc(GROUP_NOTE[o.group] || '')}</p></div>\n        ` : '') + tile(o, i)).join('\n        ');

const FILTERS = [
  ['all', 'All'], ['phase-i', 'Phase I · Foundations'], ['phase-ii', 'Phase II · Planning'], ['phase-iii', 'Phase III · Operating'], ['phase-iv', 'Phase IV · Preservation'],
  ['creators', '.LLab Creators™'], ['partner-ip', 'Partner-only IP'], ['free', 'Free tools'], ['memberships', 'Memberships'], ['partnerships', 'Partnerships'], ['blueprint', 'Blueprint™ magazine'], ['founders', 'Founders'],
];
const count = (f) => (f === 'all' ? items.length : items.filter((o) => o.cats.includes(f)).length);

const main = `<main>

  <section class="hero hub-hero" style="text-align:center;">
    <div class="glow"></div>
    <div class="wrap" style="position:relative;">
      <p class="eyebrow" style="justify-content:center;"><a href="products.html" style="color:inherit;">The .LLab™</a> · Shop</p>
      <h1 class="display" style="margin-top:1.5rem;"><strong>The .LLab products.</strong></h1>
      <p class="subhead" style="margin:1.5rem auto 0;">Infrastructure planning IP for every phase. Pick a phase, pick a product, order in one tap.</p>
    </div>
  </section>

  <section class="fx" aria-label="Shop">
    <div class="fx-bar" role="region" aria-label="Filter and sort">
      <div class="wrap fx-bar-in">
        <div class="fx-chips" role="tablist">${FILTERS.map(([id, label]) => `<button type="button" class="fx-chip${id === 'all' ? ' is-on' : ''}" data-filter="${id}" id="${id === 'all' ? 'shop-all' : id}">${esc(label)} <span>${count(id)}</span></button>`).join('')}</div>
      </div>
    </div>
    <div class="wrap">
      <div class="fx-tools">
        <label class="fx-search"><span class="cat-label">Search</span><input id="cat-q" type="search" placeholder="Search products" autocomplete="off"></label>
        <label class="fx-sort"><span class="cat-label">Sort</span><select id="fx-sort"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
      </div>
      <p id="cat-count" class="fx-count" aria-live="polite">${items.length} products</p>
      <div class="fx-grid" id="fx-grid">
        ${gridHtml}
      </div>
      <p id="cat-none" class="cat-none" hidden>Nothing matches. Clear the search or pick another filter.</p>
    </div>
  </section>

  <section class="next-links" aria-label="Continue">
    <div class="wrap">
      <p class="eyebrow">Continue</p>
      <div class="next-grid"><a href="products.html"><span>The .LLab™</span><em>→</em></a><a href="partnership.html"><span>Partnership™</span><em>→</em></a></div>
    </div>
  </section>
</main>`;

let t = read('pages/legacy-library.html');
t = t.replace(/ data-field(-href|-src)?="[^"]*"/g, '');
const TITLE = 'The .LLab Products™ | Leadership Frameworks, Templates and Tools';
const DESC = 'Shop leadership infrastructure tools: values charter, decision playbook, leadership assessments, operating systems and succession plans. From $20, plus 16 free tools.';
t = t.replace(/<title>[\s\S]*?<\/title>/, `<title>${TITLE}</title>`);
t = t.replace(/(<meta name="description" content=")[^"]*/, `$1${DESC}`);
t = t.replace(/(<meta property="og:title" content=")[^"]*/, `$1${TITLE}`).replace(/(<meta property="og:description" content=")[^"]*/, `$1${DESC}`);
t = t.replace(/(<meta name="twitter:title" content=")[^"]*/, `$1${TITLE}`).replace(/(<meta name="twitter:description" content=")[^"]*/, `$1${DESC}`);
// Product structured data (schema.org ItemList of Product/Offer) from pricing.json, for search results.
{
  const ldItems = [...reg.products, ...reg.blueprint_series, ...reg.partner_ip]
    .filter((x) => x.payment_link && String(x.price_display || '').replace(/[^\d.]/g, ''))
    .map((x, i) => ({ '@type': 'ListItem', position: i + 1, item: { '@type': 'Product', name: x.name, description: x.description || '', brand: { '@type': 'Brand', name: 'The Co.LLab™' }, offers: { '@type': 'Offer', price: String(x.price_display).replace(/[^\d.]/g, ''), priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: x.payment_link } } }));
  const ld = { '@context': 'https://schema.org', '@type': 'ItemList', name: TITLE, itemListElement: ldItems };
  t = t.replace(/<script type="application\/ld\+json" id="product-list-ld">[\s\S]*?<\/script>\n?/, '');
  t = t.replace('</head>', `<script type="application/ld+json" id="product-list-ld">${JSON.stringify(ld)}</script>\n</head>`);
}
t = t.replace(/legacy-library\.html/g, 'all-products.html');
t = t.replace(/"name": "The \.LLab Legacy Library™ — The Co\.LLab™"/, `"name": "${TITLE}"`).replace(/"description": "The \.LLab Legacy Library™[^"]*"/, `"description": "${DESC}"`).replace(/"name": "The \.LLab Legacy Library"/, '"name": "The .LLab Products"');
// the legacy-library entry in the lists goes back to a plain link; the hub entry is current
t = t.replace(/<a href="all-products\.html" aria-current="page">The \.LLab Legacy Library™<\/a>/g, '<a href="legacy-library.html">The .LLab Legacy Library™</a>');
t = t.replace(/<li><a href="all-products\.html">The \.LLab Products™<\/a><\/li>/g, '<li><a href="all-products.html" aria-current="page">The .LLab Products™</a></li>');
t = t.replace(/<li><a href="all-products\.html">The \.LLab Legacy Library™<\/a><\/li>/g, '<li><a href="legacy-library.html">The .LLab Legacy Library™</a></li>');
t = t.replace('<a href="think.html" class="is-on" aria-current="true">Knowledge + IP</a>', '<a href="think.html">Knowledge + IP</a>');
// the catalog is its own branch of the model (Products & Services); no other branch is highlighted
t = t.replace(/(<div class="model-ribbon"[\s\S]*?<\/ul>)/, (r) => r.replace(/ class="is-on" aria-current="true"/g, '').replace(/<a href="all-products\.html">Products &amp; Services<\/a>/, '<a href="all-products.html" class="is-on" aria-current="true">Products &amp; Services</a>'));
t = t.replace(/<main>[\s\S]*<\/main>/, main);
t = t.replace('<script>document.getElementById(\'year\')', `<script>(function () {
  var grid = document.getElementById('fx-grid'); if (!grid) return;
  var cards = [].slice.call(grid.querySelectorAll('.fx-card')), heads = [].slice.call(grid.querySelectorAll('.fx-group')), chips = [].slice.call(document.querySelectorAll('.fx-chip')), q = document.getElementById('cat-q'), sort = document.getElementById('fx-sort'), count = document.getElementById('cat-count'), none = document.getElementById('cat-none');
  var filter = 'all';
  function apply() {
    var v = q.value.trim().toLowerCase(), n = 0;
    cards.forEach(function (c) { var hit = (filter === 'all' || c.getAttribute('data-cat').split(' ').indexOf(filter) > -1) && (!v || c.textContent.toLowerCase().indexOf(v) > -1); c.hidden = !hit; if (hit) n++; });
    var by = sort.value, list = cards.slice().sort(function (a, b) { return by === 'low' ? a.dataset.price - b.dataset.price : by === 'high' ? b.dataset.price - a.dataset.price : a.dataset.order - b.dataset.order; });
    if (by === 'featured') { list.forEach(function (c) { grid.appendChild(c); }); heads.forEach(function (h) { var g = h.getAttribute('data-heading'); var first = cards.filter(function (c) { return c.getAttribute('data-group') === g; })[0]; if (first) grid.insertBefore(h, first); h.hidden = !cards.some(function (c) { return c.getAttribute('data-group') === g && !c.hidden; }); }); } else { list.forEach(function (c) { grid.appendChild(c); }); heads.forEach(function (h) { h.hidden = true; }); }
    chips.forEach(function (b) { b.classList.toggle('is-on', b.getAttribute('data-filter') === filter); });
    count.textContent = n + (n === 1 ? ' product' : ' products'); none.hidden = n > 0;
  }
  function fromHash() { var h = location.hash.slice(1); var hit = chips.filter(function (b) { return b.id === h; })[0]; if (hit) { filter = hit.getAttribute('data-filter'); apply(); } }
  chips.forEach(function (b) { b.addEventListener('click', function () { filter = b.getAttribute('data-filter'); apply(); }); });
  q.addEventListener('input', apply); sort.addEventListener('change', apply);
  window.addEventListener('hashchange', fromHash); fromHash();
})();</script>
<script>document.getElementById('year')`);
fs.writeFileSync(path.join(root, 'pages/all-products.html'), t);
console.log(`all-products.html: ${items.length} products · ${FILTERS.slice(1).map(([id, l]) => `${l} ${count(id)}`).join(' · ')}`);
