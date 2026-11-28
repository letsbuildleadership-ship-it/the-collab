// The Omnidirectional Enterprise Model™ figures 1–4, drawn with the site's own Metatron's Cube model
// (scripts/oe-metatron.mjs + css/oe-diagram.css) so they look exactly like the model on the site.
// Writes assets/img/oe/figure-N.jpg (Omnidirectional Enterprise page) and scripts/pitch/assets/oe-figure-N.jpg (deck).
//   node scripts/oe-figures.mjs            (pass an output folder to write previews there instead)
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { svg, centres, R, C } from './oe-metatron.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(`${root}/package.json`);
const { chromium } = require('playwright');
const outDir = process.argv[2];
const f1 = (n) => n.toFixed(1);

// The part of The Co.LLab™ that runs each circle (the blueprint, Figure 2)
const RUN_BY = {
  Enterprises: ['Partnership™'], Partners: ['Partnership™'], Nonprofits: ['The .LLab', 'Impact™'],
  Communities: ['The Co.LLab', 'Founders', 'Organization™'], Members: ['The .LLab', 'Membership™'],
  Founders: ['The Co.LLab', 'Founders', 'Organization™'], People: ['The .LLab™', 'Member Portal'],
  'Knowledge + IP': ['The .LLab', 'R.A.T.™'], Technology: ['The .LLab Legacy', 'Ventures™'],
  'Products & Services': ['The .LLab', 'Products™'], Capital: ['Founders Org.', '· Partnership™'], Creators: ['The .LLab', 'Creators™'],
};
// The seven Currents, each drawn along one of the cube's own lines (slot -> slot)
const CURRENTS = [
  [1, 'o90', 'core'], [1, 'i210', 'core'], [2, 'core', 'i30'], [2, 'i30', 'o90'], [3, 'o90', 'i30'],
  [4, 'core', 'i330'], [4, 'i330', 'i150'], [5, 'i150', 'o270'], [6, 'o90', 'i150'], [6, 'o90', 'i90'], [7, 'o270', 'o330'],
];
const CURRENT_NAMES = ['Investment', 'Licensing', 'Living IP', 'Infrastructure', 'Creative', 'Sponsorship', 'Impact'];

const inner = (s) => s.slice(s.indexOf('>') + 1, s.lastIndexOf('</svg>'));

function currents() {
  const c = centres(); const pts = Object.values(c);
  const seen = {}; let lines = ''; let badges = '';
  for (const [n, a, b] of CURRENTS) {
    const key = [a, b].sort().join(); const off = 9 * (seen[key] || 0); seen[key] = (seen[key] || 0) + 1;
    const [x1, y1] = c[a], [x2, y2] = c[b]; const L = Math.hypot(x2 - x1, y2 - y1); const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const nx = -uy * off, ny = ux * off;
    const ax = x1 + ux * (R + 4) + nx, ay = y1 + uy * (R + 4) + ny, bx = x2 - ux * (R + 8) + nx, by = y2 - uy * (R + 8) + ny;
    lines += `<line x1="${f1(ax)}" y1="${f1(ay)}" x2="${f1(bx)}" y2="${f1(by)}" stroke="#fdf6ec" stroke-width="3" marker-end="url(#cur-ah)"/>`;
    let best = null, bd = -1;
    for (let t = 4; t <= 16; t++) { const m = [ax + (bx - ax) * t / 20, ay + (by - ay) * t / 20]; const dmin = Math.min(...pts.map((p) => Math.hypot(m[0] - p[0], m[1] - p[1]))); if (dmin > bd) { bd = dmin; best = m; } }
    badges += `<circle cx="${f1(best[0])}" cy="${f1(best[1])}" r="13" fill="#0f1d13" stroke="#fdf6ec" stroke-width="2"/><text x="${f1(best[0])}" y="${f1(best[1] + 5)}" text-anchor="middle" style="font:700 14px Inter,sans-serif;fill:#fdf6ec">${n}</text>`;
  }
  return { lines: `<defs><marker id="cur-ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0 L10 5 L0 10 z" fill="#fdf6ec"/></marker></defs><g>${lines}</g>`, badges };
}

