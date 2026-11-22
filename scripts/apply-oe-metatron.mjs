// Redraws every Omnidirectional Enterprise™ model on the site as Metatron's Cube (scripts/oe-metatron.mjs):
// the full + mobile model on Home, Think and the business-model page, and every "where this fits" map.
// Keeps each page's node links and the nodes it lights up. Idempotent: run it again after editing oe-metatron.mjs.
//   node scripts/apply-oe-metatron.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { svg, NODES } from './oe-metatron.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html')).map((n) => `pages/${n}`)];
const SVG_RE = /<svg class="(oe-diagram|oe-diagram-sm|oe-mini-svg)"[\s\S]*?<\/svg>/g;
const KIND = { 'oe-diagram': 'full', 'oe-diagram-sm': 'sm', 'oe-mini-svg': 'mini' };
const unesc = (s) => s.replace(/&amp;/g, '&');
let changed = 0;

function read(old) {
  const links = {};
  const on = new Set();
  for (const m of old.matchAll(/<a href="([^"]+)" class="oe-link"(?: data-node="([^"]+)")? aria-label="([^"]+)">([\s\S]*?)<\/a>/g)) {
    const name = unesc(m[2] || m[3].split(' — ')[0]);
    if (!NODES.some((n) => n.name === name)) continue;
    links[name] = { href: m[1], label: m[3] };
    if (/oem-n on|fill-opacity="\.16"|rgba\(255,46,18,\.18\)/.test(m[4])) on.add(name);
  }
  const aria = /aria-label="([^"]+)"/.exec(old.slice(0, old.indexOf('>')));
  return { links, on, ariaLabel: aria ? unesc(aria[1]) : undefined };
}

for (const f of files) {
  const file = path.join(root, f);
  const html = fs.readFileSync(file, 'utf8');
  const base = f === 'index.html' ? 'pages/' : '';
  const out = html.replace(SVG_RE, (old, cls) => {
    const kind = KIND[cls];
    const { links, on, ariaLabel } = read(old);
    // a node new to this page links to its canonical page; on a page that is itself a node's home, light it
    const self = path.basename(f);
    for (const n of NODES) if (kind === 'mini' && !links[n.name] && n.href.split('#')[0] === self) on.add(n.name);
    return svg(kind, { links, on, base, ariaLabel: kind === 'mini' ? ariaLabel : undefined });
  });
  if (out !== html) { fs.writeFileSync(file, out); changed++; console.log('redrawn:', f); }
}
console.log(`${changed} file(s) changed`);
