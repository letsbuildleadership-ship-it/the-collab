// Adds a photograph to the site's editorial library: crops, optionally blurs third-party marks, bakes the
// site's green-and-cream duotone, resizes, and registers it in assets/img/editorial/manifest.json.
//
//   node scripts/add-photo.mjs <file> <slug> [--phase 1-4] [--alt "…"] [--focus "50% 40%"]
//        [--crop x,y,w,h] [--blur "x,y,w,h;x,y,w,h"] [--width 2000] [--keep-color] [--note "…"]
//
// crop/blur rectangles are in source-image pixels (blur is applied before the crop).
// Use the photo in a page with <figure class="lookbook"> or a .tile (see docs/marketing-strategy.md §7),
// and in an ad by adding its slug to ADS in scripts/build-ads.mjs.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'assets/img/editorial');
const argv = process.argv.slice(2);
const flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) { const k = argv[i].slice(2); flags[k] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true; }
  else pos.push(argv[i]);
}
const [src, slug] = pos;
if (!src || !slug) { console.error('usage: node scripts/add-photo.mjs <file> <slug> [--phase 1-4] [--alt "…"] [--focus "50% 40%"] [--crop x,y,w,h] [--blur "x,y,w,h;…"] [--width 2000] [--keep-color] [--note "…"]'); process.exit(1); }
const nums = (s) => s.split(',').map(Number);
const input = {
  dataUrl: 'data:image/jpeg;base64,' + fs.readFileSync(src).toString('base64'),
  crop: flags.crop ? nums(flags.crop) : null,
  blur: flags.blur ? String(flags.blur).split(';').map(nums) : [],
  width: Number(flags.width) || 2000,
  duo: !flags['keep-color'],
};

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async (o) => {
  const img = new Image(); img.src = o.dataUrl; await img.decode();
  const A = document.createElement('canvas'); A.width = img.naturalWidth; A.height = img.naturalHeight;
  const a = A.getContext('2d'); a.drawImage(img, 0, 0);
  for (const [x, y, w, h] of o.blur) {            // soften third-party marks (feathered)
    const px = Math.max(10, Math.round(Math.min(w, h) / 6));
    const T = document.createElement('canvas'); T.width = w; T.height = h;
    const t = T.getContext('2d'); t.filter = `blur(${px}px)`; t.drawImage(A, x, y, w, h, 0, 0, w, h);
    a.save(); a.beginPath(); a.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); a.clip();
    a.drawImage(T, x, y); a.restore();
  }
  const [cx, cy, cw, ch] = o.crop || [0, 0, A.width, A.height];
  const scale = Math.min(1, o.width / cw);
  const B = document.createElement('canvas'); B.width = Math.round(cw * scale); B.height = Math.round(ch * scale);
  const b = B.getContext('2d'); b.imageSmoothingQuality = 'high'; b.drawImage(A, cx, cy, cw, ch, 0, 0, B.width, B.height);
  if (o.duo) {
    const d = b.getImageData(0, 0, B.width, B.height), p = d.data, n = B.width * B.height, hist = new Uint32Array(256), L = new Uint8Array(n);
    for (let i = 0; i < n; i++) { const v = Math.round(0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2]); L[i] = v; hist[v]++; }
    const cut = n * 0.01; let lo = 0, hi = 255, s = 0;
    for (let v = 0; v < 256; v++) { s += hist[v]; if (s > cut) { lo = v; break; } }
    s = 0; for (let v = 255; v >= 0; v--) { s += hist[v]; if (s > cut) { hi = v; break; } }
    const K = [[10, 22, 14], [118, 120, 96], [247, 230, 200]], mid = 118 / 255;
    for (let i = 0; i < n; i++) {
      const t = Math.min(1, Math.max(0, (L[i] - lo) / Math.max(1, hi - lo)));
      const [c0, c1, f] = t < mid ? [K[0], K[1], t / mid] : [K[1], K[2], (t - mid) / (1 - mid)];
      for (let c = 0; c < 3; c++) p[i * 4 + c] = Math.round(c0[c] + (c1[c] - c0[c]) * f);
    }
    b.putImageData(d, 0, 0);
  }
  return { url: B.toDataURL('image/jpeg', 0.8), w: B.width, h: B.height };
}, input);
await browser.close();

fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, `${slug}.jpg`), Buffer.from(out.url.split(',')[1], 'base64'));
const mf = path.join(dir, 'manifest.json');
const manifest = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : [];
const entry = { slug, file: `${slug}.jpg`, width: out.w, height: out.h, phase: flags.phase ? Number(flags.phase) : null, focus: flags.focus || '50% 50%', alt: flags.alt || '', note: flags.note || '' };
const i = manifest.findIndex((m) => m.slug === slug);
if (i >= 0) manifest[i] = entry; else manifest.push(entry);
fs.writeFileSync(mf, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote assets/img/editorial/${slug}.jpg (${out.w}x${out.h}, ${(fs.statSync(path.join(dir, slug + '.jpg')).size / 1024) | 0} KB)`);
