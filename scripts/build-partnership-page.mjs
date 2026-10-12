// Generates the tier cards, the "What's included" table, and the sessions
// term on pages/partnership.html from content/pricing.json, so the page
// always says exactly what a purchase grants (lib/fulfill.js reads the same
// registry). Re-run after editing partnerships or products:
//   node scripts/build-partnership-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pricing = require(path.join(root, 'netlify/functions/lib/pricing.js'));
const reg = pricing.registry;
const tiers = reg.partnerships;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function card(t) {
  const top = t.rank === tiers.length ? ' partner-card--top' : '';
  const session = t.engagement ? t.engagement.label : 'No private sessions';
  return `        <div class="card partner-card${top}" style="text-align:left;">
          <span class="num">${esc(t.tier_label)}</span>
          <p class="tier-line">${esc(t.headline)}</p>
          <h3>${esc(t.price_display)}</h3>
          <p class="term">One-time purchase · 12 months of memberships</p>
          <p class="tier-tagline">${esc(t.tagline || '')}</p>
          <p class="tier-best"><strong>Best for:</strong> ${esc(t.best_for || t.positioning)}</p>
          <ul class="access-list">
${t.benefits.map((b) => `            <li>${esc(b)}</li>`).join('\n')}
          </ul>
          <dl class="tier-facts">
            <div><dt>Seats</dt><dd>${t.seats} individual${t.seats === 1 ? '' : 's'}</dd></div>
            <div><dt>Memberships</dt><dd>12 months from purchase</dd></div>
            <div><dt>Included session</dt><dd>${esc(session)}</dd></div>
            <div><dt>Access level</dt><dd>${esc(t.access_level)}</dd></div>
          </dl>
          <p class="tier-license">Standard <a href="ip-license.html">Co.LLab™ IP license</a>: internal use only. No training, consulting, client use, co-branding, or resale without written authorization.</p>
          <a class="pill pill--solid" href="${esc(t.payment_link)}" style="margin-top:auto; width:fit-content;">Purchase ${esc(t.tier_label)} · ${esc(t.price_display)} <span class="arrow">→</span></a>
        </div>`;
}

const tierCards = `      <div class="grid grid-4 tier-grid" style="margin-top:2.5rem;">
${tiers.map(card).join('\n')}
      </div>`;

const grants = Object.fromEntries(tiers.map((t) => [t.key, new Set(pricing.partnershipGrantKeysFor(t.key))]));
// .LLab Membership™ opens the Four Phases products during the term.
const catalog = new Set(pricing.fourPhasesKeys());

function cell(key, t) {
  if (grants[t.key].has(key)) return '<td class="keep">Keep</td>';
  if (catalog.has(key)) return '<td>12 mo.</td>';
  return '<td class="none">—</td>';
}

const products = reg.products.filter((p) => !p.founder_rank);
const groups = [
  { title: 'Leadership Infrastructure™ · Phase I · Foundations', sample: 'products.html#phase-1-products', items: products.filter((p) => (p.line || 'leadership') === 'leadership' && p.phase_key === 'foundations') },
  { title: 'Leadership Infrastructure™ · Phase II · Infrastructure Planning & Management', sample: 'products.html#phase-2-products', items: products.filter((p) => (p.line || 'leadership') === 'leadership' && p.phase_key === 'infrastructure-planning') },
  { title: 'Leadership Infrastructure™ · Phase III · Internal Operating Systems', sample: 'products.html#phase-3-products', items: products.filter((p) => (p.line || 'leadership') === 'leadership' && p.phase_key === 'operating-systems') },
  { title: 'Leadership Infrastructure™ · Phase IV · Preservation', sample: 'products.html#phase-4-products', items: products.filter((p) => (p.line || 'leadership') === 'leadership' && p.phase_key === 'preservation') },
  { title: 'Creator Infrastructure™', sample: 'creator.html#free', items: products.filter((p) => p.line === 'creator') },
  { title: 'The Blueprint™ series', sample: null, items: reg.blueprint_series },
  { title: 'Bonus', sample: null, items: reg.bonus_products },
];

