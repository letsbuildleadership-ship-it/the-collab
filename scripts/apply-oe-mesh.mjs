// Draws every Omnidirectional Enterprise™ model on the site the same way as the approved model
// (pages/omnidirectional-enterprise.html, Figure 2): every branch connects with every other branch.
// Adds dashed Interconnections between every pair of branches that are not neighbours, behind the
// circles, to the full wheel, its mobile version and the "where this fits" maps.
// Idempotent: a model that already has them is left alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html')).map((n) => `pages/${n}`)];
const SVG_RE = /<svg class="(oe-diagram|oe-diagram-sm|oe-mini-svg)"[\s\S]*?<\/svg>/g;
const NODE_RE = /<a [^>]*class="oe-link"[^>]*>[\s\S]*?<\/a>/g;
const RING_RE = /<circle cx="430\.0" cy="430\.0" r="318"[^>]*\/>/;
const f1 = (n) => n.toFixed(1);
let changed = 0;

function mesh(svg) {
  if (svg.includes('class="oe-mesh"')) return svg;
  const nodes = (svg.match(NODE_RE) || []).map((b) => { const m = /<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"/.exec(b); return { x: +m[1], y: +m[2], r: +m[3] }; });
  if (nodes.length !== 9) throw new Error(`expected 9 branches, found ${nodes.length}`);
  const ring = RING_RE.exec(svg);
  if (!ring) throw new Error('no ring');
  const op = { 2: 0.6, 3: 0.48, 4: 0.38 }, dash = { 2: '9 6', 3: '7 6', 4: '3 6' };
  let lines = '';
  for (let st = 4; st >= 2; st--) for (let i = 0; i < 9; i++) {
    const a = nodes[i], b = nodes[(i + st) % 9];
    const L = Math.hypot(b.x - a.x, b.y - a.y), ux = (b.x - a.x) / L, uy = (b.y - a.y) / L;
    lines += `<line x1="${f1(a.x + ux * (a.r + 6))}" y1="${f1(a.y + uy * (a.r + 6))}" x2="${f1(b.x - ux * (b.r + 6))}" y2="${f1(b.y - uy * (b.r + 6))}" stroke="#fdf6ec" stroke-opacity="${op[st]}" stroke-width="1.6" stroke-dasharray="${dash[st]}"/>`;
  }
  return svg.replace(ring[0], `${ring[0]}\n          <g class="oe-mesh" aria-hidden="true">${lines}</g>`);
}

for (const f of files) {
  const file = path.join(root, f);
  const html = fs.readFileSync(file, 'utf8');
  const out = html.replace(SVG_RE, (svg) => mesh(svg));
  if (out !== html) { fs.writeFileSync(file, out); changed++; console.log('mesh added:', f); }
}
console.log(`${changed} file(s) changed`);
