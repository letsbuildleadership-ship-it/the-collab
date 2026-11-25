// Writes the release notes in content/changelog.json into pages/changelog.html (between the
// changelog markers), so the page reads without JavaScript. js/changelog.js adds any notes the
// owner published since, from the changelog function. Run after editing content/changelog.json:
//   node scripts/build-changelog.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { entries } = JSON.parse(fs.readFileSync(path.join(root, 'content/changelog.json'), 'utf8'));
const esc = (x) => String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = [...entries].sort((a, b) => String(b.date).localeCompare(String(a.date)))
  .map((e) => `        <article class="cl-entry"><p class="cl-meta">${esc(e.date)} · ${esc(e.source)}${e.ip ? ` · ${esc(e.ip)}` : ''}</p><h2>${esc(e.title)}</h2><p>${esc(e.text)}</p></article>`).join('\n');
const file = path.join(root, 'pages/changelog.html');
const page = fs.readFileSync(file, 'utf8');
const start = '<!-- changelog:start (scripts/build-changelog.mjs) -->';
const end = '<!-- changelog:end -->';
const next = `${page.slice(0, page.indexOf(start) + start.length)}\n${html}\n${page.slice(page.indexOf(end))}`;
if (next !== page) fs.writeFileSync(file, next);
console.log(`changelog: ${entries.length} entries`);
