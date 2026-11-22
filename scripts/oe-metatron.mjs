// The Omnidirectional Enterprise™ model drawn as Metatron's Cube, exact geometry:
// 13 equal circles (one centre, six at 2r, six at 4r on the same six axes, so neighbours are tangent)
// and 78 straight lines joining every pair of centres. Nothing is resized, filled over or highlighted
// out of the geometry; labels carry a background-coloured outline so every line stays visible.
// Inner ring = independent (held inside an enterprise). Outer ring = external, dependent participants.
// Centre = The Co.LLab™ Leadership Infrastructure™, the one Source.
// Shared by scripts/apply-oe-metatron.mjs (site) and scripts/pitch/*.mjs (pitch + deck).

export const C = 430;
export const R = 84;
const f1 = (n) => n.toFixed(1);
const pt = (d, deg) => [C + d * Math.cos((deg * Math.PI) / 180), C - d * Math.sin((deg * Math.PI) / 180)];

// slot -> node. Hrefs are relative to pages/ (the site prefixes "pages/" on the home page).
export const NODES = [
  { slot: 'o90', ring: 'out', name: 'Enterprises', title: ['ENTERPRISES'], lines: ['Create products.', 'Generate wealth.', 'Build solutions.'], href: 'partnership.html#tiers', co: 'Partnership™' },
  { slot: 'o30', ring: 'out', name: 'Partners', title: ['PARTNERS'], lines: ['Partnership™'], href: 'partnership.html', co: 'Partnership™' },
  { slot: 'o330', ring: 'out', name: 'Nonprofits', title: ['NONPROFITS'], lines: ['Address needs.', 'Create change.', 'Build stronger', 'communities.'], href: 'impact.html', co: 'The .LLab Impact™' },
  { slot: 'o270', ring: 'out', name: 'Communities', title: ['COMMUNITIES'], lines: ['Support people.', 'Create', 'opportunity.', 'Drive productivity.'], href: 'founders.html', co: 'The Co.LLab Founders Organization™' },
  { slot: 'o210', ring: 'out', name: 'Members', title: ['MEMBERS'], lines: ['The .LLab', 'Membership™'], href: 'products.html#membership', co: 'The .LLab Membership™' },
  { slot: 'o150', ring: 'out', name: 'Founders', title: ['FOUNDERS'], lines: ['The Co.LLab', 'Founders', 'Organization™'], href: 'founders.html', co: 'The Co.LLab Founders Organization™' },
  { slot: 'i90', ring: 'in', name: 'People', title: ['PEOPLE'], lines: ['Bring talent.', 'Build skills.', 'Create value.'], href: 'products.html', co: 'The .LLab™' },
  { slot: 'i30', ring: 'in', name: 'Knowledge + IP', title: ['KNOWLEDGE', '+ IP'], lines: ['Sparks innovation.', 'Builds ownership.', 'Creates long-term', 'value.'], href: 'think.html', co: 'The .LLab R.A.T.™ · Research And Theory' },
  { slot: 'i330', ring: 'in', name: 'Technology', title: ['TECHNOLOGY'], lines: ['Amplifies impact.', 'Connects resources.', 'Expands access.'], href: 'technology.html', co: 'Technology · The .LLab Legacy Ventures™' },
  { slot: 'i270', ring: 'in', name: 'Products & Services', title: ['PRODUCTS', '& SERVICES'], lines: ['Every .LLab product.', 'Shop by phase.', 'Licensed to keep.'], href: 'all-products.html', co: 'The .LLab Products™' },
  { slot: 'i210', ring: 'in', name: 'Capital', title: ['CAPITAL'], lines: ['Fuels ideas.', 'Scales solutions.', 'Builds legacy.'], href: 'partnership.html#tiers', co: 'Partnership™' },
  { slot: 'i150', ring: 'in', name: 'Creators', title: ['CREATORS'], lines: ['Bring ideas.', 'Create culture.', 'Build brands.'], href: 'creator.html', co: 'The .LLab Creators™' },
];

