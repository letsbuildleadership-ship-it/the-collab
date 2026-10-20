// Adds the ninth branch, "Products & Services" (the catalog, pages/all-products.html), to every
// Omnidirectional Enterprise™ model on the site: the ribbon, the "where this fits" circle maps, and the
// full + mobile wheel on Think. Nodes are re-spaced from 45° to 40° around the ring.
// Idempotent: a model that already has the branch is left alone.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = ['index.html', ...fs.readdirSync(path.join(root, 'pages')).filter((n) => n.endsWith('.html')).map((n) => `pages/${n}`)];
const NEW = 'Products &amp; Services';
const C = 430, R = 318, STEP = 40;
const pos = (i) => { const a = (i * STEP * Math.PI) / 180; return [C + R * Math.sin(a), C - R * Math.cos(a)]; };
const f1 = (n) => n.toFixed(1);
const NEW_INDEX = 4; // after People

const shift = (block, dx, dy) => block
  .replace(/(?<![\w-])(x|cx|x1|x2)="(-?[\d.]+)"/g, (_, k, v) => `${k}="${f1(+v + dx)}"`)
  .replace(/(?<![\w-])(y|cy|y1|y2)="(-?[\d.]+)"/g, (_, k, v) => `${k}="${f1(+v + dy)}"`);

const NODE_RE = /<a [^>]*class="oe-link"[^>]*>[\s\S]*?<\/a>/g;
const center = (block) => { const m = /<circle cx="([\d.]+)" cy="([\d.]+)"/.exec(block); return [+m[1], +m[2]]; };
const isOn = (block) => /oem-n on|stroke-width="3"/.test(block);