const head = `<tr><th scope="col">Included</th>${tiers.map((t) => `<th scope="col">${esc(t.tier_label)}<br><span>${esc(t.price_display)}</span></th>`).join('')}</tr>`;
const groupRows = groups
  .filter((g) => g.items.length)
  .map((g) => {
    const sample = g.sample ? ` <a href="${g.sample}">Free samples →</a>` : '';
    const rows = g.items.map((p) => `<tr><th scope="row">${esc(p.name)}</th>${tiers.map((t) => cell(p.key, t)).join('')}</tr>`).join('\n');
    return `<tr class="group"><th colspan="${tiers.length + 1}" scope="rowgroup">${esc(g.title)}${sample}</th></tr>\n${rows}`;
  })
  .join('\n');

const all = (v) => tiers.map(() => `<td>${v}</td>`).join('');
const per = (fn) => tiers.map((t) => `<td>${fn(t)}</td>`).join('');
const membershipRows = `<tr class="group"><th colspan="${tiers.length + 1}" scope="rowgroup">Memberships, research &amp; publications <a href="journal-preview.html">Free Journal preview →</a></th></tr>
${reg.memberships.map((m) => `<tr><th scope="row">${esc(m.name)}${m.key === 'library-card' ? ' + The Legacy Library™' : ''}</th>${all('12 mo.')}</tr>`).join('\n')}`;
const partnershipRows = `<tr class="group"><th colspan="${tiers.length + 1}" scope="rowgroup">Partnership</th></tr>
<tr><th scope="row">Individual access seats</th>${per((t) => String(t.seats))}</tr>
<tr><th scope="row">Included annual session</th>${per((t) => (t.engagement ? esc(t.engagement.label) : '—'))}</tr>
<tr><th scope="row">Designated eligible releases during your term</th>${per((t) => (t.includes_eligible_releases ? 'Keep' : '—'))}</tr>
<tr><th scope="row">Digital partnership recognition</th>${per((t) => (t.rank === tiers.length ? 'Omnidirectional Enterprise™ partner' : 'Yes'))}</tr>
<tr><th scope="row">Ecosystem opportunities (eligibility, not guaranteed)</th>${per((t) => ['Eligibility', 'Priority consideration', 'Enterprise collaboration', 'Priority + cross-organizational initiatives'][t.rank - 1])}</tr>`;

const included = `      <div class="included-scroll" style="margin-top:2rem;">
        <table class="included">
          <thead>${head}</thead>
          <tbody>
${groupRows}
${membershipRows}
${partnershipRows}
          </tbody>
        </table>
      </div>
      <p class="subhead" style="margin-top:1rem; font-size:0.85rem;">Founders Organization products are not included in any partnership.</p>`;

const sessionTerm = `        <li><strong>Included sessions.</strong> ${tiers
  .map((t) => `${esc(t.tier_label)}: ${t.engagement ? esc(t.engagement.format) : 'no private sessions.'}`)
  .join(' ')} No tier includes private consulting, implementation services, or unlimited access to the founder; additional consulting, custom research, implementation, and bespoke IP development require separate written agreements.</li>`;

function inject(html, name, content) {
  const begin = new RegExp(`(<!-- BEGIN ${name} [^>]*-->)[\\s\\S]*?(<!-- END ${name} -->)`);
  if (!begin.test(html)) throw new Error(`marker ${name} not found`);
  // Function replacer: tier prices contain "$1…", which a string replacement would treat as a group reference.
  return html.replace(begin, (m, open, close) => `${open}\n${content}\n${close}`);
}

const file = path.join(root, 'pages/partnership.html');
let html = fs.readFileSync(file, 'utf8');
html = inject(html, 'TIERS', tierCards);
html = inject(html, 'INCLUDED', included);
html = inject(html, 'SESSIONS', sessionTerm);
fs.writeFileSync(file, html);
console.log('updated pages/partnership.html');
