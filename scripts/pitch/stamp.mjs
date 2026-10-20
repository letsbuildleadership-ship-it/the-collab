// Records which inputs the pitch and deck were last built from. `npm test` fails if the inputs have changed
// since (a price, product, term or the pitch templates), and the "Rebuild pitch" workflow fixes it automatically.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const list = (d) => fs.readdirSync(path.join(root, d)).filter((n) => fs.statSync(path.join(root, d, n)).isFile()).sort().map((n) => `${d}/${n}`);
export const INPUTS = ['content/pricing.json', 'content/free-tools.json', 'scripts/pdf-src/render.mjs', 'scripts/pdf-src/base.css', ...list('scripts/pitch'), ...list('scripts/pitch/assets')]
  .filter((f) => f !== 'scripts/pitch/stamp.mjs');
export const sourceHash = () => {
  const h = crypto.createHash('sha256');
  for (const f of INPUTS) { h.update(f); h.update(fs.readFileSync(path.join(root, f))); }
  return h.digest('hex');
};
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  fs.writeFileSync(path.join(root, 'assets/pitch/source.sha'), `${sourceHash()}\n`);
  console.log('pitch source stamp written');
}
