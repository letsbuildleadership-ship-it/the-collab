// Solid silhouettes of four old-growth conifers, in the flat style of national park signage, used on the
// Partnership slide: Ponderosa pine (Partner), sugar pine (Strategic), giant sequoia (Enterprise),
// Douglas fir (Omnidirectional). One flat fill, no outlines, no filters.

export const SPECIES = {
  ponderosa: { name: 'Ponderosa Pine', latin: 'Pinus ponderosa' },
  sugar: { name: 'Sugar Pine', latin: 'Pinus lambertiana' },
  sequoia: { name: 'Giant Sequoia', latin: 'Sequoiadendron giganteum' },
  douglas: { name: 'Douglas Fir', latin: 'Pseudotsuga menziesii' },
};

const f = (n) => n.toFixed(1);

export function conifer(kind, H, seed = 1, fill = '#ff5a24') {
  let r = seed * 7919 + 13;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const jit = (a) => (rnd() - 0.5) * 2 * a;
  const W = { ponderosa: 0.6, sugar: 0.72, sequoia: 0.56, douglas: 0.44 }[kind] * H;
  const cx = W / 2, shapes = [];
  const poly = (pts) => shapes.push(`M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')} Z`);

  // A tapering trunk from yTop to the ground, optionally flared at the base.
  const trunk = (yTop, baseW, topW, flare = 0) => {
    const half = (y) => (topW + (baseW - topW) * Math.pow((y - yTop) / (H - yTop), 1.4)) / 2 + (flare && y > H - flare ? Math.pow((y - (H - flare)) / flare, 2.2) * flare * 0.7 : 0);
    const L = [], R = [];
    for (let i = 0; i <= 24; i++) { const y = yTop + (H - yTop) * i / 24; L.push([cx - half(y), y]); R.unshift([cx + half(y), y]); }
    poly([...L, ...R]);
    return half;
  };
  // A foliage clump: an irregular blob whose edge is broken into needle-like points.
  const clump = (x, y, rx, ry, spikes = 26, rough = 0.22) => {
    const pts = [], p1 = rnd() * 6, p2 = rnd() * 6, n = Math.max(40, spikes * 3);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      // lumpy outline (low-frequency) with a fine ragged edge (high-frequency), like foliage seen from afar
      const k = 1 + rough * 0.55 * Math.sin(3 * a + p1) + rough * 0.35 * Math.sin(7 * a + p2) + (i % 2 ? rough * 0.25 * rnd() : -rough * 0.15 * rnd());
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
    }
    poly(pts);
  };
  // A limb: a thin tapered quad from the trunk out to (x1, y1).
  const limb = (x0, y0, x1, y1, w0, w1 = w0 * 0.35) => {
    const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    poly([[x0 + nx * w0, y0 + ny * w0], [x1 + nx * w1, y1 + ny * w1], [x1 - nx * w1, y1 - ny * w1], [x0 - nx * w0, y0 - ny * w0]]);
  };

  if (kind === 'ponderosa') {
    // Long clear bole; an open, flat-topped, irregular crown in the upper third.
    const half = trunk(H * 0.08, W * 0.13, W * 0.04);
    const pads = [[0, 0.08, 0.2, 0.07], [-0.24, 0.15, 0.17, 0.06], [0.22, 0.13, 0.18, 0.065], [-0.08, 0.2, 0.2, 0.07], [0.12, 0.25, 0.19, 0.06], [-0.3, 0.28, 0.15, 0.05], [0.32, 0.3, 0.14, 0.05], [-0.02, 0.33, 0.16, 0.055], [-0.18, 0.4, 0.12, 0.045], [0.2, 0.42, 0.11, 0.04]];
    for (const [dx, ty, rw, rh] of pads) {
      const x = cx + dx * W, y = H * ty;
      if (Math.abs(dx) > 0.06) limb(cx + Math.sign(dx) * half(y + H * 0.05) * 0.5, y + H * 0.05, x, y + H * 0.01, W * 0.018, W * 0.008);
      clump(x, y, W * rw, H * rh, 24, 0.28);
    }
  } else if (kind === 'sugar') {
    // The tallest pine: straight bole, long horizontal arms with flattened clumps, long cones hanging from the tips.
    const half = trunk(H * 0.06, W * 0.1, W * 0.025);
    const arms = [[0.06, 0.16, -1], [0.1, 0.3, 1], [0.15, 0.46, -1], [0.21, 0.26, 1], [0.27, 0.44, 1], [0.33, 0.34, -1], [0.4, 0.22, -1], [0.45, 0.3, 1], [0.52, 0.14, -1]];
    clump(cx, H * 0.06, W * 0.07, H * 0.03, 18, 0.3);
    for (const [ty, rl, s] of arms) {
      const y = H * ty, reach = W * rl, x1 = cx + s * reach;
      limb(cx, y + 2, x1, y + jit(2), W * 0.016, W * 0.007);
      const n = Math.max(2, Math.round(rl * 9));
      for (let j = 0; j < n; j++) { const u = 0.35 + 0.65 * (j + 0.5) / n; clump(cx + s * reach * u, y - H * 0.012, W * (0.05 + rnd() * 0.02), H * 0.022, 16, 0.32); }
      if (rl > 0.25) for (const o of [0, 1]) { const x = x1 - s * (W * 0.03 + o * W * 0.035), y0 = y + H * 0.01, cl = H * 0.055, cw = W * 0.014; poly([[x, y0], [x + cw, y0 + cl * 0.35], [x + cw * 0.8, y0 + cl * 0.85], [x, y0 + cl], [x - cw * 0.8, y0 + cl * 0.85], [x - cw, y0 + cl * 0.35]]); }
    }
  } else if (kind === 'sequoia') {
    // Massive flared trunk; a dense, rounded-conical crown of lumpy foliage.
    trunk(H * 0.1, W * 0.3, W * 0.08, H * 0.08);
    for (let i = 0; i < 48; i++) {
      const t = i / 47, y = H * (0.04 + 0.56 * t);
      const env = W * 0.4 * Math.min(1, 0.25 + t * 1.3) * (t > 0.85 ? 1 - (t - 0.85) * 2.5 : 1);
      clump(cx + jit(env * 0.8), y, W * (0.09 + rnd() * 0.05) * (0.6 + t * 0.5), H * (0.035 + rnd() * 0.02), 14, 0.22);
    }
  } else {
    // Douglas fir: narrow spire, dense conical crown, layered drooping boughs with ragged tips.
    trunk(H * 0.1, W * 0.1, W * 0.02);
    const R = [], L = [], n = 22, crown = H * 0.9;
    for (let i = 1; i <= n; i++) {
      const t = i / n, y = crown * Math.pow(t, 0.92), st = crown / n;
      for (const [s, arr] of [[1, R], [-1, L]]) {
        const w = (W / 2) * Math.pow(t, 0.78) * (0.85 + rnd() * 0.25), X = (k) => cx + s * k;
        const seg = [[X(w * 0.32), y - st * 0.55], [X(w * 0.7), y - st * 0.05], [X(w * 0.98), y + st * 0.15], [X(w * 1.02), y + st * 0.35], [X(w * 0.86), y + st * 0.3], [X(w * 0.9), y + st * 0.55], [X(w * 0.62), y + st * 0.32]];
        if (s > 0) arr.push(...seg); else arr.unshift(...seg.reverse());
      }
    }
    poly([[cx, 0], ...R, [cx + W * 0.05, crown], [cx - W * 0.05, crown], ...L]);
  }
  // Each piece is its own path with the same fill, so overlaps merge into one solid shape (no winding holes).
  return `<svg width="${f(W)}" height="${f(H)}" viewBox="0 0 ${f(W)} ${f(H)}" overflow="visible"><g fill="${fill}">${shapes.map((d) => `<path d="${d}"/>`).join('')}</g></svg>`;
}