export function centres() {
  const c = { core: [C, C] };
  for (let k = 0; k < 6; k++) {
    const a = (90 + 60 * k) % 360;
    c[`i${a}`] = pt(2 * R, a);
    c[`o${a}`] = pt(4 * R, a);
  }
  return c;
}

const esc = (s) => s.replace(/&(?!amp;)/g, '&amp;');
const halo = 'paint-order="stroke" stroke="#0f1d13" stroke-width="6" stroke-linejoin="round"';

// The 78 lines + 13 circles, before labels. ids: prefix for gradient ids (unique per document).
export function geometry({ id, lineOpacity = 0.34, lineWidth = 1.3, circleStroke, circleWidth = 1.6 }) {
  circleStroke = circleStroke || 'rgba(255,96,46,.62)';
  const c = centres();
  const pts = Object.values(c);
  let lines = '';
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
    lines += `<line x1="${f1(pts[i][0])}" y1="${f1(pts[i][1])}" x2="${f1(pts[j][0])}" y2="${f1(pts[j][1])}"/>`;
  }
  return {
    c,
    defs: `<defs><linearGradient id="${id}-fil" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2e12"/><stop offset="1" stop-color="#ff6a2e"/></linearGradient><radialGradient id="${id}-core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff2e12" stop-opacity=".2"/><stop offset="1" stop-color="#ff2e12" stop-opacity="0"/></radialGradient><filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`,
    lines: `<g class="oe-mesh" aria-hidden="true" stroke="#ff602e" stroke-opacity="${lineOpacity}" stroke-width="${lineWidth}">${lines}</g>`,
    circle: (x, y, on) => on
      ? `<circle cx="${f1(x)}" cy="${f1(y)}" r="${R}" fill="#ff2e12" fill-opacity=".16" stroke="url(#${id}-fil)" stroke-width="3" filter="url(#${id}-glow)"/>`
      : `<circle cx="${f1(x)}" cy="${f1(y)}" r="${R}" fill="#0f1d13" fill-opacity="0" stroke="${circleStroke}" stroke-width="${circleWidth}"/>`,
  };
}

