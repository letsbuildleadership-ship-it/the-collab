// Ink-style botanical drawings of four old-growth conifers, used as the "bars" of the Partnership slide:
// Ponderosa pine (Partner), sugar pine (Strategic), giant sequoia (Enterprise), Douglas fir (Omnidirectional).
// Pure SVG strokes and flat fills (no filters), so they stay crisp in the PDF.

export const SPECIES = {
  ponderosa: { name: 'Ponderosa Pine', latin: 'Pinus ponderosa' },
  sugar: { name: 'Sugar Pine', latin: 'Pinus lambertiana' },
  sequoia: { name: 'Giant Sequoia', latin: 'Sequoiadendron giganteum' },
  douglas: { name: 'Douglas Fir', latin: 'Pseudotsuga menziesii' },
};

const INK = '#ff6a2e', DEEP = '#e3300f', LIGHT = '#ffb08a', SHADE = '#2a1007', BARK = '#5c1a08';
const f = (n) => n.toFixed(1);

export function conifer(kind, H, seed = 1) {
  let r = seed * 9973 + 17;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const jit = (a) => (rnd() - 0.5) * 2 * a;
  const W = { ponderosa: 0.56, sugar: 0.66, sequoia: 0.52, douglas: 0.46 }[kind] * H;
  const cx = W / 2, out = [];
  const line = (x1, y1, x2, y2, w = 1, c = INK, o = 1) => out.push(`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" stroke-linecap="round"/>`);
  const path = (d, w = 1, c = INK, fill = 'none', o = 1) => out.push(`<path d="${d}" stroke="${c}" stroke-width="${w}" stroke-opacity="${o}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`);
  const P = (x, y) => `${f(x)} ${f(y)}`;

  // Trunk: tapering outline, bark strokes (scaly plates on pines and fir, deep fibrous furrows on sequoia).
  const trunk = (yTop, baseW, topW, flare = 0) => {
    const half = (y) => (topW + (baseW - topW) * Math.pow(Math.max(0, y - yTop) / (H - yTop), 1.5)) / 2 + (y > H - flare ? Math.pow((y - (H - flare)) / flare, 2) * flare * 0.8 : 0);
    const xl = (y) => cx - half(y), xr = (y) => cx + half(y);
    const L = [], R = [];
    for (let i = 0; i <= 30; i++) { const y = yTop + (H - yTop) * i / 30; L.push(P(xl(y) + jit(0.5), y)); R.unshift(P(xr(y) + jit(0.5), y)); }
    path(`M${L.join(' L')} L${R.join(' L')} Z`, 1.3, INK, BARK);
    if (kind === 'sequoia') {
      const n = Math.round(baseW / 3.2);
      for (let k = 1; k < n; k++) { const t = k / n, pts = []; for (let i = 0; i <= 20; i++) { const y = yTop + 3 + (H - yTop - 4) * i / 20; pts.push(P(xl(y) + (xr(y) - xl(y)) * t + jit(0.9), y)); } path(`M${pts.join(' L')}`, 0.7, LIGHT, 'none', 0.5); }
    } else {
      const rows = Math.round((H - yTop) / 6);
      for (let i = 0; i < rows; i++) { const y = yTop + 4 + (H - yTop - 6) * i / rows, a = xl(y), b = xr(y), w = b - a; let x = a + w * rnd() * 0.3; while (x < b - 2) { const l = Math.min(b - 1 - x, w * (0.25 + rnd() * 0.3)); path(`M${P(x, y)} L${P(x + l, y + jit(0.8))}`, 0.6, LIGHT, 'none', 0.5); x += l + w * (0.12 + rnd() * 0.2); } }
    }
    return { xl, xr };
  };

  // A pine needle tuft: a dark mass with a starburst of fine needles.
  const tuft = (x, y, s, dir = -Math.PI / 2) => {
    out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(s * 0.8)}" ry="${f(s * 0.55)}" fill="${SHADE}" fill-opacity=".9"/>`);
    const n = 20;
    for (let i = 0; i < n; i++) { const a = dir + (i / (n - 1) - 0.5) * Math.PI * 1.7 + jit(0.07); const l = s * (0.65 + rnd() * 0.5) * (1 - 0.3 * Math.abs(Math.sin((a - dir) / 2))); line(x, y, x + Math.cos(a) * l, y + Math.sin(a) * l, 0.7, i % 3 ? INK : LIGHT, 0.95); }
  };
  const bough = (x0, y0, x1, y1, w, sag = 0) => { const mx = (x0 + x1) / 2 + jit(2), my = (y0 + y1) / 2 + sag; path(`M${P(x0, y0)} Q${P(mx, my)} ${P(x1, y1)}`, w, DEEP); path(`M${P(x0, y0 - w * 0.3)} Q${P(mx, my - w * 0.3)} ${P(x1, y1)}`, Math.max(0.45, w * 0.3), LIGHT, 'none', 0.55); };

  if (kind === 'ponderosa') {
    // Tall, clear bole with plated bark; an open, irregular crown in the upper third; upturned boughs with tufts.
    const { xl, xr } = trunk(H * 0.06, W * 0.17, W * 0.035);
    for (let i = 0; i < 3; i++) { const y = H * (0.5 + 0.12 * i) + jit(6), s = i % 2 ? 1 : -1, x0 = s < 0 ? xl(y) : xr(y); bough(x0, y, x0 + s * W * 0.06, y - 4, 1.2, 0); } // dead stubs
    const spots = [];
    for (let i = 0; i < 30; i++) { const t = rnd(), a = rnd() * Math.PI * 2, rx = W * 0.44 * Math.sqrt(t), ry = H * 0.19 * Math.sqrt(t); spots.push([cx + Math.cos(a) * rx, H * 0.24 + Math.sin(a) * ry]); }
    spots.sort((p, q) => q[1] - p[1]);
    for (const [x, y] of spots) { const ty = Math.min(H * 0.42, y + H * 0.06 + Math.abs(x - cx) * 0.25); if (Math.abs(x - cx) > W * 0.05) bough(x < cx ? xl(ty) : xr(ty), ty, x, y, 1.5, H * 0.01); }
    for (const [x, y] of spots) tuft(x, y, H * (0.05 + rnd() * 0.026), -Math.PI / 2 + (x - cx) / W * 0.8);
    tuft(cx + jit(3), H * 0.05, H * 0.05);
  } else if (kind === 'sugar') {
    // The tallest pine: straight bole, long horizontal asymmetric arms high up, flat-ish top, long cones at the tips.
    const top = H * 0.05, { xl, xr } = trunk(top, W * 0.13, W * 0.028);
    const arms = [[0.05, 0.2, -1], [0.09, 0.32, 1], [0.14, 0.47, -1], [0.19, 0.28, 1], [0.24, 0.44, 1], [0.3, 0.36, -1], [0.36, 0.22, -1], [0.41, 0.3, 1], [0.48, 0.15, -1], [0.53, 0.12, 1]];
    for (const [ty, rl, s] of arms) {
      const y = top + H * ty, reach = W * rl * (0.9 + rnd() * 0.2), x0 = s < 0 ? xl(y) : xr(y), x1 = cx + s * reach, y1 = y + jit(4);
      bough(x0, y, x1, y1, 2.2, -H * 0.008);
      const k = Math.max(2, Math.round(rl * 10));
      for (let j = 1; j <= k; j++) tuft(cx + s * reach * (0.3 + 0.7 * j / k), y1 - 3 + jit(2), H * (0.026 + rnd() * 0.012), -Math.PI / 2 + s * 0.25);
      if (rl > 0.25) { // long pendant cones with scale hatching
        for (const off of [0, s * 7]) {
          const x = x1 - s * 6 - off, y0 = y1 + 2, cl = H * (0.075 + rnd() * 0.02), cw = cl * 0.2;
          out.push(`<path d="M${P(x, y0)} C${P(x + cw, y0 + cl * 0.2)} ${P(x + cw * 0.9, y0 + cl * 0.85)} ${P(x, y0 + cl)} C${P(x - cw * 0.9, y0 + cl * 0.85)} ${P(x - cw, y0 + cl * 0.2)} ${P(x, y0)} Z" fill="${BARK}" stroke="${LIGHT}" stroke-width=".8"/>`);
          for (let j = 1; j < 8; j++) { const yy = y0 + cl * j / 8; path(`M${P(x - cw * 0.8, yy)} Q${P(x, yy + 3)} ${P(x + cw * 0.8, yy)}`, 0.55, INK, 'none', 0.9); }
        }
      }
    }
    tuft(cx, top - 2, H * 0.04);
  } else if (kind === 'sequoia') {
    // Massive buttressed trunk with fibrous furrows; a dense, domed crown of clumped foliage.
    const { xl, xr } = trunk(H * 0.06, W * 0.38, W * 0.07, H * 0.07);
    const crownTop = H * 0.02, crownBot = H * 0.6, clumps = [];
    for (let i = 0; i < 60; i++) {
      const t = rnd(), y = crownTop + (crownBot - crownTop) * t;
      const env = W * 0.46 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + t * 0.95)), 0.8) * (t < 0.2 ? 0.55 + t * 2.2 : 1);
      clumps.push([cx + jit(env), y, H * (0.035 + rnd() * 0.025)]);
    }
    clumps.sort((p, q) => p[1] - q[1]);
    for (const [x, y, rr] of clumps) {
      let d = '';
      const m = 10;
      for (let k = 0; k <= m; k++) { const a = Math.PI * 0.95 + Math.PI * 1.1 * k / m, px = x + Math.cos(a) * rr * 1.3, py = y + Math.sin(a) * rr * 0.85; d += k ? ` Q${P(x + Math.cos(a - 0.17) * rr * 1.55, y + Math.sin(a - 0.17) * rr * 1.1)} ${P(px, py)}` : `M${P(px, py)}`; }
      d += ` Q${P(x, y + rr * 0.75)} ${P(x + Math.cos(Math.PI * 0.95) * rr * 1.3, y + Math.sin(Math.PI * 0.95) * rr * 0.85)} Z`;
      path(d, 0.9, INK, SHADE);
      for (let k = 0; k < 9; k++) { const px = x + jit(rr * 1.05), py = y - rnd() * rr * 0.7; line(px, py, px + 1, py - 1.8, 0.6, LIGHT, 0.8); }
    }
  } else {
    // Douglas fir: slender leader, conical crown from the top, drooping boughs with hanging sprays.
    const { xl, xr } = trunk(H * 0.05, W * 0.13, W * 0.02);
    line(cx, 0, cx, H * 0.06, 1.1, INK);
    const tiers = 26;
    for (let i = 0; i < tiers; i++) {
      const t = (i + 1) / tiers, y = H * (0.03 + 0.78 * t) + jit(3);
      for (const s of [-1, 1]) {
        const reach = W * 0.5 * Math.pow(t, 0.75) * (0.62 + rnd() * 0.5), x0 = s < 0 ? xl(y) : xr(y), x1 = cx + s * reach, droop = H * (0.01 + 0.03 * t) * (0.7 + rnd() * 0.6);
        // the bough's foliage mass: a drooping crescent
        out.push(`<path d="M${P(x0, y - 2)} Q${P(cx + s * reach * 0.55, y - droop * 0.2)} ${P(x1, y + droop * 0.7)} Q${P(x1 - s * reach * 0.05, y + droop * 1.4)} ${P(x1 - s * reach * 0.2, y + droop * 1.5)} Q${P(cx + s * reach * 0.45, y + droop * 1.2)} ${P(x0, y + droop * 0.9)} Z" fill="${SHADE}" fill-opacity=".92" stroke="${INK}" stroke-width=".7"/>`);
        bough(x0, y, x1, y + droop * 0.7, 0.5 + 1.4 * t, droop * 0.1);
        const sprays = Math.max(3, Math.round(reach / 5));
        for (let k = 1; k <= sprays; k++) { const u = k / (sprays + 1), sx = x0 + (x1 - x0) * u, sy = y + droop * 0.7 * u * u; const l = droop * (0.6 + 0.8 * u) * (0.7 + rnd() * 0.5); line(sx, sy, sx + s * l * 0.15, sy + l, 0.65, k % 2 ? INK : LIGHT, 0.95); if (k % 2) line(sx, sy, sx - s * l * 0.1, sy + l * 0.75, 0.55, INK, 0.75); }
      }
    }
  }
  return `<svg width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}" overflow="visible">${out.join('')}</svg>`;
}