// Conductors: several copies of the model, every Conductor joined to every other by a straight line.
function grid(spots, scale, labelled, w8 = 4) {
  const w = 900, h = 700;
  // Interconnections: drawn over the cubes, core edge to core edge, a soft white glow under a solid white line
  const cr = R * scale + 3; let lines = '';
  for (let i = 0; i < spots.length; i++) for (let j = i + 1; j < spots.length; j++) {
    const [x1, y1] = spots[i], [x2, y2] = spots[j]; const L = Math.hypot(x2 - x1, y2 - y1); const ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    const a = `x1="${f1(x1 + ux * cr)}" y1="${f1(y1 + uy * cr)}" x2="${f1(x2 - ux * cr)}" y2="${f1(y2 - uy * cr)}"`;
    lines += `<line ${a} stroke="#ffffff" stroke-opacity=".9" stroke-width="${w8}"/>`;
  }
  lines += spots.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(cr)}" fill="none" stroke="#ffffff" stroke-width="${w8 * 0.6}"/>`).join('');
  const defs = '<defs><filter id="ic-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter></defs>';
  const cubes = spots.map(([x, y], i) => {
    const s = svg('sm', { base: 'pages/', lineWidth: 1.9 / scale, lineOpacity: 0.82, circleWidth: 2.4 / scale, circleStroke: '#ff602e', coreText: labelled[i] ? labelled[i].core : ['Conductor', 'AN ENTERPRISE'], noLabels: labelled[i] ? !labelled[i].names : false })
      .replace(/id="oes-/g, `id="c${i}-`).replace(/url\(#oes-/g, `url(#c${i}-`).replace(i === 0 ? /^$/ : /<image [^>]*\/>/, '');
    return `<g transform="translate(${f1(x - C * scale)},${f1(y - C * scale)}) scale(${scale})">${inner(s)}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="oe-diagram-sm" style="display:block;width:100%;height:auto">${defs}${cubes}${lines}${labelled[0] && labelled[0].core[0].trim() ? `<text x="${f1(spots[0][0])}" y="${f1(spots[0][1] + 4)}" text-anchor="middle" style="font:700 12px Inter,sans-serif;fill:#fdf6ec" paint-order="stroke" stroke="#0f1d13" stroke-width="4"><tspan x="${f1(spots[0][0])}">The Co.LLab™:</tspan><tspan x="${f1(spots[0][0])}" dy="12" style="font-size:7.5px">BUILDING LEADERSHIP INFRASTRUCTURE</tspan></text>` : ''}</svg>`;
}


// The Grid as Metatron's Cube of Metatron's Cubes: 13 Conductors on the 13 positions of a larger cube, joined by its
// 78 lines; the next, larger cube fades in at the edges (the Grid is one circle of it), so the pattern never ends.
function fractal() {
  const w = 900, h = 700, cx = 450, cy = 350, G = 70; // G = grid-level circle radius = each Conductor's outer edge
  const at = (d, deg) => [cx + d * Math.cos(deg * Math.PI / 180), cy - d * Math.sin(deg * Math.PI / 180)];
  const pos = [[cx, cy]]; for (let k = 0; k < 6; k++) { pos.push(at(2 * G, 90 + 60 * k)); pos.push(at(4 * G, 90 + 60 * k)); }
  const big = 5 * G; const ghosts = [[cx, cy], ...[0, 1, 2, 3, 4, 5].map((k) => at(2 * big, 90 + 60 * k))];
  let ghost = ghosts.map(([x, y]) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${big}" fill="none" stroke="#fdf6ec" stroke-opacity=".5" stroke-width="2"/>`).join('');
  for (let i = 0; i < ghosts.length; i++) for (let j = i + 1; j < ghosts.length; j++) if (Math.abs(ghosts[i][1] - ghosts[j][1]) > 1 || Math.abs(ghosts[i][1] - cy) < 1) ghost += `<line x1="${f1(ghosts[i][0])}" y1="${f1(ghosts[i][1])}" x2="${f1(ghosts[j][0])}" y2="${f1(ghosts[j][1])}" stroke="#fdf6ec" stroke-opacity=".35" stroke-width="1.6"/>`;
  let lines = '';
  for (let i = 0; i < pos.length; i++) for (let j = i + 1; j < pos.length; j++) lines += `<line x1="${f1(pos[i][0])}" y1="${f1(pos[i][1])}" x2="${f1(pos[j][0])}" y2="${f1(pos[j][1])}" stroke="#ffffff" stroke-opacity=".85" stroke-width="1.6"/>`;
  const scale = G / (5 * R);
  const cubes = pos.map(([x, y], i) => {
    const s = svg('sm', { base: 'pages/', noLabels: true, coreText: [' ', ' '], lineWidth: 1.5 / scale, lineOpacity: 0.85, circleWidth: 1.6 / scale, circleStroke: '#ff602e' })
      .replace(/id="oes-/g, `id="g${i}-`).replace(/url\(#oes-/g, `url(#g${i}-`).replace(/<image [^>]*\/>/, '');
    return `<g transform="translate(${f1(x - C * scale)},${f1(y - C * scale)}) scale(${f1(scale * 1000) / 1000})">${inner(s)}</g>`;
  }).join('');
  const label = `<text x="${cx}" y="${cy + 4}" text-anchor="middle" style="font:700 11px Inter,sans-serif;fill:#fdf6ec" paint-order="stroke" stroke="#0f1d13" stroke-width="4"><tspan x="${cx}">The Co.LLab™:</tspan><tspan x="${cx}" dy="10" style="font-size:6.5px">BUILDING LEADERSHIP INFRASTRUCTURE</tspan></text>`;
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto"><defs><radialGradient id="fade" cx="50%" cy="50%" r="62%"><stop offset=".52" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".15"/></radialGradient><mask id="fm"><rect x="0" y="0" width="${w}" height="${h}" fill="url(#fade)"/></mask></defs><g mask="url(#fm)">${ghost}</g>${lines}${cubes}${label}</svg>`;
}

// Easier to read, every line kept: a thicker ember ring with a stronger glow, a light dark wash inside each circle,
// and a wider dark outline around every word so the text reads over the lines.
const glowing = (s, k = 2) => s
  .replace(/stdDeviation="7" result="b"\/><feMerge><feMergeNode in="b"\/>/g, 'stdDeviation="11" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/>')
  .replace(/fill="#0f1d13" fill-opacity="0" stroke="(#ff602e|url\(#[\w-]+-fil\))" stroke-width="([\d.]+)"/g, (m, c, w) => `fill="#0f1d13" fill-opacity=".38" stroke="${c}" stroke-width="${(parseFloat(w) * k).toFixed(2)}"`)
  .replace(/stroke="#0f1d13" stroke-width="6" stroke-linejoin="round"/g, 'stroke="#0f1d13" stroke-width="10" stroke-linejoin="round"');

const legendRow = (items) => `<ul class="lg">${items.map(([k, b, t]) => `<li><i class="${k}"></i><b>${b}</b><span>${t}</span></li>`).join('')}</ul>`;

const FIGS = [
  { n: 1, h: 900, big: true, body: () => glowing(svg('full', { base: 'pages/' })), legend: [], count: [] },
  { n: 2, h: 970, big: true, body: () => glowing((() => { const s = svg('full', { base: 'pages/', lines: RUN_BY, coreText: ['The Co.LLab™:', 'BUILDING LEADERSHIP', 'INFRASTRUCTURE'] }); const cur = currents(); return s.replace('</g>\n', `</g>\n${cur.lines}\n`).replace('</svg>', `${cur.badges}</svg>`); })()),
    legend: [], count: [],
    extra: `<p class="cur">Currents · ${CURRENT_NAMES.map((c, i) => `<b>${i + 1}</b> ${c}`).join('&nbsp;&nbsp; ')}</p>` },
  { n: 3, h: 900, body: () => { const D = 232, cx = 450, cy = 350; const spots = [[cx, cy], ...[0, 1, 2, 3, 4, 5].map((k) => [cx + D * Math.cos((90 + 60 * k) * Math.PI / 180), cy - D * Math.sin((90 + 60 * k) * Math.PI / 180)])];
      const blank = { core: [' ', ' '], names: false }; return glowing(grid(spots, 0.262, Object.fromEntries(spots.map((_, i) => [i, i === 0 ? { core: ['The Co.LLab™:', 'BUILDING LEADERSHIP', 'INFRASTRUCTURE'], names: false } : blank])), 1.8), 1.35); },
    legend: [], count: [] },
  { n: 4, h: 900, body: () => glowing(fractal(), 1.35),
    legend: [], count: [] },
];

const page = (f) => `<!doctype html><html><head><meta charset="utf-8"><base href="${pathToFileURL(root).href}/">
<link rel="stylesheet" href="css/base.css"><link rel="stylesheet" href="css/oe-diagram.css"><link rel="stylesheet" href="css/oe-mini.css">
<style>
html,body{margin:0;padding:0;background:#0f1d13 !important;background-image:none !important;width:900px;height:${f.h}px;overflow:hidden}
body::before,body::after{display:none !important}
.wrap{width:900px;height:${f.h}px;display:flex;flex-direction:column;align-items:center;font-family:Inter,sans-serif}
.fig{width:${f.n <= 2 ? 720 : 780}px;margin-top:${f.n <= 2 ? 14 : 16}px}
.fig svg{width:100%;height:auto;display:block}
.oe-diagram-sm{display:block !important}
.lg{list-style:none;margin:${f.n <= 2 ? 4 : 18}px 0 0;padding:0 56px;display:grid;grid-template-columns:${f.n === 4 ? 'auto' : 'repeat(2,auto)'};justify-content:center;gap:10px 40px;width:900px;box-sizing:border-box}
.lg li{display:flex;align-items:center;gap:10px;font-size:12px;white-space:nowrap;color:rgba(255,96,46,.8);letter-spacing:.02em}
.lg b{color:#fdf6ec;font-weight:700;letter-spacing:.14em;font-size:12px;white-space:nowrap}
.lg i{flex:none;width:16px;height:16px;border-radius:50%;border:2px solid #ff602e}
.lg i.src{border:3px solid #ff2e12;box-shadow:0 0 10px rgba(255,46,18,.8)}
.lg i.ln{border:0;border-radius:0;height:3px;background:#ff602e}
.lg i.wl{border:0;border-radius:0;height:4px;background:#fff}
.lg i.cur{border:0;border-radius:0;height:3px;background:#fdf6ec}
.count{margin:${f.n <= 2 ? 22 : 20}px 0 0;text-align:center;color:#fdf6ec;font-weight:700;font-size:${f.n === 4 ? 13 : 15}px;letter-spacing:.16em;text-transform:uppercase;line-height:1.7}
.cur{margin:12px 0 0;color:#ff9a6e;font-size:13px;letter-spacing:.06em}.cur b{color:#fdf6ec}
${f.legend.length ? '' : '.wrap{justify-content:center}'}${f.big ? '.fig{width:880px;margin:0}.oe-n-title{font-size:16px;font-weight:800;fill:#ff7a45}.oe-n-line{font-size:15.5px;font-weight:600;fill:#fdf6ec}' : ''}
</style></head><body><div class="wrap"><div class="fig">${f.body()}</div>${f.legend.length ? legendRow(f.legend) : ''}${f.count.length ? `<p class="count">${f.count.join('<br>')}</p>` : ''}${f.extra || ''}</div></body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const pg = await browser.newPage({ viewport: { width: 900, height: 970 }, deviceScaleFactor: 1 });
await pg.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
for (const f of FIGS) {
  const tmp = path.join(root, `.oe-figure-${f.n}.html`);
  fs.writeFileSync(tmp, page(f));
  await pg.setViewportSize({ width: 900, height: f.h });
  await pg.goto(pathToFileURL(tmp).href);
  const targets = outDir ? [path.join(outDir, `figure-${f.n}.jpg`)] : [path.join(root, 'assets/img/oe', `figure-${f.n}.jpg`), path.join(root, 'scripts/pitch/assets', `oe-figure-${f.n}.jpg`)];
  for (const t of targets) await pg.screenshot({ path: t, type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 900, height: f.h } });
  fs.unlinkSync(tmp);
  console.log(`figure ${f.n} ->`, targets.join(', '));
}
await browser.close();