function convert(svg, family, wantOn) {
  if (svg.includes(NEW) ) return svg;
  const defsEnd = svg.indexOf('</defs>') + 7;
  let head = svg.slice(0, defsEnd), body = svg.slice(defsEnd);
  const nodes = body.match(NODE_RE) || [];
  if (nodes.length !== 8) return svg;
  // spokes (centre to node) and arcs (between nodes) sit outside the node links
  const outside = body.replace(NODE_RE, '');
  const spokes = [...outside.matchAll(/<line x1="[\d.]+" y1="[\d.]+" x2="[\d.]+" y2="[\d.]+"([^>]*)\/>/g)].map((m) => m[1]);
  const arcs = [...outside.matchAll(/<path d="M[^"]*"([^>]*)\/>/g)].map((m) => m[1]);
  if (spokes.length !== 8) throw new Error(`${family}: ${spokes.length} spokes`);
  const r1 = Math.abs(+/<line x1="[\d.]+" y1="([\d.]+)"/.exec(outside)[1] - C), r2 = Math.abs(+/<line x1="[\d.]+" y1="[\d.]+" x2="[\d.]+" y2="([\d.]+)"/.exec(outside)[1] - C);
  const ring = outside.match(/<circle cx="430.0" cy="430.0" r="318"[^>]*\/>/)[0];
  const polar = (rad, deg) => { const a = (deg * Math.PI) / 180; return [C + rad * Math.sin(a), C - rad * Math.cos(a)]; };

  // existing node blocks re-spaced; new block cloned from one in the same highlight state
  const placed = nodes.map((b, i) => { const [cx, cy] = center(b); const j = i < NEW_INDEX ? i : i + 1; const [nx, ny] = pos(j); return shift(b, nx - cx, ny - cy); });
  const src = nodes.find((b) => isOn(b) === wantOn) || nodes[0];
  const [sx, sy] = center(src); const [nx, ny] = pos(NEW_INDEX);
  let blk = shift(src, nx - sx, ny - sy)
    .replace(/href="[^"]*"/, `href="${family === 'index' ? 'pages/' : ''}all-products.html"`)
    .replace(/aria-label="[^"]*"/, `aria-label="${NEW} — The catalog"`);
  if (family === 'full') {
    blk = `<a href="all-products.html" class="oe-link" aria-label="${NEW} — The catalog">
          <circle cx="${f1(nx)}" cy="${f1(ny)}" r="96" fill="#0f1d13" stroke="rgba(255,96,46,.34)"/>
          <line x1="${f1(nx - 14)}" y1="${f1(ny - 50)}" x2="${f1(nx + 14)}" y2="${f1(ny - 50)}" stroke="url(#oe-fil)"/>
          <text x="${f1(nx)}" y="${f1(ny - 30)}" text-anchor="middle" class="oe-n-title">PRODUCTS</text>
          <text x="${f1(nx)}" y="${f1(ny - 12)}" text-anchor="middle" class="oe-n-title">&amp; SERVICES</text>
          <text x="${f1(nx)}" y="${f1(ny + 14)}" text-anchor="middle" class="oe-n-line">Every .LLab product.</text>
          <text x="${f1(nx)}" y="${f1(ny + 31)}" text-anchor="middle" class="oe-n-line">Shop by phase.</text>
          <text x="${f1(nx)}" y="${f1(ny + 48)}" text-anchor="middle" class="oe-n-line">Licensed to keep.</text>
          </a>`;
  } else {
    blk = blk.replace(/<text x="([\d.]+)" y="([\d.]+)"([^>]*)>[^<]*<\/text>/, (_, x, y, rest) =>
      `<text x="${x}" y="${f1(+y - 16)}"${rest}>Products</text>\n          <text x="${x}" y="${f1(+y + 16)}"${rest}>&amp; Services</text>`);
  }
  const order = [...placed.slice(0, NEW_INDEX), blk, ...placed.slice(NEW_INDEX)];
  const spokeAttr = (i) => (i < NEW_INDEX ? spokes[i] : i === NEW_INDEX ? spokes[spokes.findIndex((_, k) => !/stroke="#ff2e12" stroke-width="2.5"/.test(spokes[k]) || family !== 'mini') ] : spokes[i - 1]);
  const spokeLines = Array.from({ length: 9 }, (_, i) => { const [x1, y1] = polar(r1, i * STEP), [x2, y2] = polar(r2, i * STEP); return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}"${i === NEW_INDEX && wantOn ? spokes.find((s) => /ff2e12" stroke-width="2.5/.test(s)) || spokeAttr(i) : spokeAttr(i)}/>`; }).join('\n          ');
  const arcLines = arcs.length ? Array.from({ length: 9 }, (_, i) => { const m = i * STEP + STEP / 2; const [ax, ay] = polar(R, m - 4), [bx, by] = polar(R, m + 4); return `<path d="M${f1(ax)} ${f1(ay)} A${R} ${R} 0 0 1 ${f1(bx)} ${f1(by)}"${arcs[0]}/>`; }).join('\n          ') : '';
  // rebuild: defs, ring, arcs, spokes, then centre art (everything up to the first node), then nodes in order
  const firstNode = body.search(/<a [^>]*class="oe-link"/);
  let centre = body.slice(0, firstNode).replace(/<line [^>]*\/>\s*/g, '').replace(/<path d="M[^"]*"[^>]*\/>\s*/g, '').replace(ring, '');
  const tail = body.slice(body.lastIndexOf('</a>') + 4);
  return `${head}\n          ${ring}\n          ${arcLines}\n          ${spokeLines}\n          ${centre.trim()}\n          ${order.join('\n          ')}${tail}`;
}

let touched = 0;
for (const rel of files) {
  const p = path.join(root, rel); let s = fs.readFileSync(p, 'utf8'); const before = s;
  const pre = rel === 'index.html' ? 'pages/' : '';
  // ribbon
  s = s.replace(/(<li><a href="(?:pages\/)?products\.html"[^>]*>People<\/a><\/li>)(?!<li><a [^>]*>Products &amp; Services)/g, `$1<li><a href="${pre}all-products.html">${NEW}</a></li>`);
  // circle maps: mini maps ("where this fits"), the full wheel and the mobile wheel
  s = s.replace(/<svg class="(oe-mini-svg|oe-diagram|oe-diagram-sm)"[\s\S]*?<\/svg>/g, (svg, cls) => {
    const family = cls === 'oe-diagram' ? 'full' : cls === 'oe-diagram-sm' ? 'sm' : 'mini';
    const wantOn = rel === 'pages/products.html' && family === 'mini';
    let out = convert(svg, family, wantOn);
    if (out !== svg) {
      out = out.replace(/(aria-label="[^"]*?)People, Technology/, `$1People, Products & Services, Technology`).replace(/(<title[^>]*>[^<]*?)People, Technology/, `$1People, Products &amp; Services, Technology`);
      if (wantOn) out = out.replace(/(where this page fits: [^"]*?)(")/, '$1 · Products & Services$2');
    }
    return out;
  });
  // mobile list on Think
  s = s.replace(/(<li><a href="products\.html"><span class="oe-node-title">People<\/span>[\s\S]*?<\/a><\/li>)(?!<li><a [^>]*><span class="oe-node-title">Products)/, `$1<li><a href="all-products.html"><span class="oe-node-title">${NEW}</span><span class="oe-node-desc">Every .LLab product, shopped by phase. Licensed to keep.</span></a></li>`);
  if (s !== before) { fs.writeFileSync(p, s); touched++; }
}
console.log(`Products & Services branch added on ${touched} page(s)`);
