// Puts the Omnidirectional Enterprise™ viewer (all IV Phases, js/oe-figures.js) everywhere the model appears:
// the full model on Home, Think and the business-model page, and every "Where this fits" map (compact, with the
// page's circles lit). Idempotent.  node scripts/apply-oe-viewer.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html')).map((n) => `pages/${n}`)];
const unesc = (s) => s.replace(/&amp;/g, '&');
for (const f of files) {
  const file = path.join(root, f);
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  // full model: the map column and its old node list become one viewer
  html = html.replace(/<div class="oe-map">[\s\S]*?<\/ul>\s*<\/div>/, '<div class="oef-embed"></div>');
  html = html.replace(/<svg class="oe-diagram(?:-sm)?"[\s\S]*?<\/svg>\s*/g, '');
  // where-this-fits maps: compact viewer, the page's circles lit
  html = html.replace(/<div class="(?:fits|oe-mini)-map">\s*(<svg class="oe-mini-svg"[\s\S]*?<\/svg>)\s*<\/div>/g, (m, svg) => {
    const on = [...svg.matchAll(/data-node="([^"]+)"[^>]*>(?:(?!<\/a>)[\s\S])*?(?:oem-n on|fill-opacity="\.16")/g)].map((x) => unesc(x[1]));
    return `<div class="fits-map oef-embed" data-compact data-on="${[...new Set(on)].join(',').replace(/&/g, '&amp;')}"></div>`;
  });
  // the static four-model strip on the subpages
  html = html.replace(/<ol class="oe-figsteps">[\s\S]*?<\/ol>/, '<div class="oef-embed" data-compact style="margin-top:1.5rem;"></div>');
  if (html.includes('oef-embed"') && !html.includes('oe-figures.js')) {
    const src = f === 'index.html' ? 'js/oe-figures.js' : '../js/oe-figures.js';
    html = html.replace('</body>', `<script src="${src}" defer></script>\n</body>`);
  }
  if (html !== before) { fs.writeFileSync(file, html); console.log('viewer:', f, (html.match(/oef-embed/g) || []).length); }
}