// kind: 'full' (desktop, title + lines), 'sm' (mobile names), 'mini' (where-this-fits).
// opts.links: {name: {href, label}} from the page; opts.on: Set of lit node names; opts.base: '' or 'pages/';
// opts.lines: {name: [lines]} replaces the descriptor lines; opts.coreText: [name, sub] for the centre;
// opts.noLabels: circles only; opts.lineWidth/lineOpacity/circleWidth/circleStroke: heavier lines for small copies
// (the model figures in scripts/oe-figures.mjs use these).
export function svg(kind, opts = {}) {
  const id = kind === 'full' ? 'oe' : kind === 'sm' ? 'oes' : 'oem';
  const g = geometry({ id, lineWidth: opts.lineWidth || (kind === 'full' ? 1.8 : 2.6), lineOpacity: opts.lineOpacity || (kind === 'full' ? 0.62 : 0.66), circleWidth: opts.circleWidth || (kind === 'full' ? 1.8 : 2.6), circleStroke: opts.circleStroke });
  const base = opts.base || '';
  const on = opts.on || new Set();
  const names = NODES.map((n) => n.name).join(', ').replace(/, ([^,]*)$/, ', and $1');
  const desc = `The Omnidirectional Enterprise™ model: The Co.LLab™ Leadership Infrastructure™ at the centre, connected in every direction to ${names}.`;
  const head = kind === 'full'
    ? `<svg class="oe-diagram" data-model="metatron" viewBox="-14 -14 888 888" role="img" aria-labelledby="oe-diagram-title" xmlns="http://www.w3.org/2000/svg">\n          <title id="oe-diagram-title">${esc(desc)}</title>`
    : `<svg class="${kind === 'sm' ? 'oe-diagram-sm' : 'oe-mini-svg'}" data-model="metatron" viewBox="-14 -14 888 888" role="img" aria-label="${esc(opts.ariaLabel || desc)}" xmlns="http://www.w3.org/2000/svg">`;
  let out = `${head}\n          ${g.defs}\n          <circle cx="${C}" cy="${C}" r="${2 * R}" fill="url(#${id}-core)"/>\n          ${g.lines}\n`;
  // centre: the Source
  const [cx, cy] = g.c.core;
  out += `          <circle cx="${f1(cx)}" cy="${f1(cy)}" r="${R}" fill="#0f1d13" fill-opacity="0" stroke="url(#${id}-fil)" stroke-width="${kind === 'full' ? 2 : 3}" filter="url(#${id}-glow)"/>\n`;
  out += `          <image href="${base ? '' : '../'}assets/img/logo-mark.png" x="${f1(cx - 24)}" y="${f1(cy - 58)}" width="48" height="30.9"/>\n`;
  if (kind === 'full') {
    out += `          <text x="${f1(cx)}" y="${f1(cy + 2)}" text-anchor="middle" class="oe-c-name" style="font-size:25px" ${halo}>The Co.LLab™</text>\n`;
    out += `          <text x="${f1(cx)}" y="${f1(cy + 24)}" text-anchor="middle" class="oe-c-sub" style="letter-spacing:.14em" ${halo}>LEADERSHIP</text>\n`;
    out += `          <text x="${f1(cx)}" y="${f1(cy + 41)}" text-anchor="middle" class="oe-c-sub" style="letter-spacing:.14em" ${halo}>INFRASTRUCTURE™</text>\n`;
  } else {
    const p = kind === 'sm' ? 'oes' : 'oem';
    out += `          <text x="${f1(cx)}" y="${f1(cy + 8)}" text-anchor="middle" class="${p}-c" style="font-size:24px" ${halo}>${(opts.coreText || [])[0] || 'The Co.LLab™'}</text>\n`;
    out += `          <text x="${f1(cx)}" y="${f1(cy + 34)}" text-anchor="middle" class="${p}-sub" style="font-size:12px" ${halo}>${(opts.coreText || [])[1] || 'THE SOURCE'}</text>\n`;
  }
  for (const n of NODES) {
    const [x, y] = g.c[n.slot];
    const link = (opts.links && opts.links[n.name]) || { href: base + n.href, label: `${n.name} — ${n.co}` };
    const lit = on.has(n.name);
    out += `          <a href="${link.href}" class="oe-link" data-node="${esc(n.name)}" aria-label="${esc(link.label)}">${g.circle(x, y, lit)}`;
    if (kind === 'full') {
      const rows = [...n.title.map((t) => ['oe-n-title', t, 18]), ...((opts.lines && opts.lines[n.name]) || n.lines).map((t) => ['oe-n-line', t, 17])];
      const h = rows.reduce((s, r) => s + r[2], 0) + 4;
      let ty = y - h / 2 + 13;
      rows.forEach(([cls, t, lh], i) => {
        out += `<text x="${f1(x)}" y="${f1(ty)}" text-anchor="middle" class="${cls}" ${halo}>${esc(t)}</text>`;
        ty += lh + (i === n.title.length - 1 ? 4 : 0);
      });
    } else if (!opts.noLabels) {
      const cls = kind === 'sm' ? 'oes-n' : `oem-n${lit ? ' on' : ''}`;
      const parts = n.name === 'Products & Services' ? ['Products &', 'Services'] : n.name === 'Knowledge + IP' ? ['Knowledge', '+ IP'] : [n.name];
      const fs = kind === 'sm' ? (n.name.length > 10 ? 25 : 28) : (n.name.length > 10 ? 23 : 26);
      parts.forEach((t, i) => {
        const ty = y + 9 + (i - (parts.length - 1) / 2) * 28;
        out += `<text x="${f1(x)}" y="${f1(ty)}" text-anchor="middle" class="${cls}" style="font-size:${fs}px" ${halo}>${esc(t)}</text>`;
      });
    }
    out += `</a>\n`;
  }
  return `${out}          </svg>`;
}
