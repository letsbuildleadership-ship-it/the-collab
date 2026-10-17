// Bulk intake: drop any number of JPG/PNG photos in photos/inbox/ and run  npm run photos
// Each is baked into the site duotone, resized, registered in assets/img/editorial/manifest.json,
// and the Lookbook page is rebuilt. Originals move to photos/done/ (not published, not committed).
// Optional filename hints:  p2-anything.jpg  -> phase 2     (p1..p4)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inbox = path.join(root, 'photos/inbox'), done = path.join(root, 'photos/done');
fs.mkdirSync(inbox, { recursive: true }); fs.mkdirSync(done, { recursive: true });
const mf = path.join(root, 'assets/img/editorial/manifest.json');
const have = () => new Set((fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : []).map((m) => m.slug));
const files = fs.readdirSync(inbox).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
const skipped = fs.readdirSync(inbox).filter((f) => /\.(heic|heif)$/i.test(f));
if (skipped.length) console.log('Convert to JPG first (HEIC not supported):', skipped.join(', '));
if (!files.length) { console.log('No photos in photos/inbox/ — drop JPGs there and run again.'); process.exit(0); }

for (const f of files) {
  const phase = (f.match(/^p([1-4])[-_]/i) || [])[1];
  let slug = f.replace(/\.[^.]+$/, '').replace(/^p[1-4][-_]/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';
  const taken = have(); let base = slug, n = 2; while (taken.has(slug)) slug = `${base}-${n++}`;
  const args = ['scripts/add-photo.mjs', path.join(inbox, f), slug, ...(phase ? ['--phase', phase] : [])];
  const r = spawnSync('node', args, { cwd: root, stdio: 'inherit' });
  if (r.status === 0) fs.renameSync(path.join(inbox, f), path.join(done, f));
}
spawnSync('node', ['scripts/build-gallery.mjs'], { cwd: root, stdio: 'inherit' });
const missing = JSON.parse(fs.readFileSync(mf, 'utf8')).filter((m) => !m.alt).map((m) => m.slug);
if (missing.length) console.log('Add alt text (accessibility/SEO) in assets/img/editorial/manifest.json for:', missing.join(', '));
