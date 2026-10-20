// Writes the Stripe price ids and Payment Links returned by admin-setup-stripe-products into
// content/pricing.json and clears each product's stripe_pending flag, then rebuilds what shows them.
//   node scripts/apply-stripe-links.mjs links.json      (the JSON can be the whole response or just its "results" array)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = process.argv[2];
if (!file) { console.error('usage: node scripts/apply-stripe-links.mjs links.json'); process.exit(1); }
const input = JSON.parse(fs.readFileSync(file, 'utf8'));
const results = Array.isArray(input) ? input : input.results;
const pricingPath = path.join(root, 'content/pricing.json');
const reg = JSON.parse(fs.readFileSync(pricingPath, 'utf8'));
let applied = 0;
for (const r of results) {
  if (!r.stripe_price_id || !/^https:\/\/buy\.stripe\.com\//.test(r.payment_link || '')) { console.warn(`skipped ${r.key}: ${r.status || 'no link'}`); continue; }
  const p = reg.products.find((x) => x.key === r.key);
  if (!p) { console.warn(`skipped ${r.key}: not in pricing.json`); continue; }
  p.stripe_price_id = r.stripe_price_id; p.payment_link = r.payment_link; delete p.stripe_pending; applied++;
}
fs.writeFileSync(pricingPath, JSON.stringify(reg, null, 2) + '\n');
console.log(`applied ${applied} of ${results.length}`);
for (const s of ['build-hub.mjs', 'build-partnership-page.mjs']) execFileSync('node', [path.join(root, 'scripts', s)], { stdio: 'inherit' });
execFileSync('npm', ['run', 'pitch'], { stdio: 'inherit', cwd: root });
