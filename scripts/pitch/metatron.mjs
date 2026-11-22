import fs from 'node:fs';
// The Omnidirectional Enterprise™ model as Metatron's Cube for the pitch and deck (same geometry and
// placement as scripts/oe-metatron.mjs on the site): 13 equal circles, centre + six at 2r + six at 4r,
// neighbours tangent, and 78 lines joining every pair of centres.
// Inner ring = independent (held inside an enterprise); outer ring = external, dependent participants.
const C = 250, R = 46;
const SLOTS = [
  ['o90', 'Enterprises'], ['o30', 'Partners'], ['o330', 'Nonprofits'], ['o270', 'Communities'], ['o210', 'Members'], ['o150', 'Founders'],
  ['i90', 'People'], ['i30', 'Knowledge|+ IP'], ['i330', 'Technology'], ['i270', 'Products &amp;|Services'], ['i210', 'Capital'], ['i150', 'Creators'],
];
const f1 = (n) => n.toFixed(1);
const pt = (d, deg) => [C + d * Math.cos((deg * Math.PI) / 180), C - d * Math.sin((deg * Math.PI) / 180)];

export function metatronSvg() {
  const c = { core: [C, C] };
  for (let k = 0; k < 6; k++) { const a = (90 + 60 * k) % 360; c[`i${a}`] = pt(2 * R, a); c[`o${a}`] = pt(4 * R, a); }
  const pts = Object.values(c);
  let lines = '';
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) lines += `<line x1="${f1(pts[i][0])}" y1="${f1(pts[i][1])}" x2="${f1(pts[j][0])}" y2="${f1(pts[j][1])}"/>`;
  const halo = 'paint-order="stroke" stroke="#0f1d13" stroke-width="4" stroke-linejoin="round"';
  const circles = pts.map(([x, y], i) => `<circle cx="${f1(x)}" cy="${f1(y)}" r="${R}" fill="none" stroke="#ff602e" stroke-width="${i === 0 ? 2.4 : 1.6}" filter="url(#pg)"/>`).join('');
  const labels = SLOTS.map(([s, name]) => {
    const [x, y] = c[s]; const parts = name.split('|');
    return parts.map((t, i) => `<text x="${f1(x)}" y="${f1(y + 5 + (i - (parts.length - 1) / 2) * 15)}" text-anchor="middle" fill="#fff" font-size="${name.length > 11 ? 12 : 13}" font-weight="800" ${halo}>${t}</text>`).join('');
  }).join('');
  const logo = `data:image/png;base64,${fs.readFileSync(new URL('../../assets/img/logo-mark.png', import.meta.url)).toString('base64')}`;
  const core = `<image href="${logo}" x="${C - 14}" y="${C - 30}" width="28" height="18"/><text x="${C}" y="${C + 7}" text-anchor="middle" fill="#fff" font-size="7.6" font-weight="800" letter-spacing=".6" ${halo}>OMNIDIRECTIONAL</text><text x="${C}" y="${C + 17}" text-anchor="middle" fill="#fff" font-size="7.6" font-weight="800" letter-spacing=".6" ${halo}>ENTERPRISE™</text>`;
  return `<svg viewBox="20 20 460 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Omnidirectional Enterprise™ model"><defs><filter id="pg" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g stroke="#ffffff" stroke-opacity=".7" stroke-width="1.2">${lines}</g>${circles}${core}${labels}</svg>`;
}
