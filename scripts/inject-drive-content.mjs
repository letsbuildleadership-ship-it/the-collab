// Replaces the hand-authored contentHtml in each ladder-product doc module
// with the real content converted from the business owner's actual .docx
// files in Google Drive (via convert-drive-docx.py). Keeps each module's
// `meta` (cover copy, price, phase) exactly as-is — only the interior
// content changes, from authored-by-Claude to sourced-from-Drive.
import fs from 'node:fs';
import path from 'node:path';

const map = {
  'strength-map': 'strength-map.html',
  'alignment-map': 'alignment-map.html',
  'build-plan': 'build-plan.html',
  'legacy-profile': 'legacy-profile.html',
  'operating-system': 'operating-system.html',
  'legacy-map': 'legacy-map.html',
  'diagnostic': 'diagnostic.html',
  'blueprint': 'blueprint.html',
  'legacy-architecture': 'legacy-architecture.html',
};

const docsDir = path.join(import.meta.dirname, 'pdf-src', 'docs');
const htmlDir = '/tmp/drive-html';

for (const [key, htmlFile] of Object.entries(map)) {
  const modPath = path.join(docsDir, `${key}.mjs`);
  const src = fs.readFileSync(modPath, 'utf8');
  const metaMatch = src.match(/export const meta = \{[\s\S]*?\n\};/);
  if (!metaMatch) throw new Error(`Could not find meta block in ${modPath}`);
  const metaBlock = metaMatch[0];

  const fragment = fs.readFileSync(path.join(htmlDir, htmlFile), 'utf8');
  const newContent = `export const contentHtml = \`\n<section class="page">\n${fragment}\n</section>\n\`;\n`;

  const newSrc = `${metaBlock}\n\n${newContent}`;
  fs.writeFileSync(modPath, newSrc);
  console.log(`✓ ${key}.mjs updated from ${htmlFile}`);
}
