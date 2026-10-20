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

const card = (o) => `<article class="shop-card">
          <p class="shop-line">${esc(o.line)}</p>
          <h3>${esc(o.name)}</h3>
          <p class="shop-tag">${esc(o.tag)}</p>
          <ul class="shop-meta">${o.meta.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
          <div class="shop-buy"><span class="shop-price">${esc(o.price)}</span>${o.buttons}</div>
        </article>`;
const buy = (href, label = 'Buy') => !href ? '<span class="shop-soon">Available soon</span>' : `<a class="pill pill--solid" href="${esc(href)}" target="_blank" rel="noopener">${label} <span class="arrow">→</span></a>`;

async function productCard(p) {
  const n = await pages(p.pdf_file);
  const line = FOUR.has(p.key) ? 'The IV Phases™' : isCreator(p) ? '.LLab Creators™' : 'The Blueprint™';
  const meta = [`${/blueprint-/.test(p.key) ? 'PDF magazine' : 'Fillable PDF workbook'}${n ? ` · ${n} pages` : ''}`, 'Licensed to keep'];
  if (FOUR.has(p.key)) meta.push('Included with .LLab Membership™ and every Partnership™');
  return card({ line, name: p.name, tag: tagline(p.description), meta, price: p.price_display, buttons: buy(p.payment_link) });
}

const phaseSections = [];
for (const ph of PHASES) {
  const prods = reg.products.filter((p) => p.phase_key === ph.key && !isFounders(p));
  const issue = (reg.blueprint_series || []).filter((p) => p.key === `blueprint-phase${PHASES.indexOf(ph) + 1}`);
  const cards = [];
  for (const p of [...prods, ...issue]) cards.push(await productCard(p));
  const tools = free.filter((t) => (phaseOfText(t.phase) || {}).key === ph.key);
  phaseSections.push({
    id: `phase-${ph.no.toLowerCase()}`, no: ph.no, name: ph.name, tag: ph.tag, cards,
    tools: tools.map((t) => `<a class="toc-chip" href="..${esc(t.file)}" target="_blank" rel="noopener">${esc(t.name)}</a>`).join(''),
  });
}
const extra = [];
const blueprintAll = (reg.blueprint_series || []).filter((p) => !/blueprint-phase/.test(p.key));
const planBtns = (m) => m.plans.map((pl) => `<a class="pill pill--solid" href="${esc(pl.payment_link)}" target="_blank" rel="noopener">${esc(pl.price_display)}</a>`).join('');
extra.push({ id: 'memberships', title: 'Memberships', cards: reg.memberships.map((m) => card({ line: 'Membership', name: m.name, tag: tagline(m.description), meta: m.unlocks_catalog ? ['Every IV Phases™ product, unlocked while you are a member'] : [], price: m.plans.map((pl) => pl.price_display).join(' · '), buttons: planBtns(m) })) });
extra.push({ id: 'partnerships', title: 'Partnerships', cards: reg.partnerships.map((p) => card({ line: 'Omnidirectional Enterprise™ Partnership', name: p.tier_label, tag: p.headline || tagline(p.description), meta: [`${p.seats} seat${p.seats === 1 ? '' : 's'}`, `${p.term_months >= 1200 ? 'Lifetime' : `${p.term_months / 12} year${p.term_months === 12 ? '' : 's'}`} of membership`, 'All nine IV Phases™ products, licensed to keep'], price: p.price_display, buttons: buy(p.payment_link) })) });
extra.push({ id: 'founders', title: 'Founders Organization™', cards: reg.products.filter(isFounders).map((p) => card({ line: 'Founders Organization™', name: p.name.replace(/^The Co\.LLab™ Founders Organization — /, ''), tag: tagline(p.description), meta: [], price: p.price_display, buttons: buy(p.payment_link) })) });
if (blueprintAll.length) extra.push({ id: 'blueprint', title: 'The Blueprint™ magazine', cards: await Promise.all(blueprintAll.map((p) => productCard(p))) });

const nav = [...phaseSections.map((p) => [`Phase ${p.no}`, p.id]), ...extra.map((g) => [g.title, g.id])];

const main = `<main>

  <section class="hero hub-hero" style="text-align:center;">
    <div class="glow"></div>
    <div class="wrap" style="position:relative;">
      <p class="eyebrow" style="justify-content:center;"><a href="products.html" style="color:inherit;">The .LLab™</a> · Shop</p>
      <h1 class="display" style="margin-top:1.5rem;"><strong>All products.</strong></h1>
      <p class="subhead" style="margin:1.5rem auto 0;">Everything is organized under The IV Phases™. Pick a phase.</p>
      <div class="hub-jump">${nav.map(([l, id]) => `<a class="toc-chip" href="#${id}">${esc(l)}</a>`).join('')}</div>
    </div>
  </section>
${phaseSections.map((p) => `
  <section class="band shop-phase" id="${p.id}">
    <div class="wrap">
      <div class="phase-head"><span class="phase-no">${p.no}</span><div><p class="eyebrow">Phase ${p.no} · ${esc(p.name)}</p><p class="phase-tag">${esc(p.tag || '')}</p></div></div>
      <div class="shop-grid">
        ${p.cards.join('\n        ')}
      </div>
      ${p.tools ? `<div class="shop-free"><p class="eyebrow">Free tools in this phase</p><div class="toc-subs">${p.tools}</div></div>` : ''}
    </div>
  </section>`).join('\n')}
${extra.map((g) => `
  <section class="band shop-phase" id="${g.id}">
    <div class="wrap">
      <p class="eyebrow">${esc(g.title)}</p>
      <div class="shop-grid">
        ${g.cards.join('\n        ')}
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

const groups = [...phaseSections, ...extra];
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
console.log(`all-products.html: ${phaseSections.map((p) => `Phase ${p.no} ${p.cards.length}`).join(' · ')} · ${extra.map((g) => `${g.title} ${g.cards.length}`).join(' · ')}`);
