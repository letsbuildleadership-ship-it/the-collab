// Turns each free-tool PDF's source data into an interactive quest
// (content/quests/<key>.json). The questions, scales and result bands are the
// PDF's own text — captured while the docs render — so the two never drift.
// Run after changing a free-tool doc: node scripts/build-quests.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = path.join(root, 'scripts/pdf-src/docs');
const tools = JSON.parse(fs.readFileSync(path.join(root, 'content/free-tools.json'), 'utf8')).tools;
const outDir = path.join(root, 'content/quests');
fs.mkdirSync(outDir, { recursive: true });

const plain = (s) => String(s || '').replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const upsellOf = (u) => (u ? { name: u.name, price: u.price, copy: plain(u.copy) } : null);

let built = 0;
for (const tool of tools) {
  const base = path.basename(tool.file, '.pdf');
  const file = path.join(docsDir, `${base}.mjs`);
  if (!fs.existsSync(file)) { console.warn('no source for', base); continue; }
  globalThis.__questData = null;
  await import(pathToFileURL(file).href);
  const d = globalThis.__questData;
  if (!d) { console.warn('not an archetype doc:', base); continue; }

  const quest = {
    key: tool.key,
    title: tool.name,
    phase: tool.phase,
    archetype: d.archetype,
    intro: plain(d.intro),
    pdfTitle: tool.name,
    upsell: upsellOf(d.upsell),
  };
  if (d.archetype === 'checklist') {
    quest.nodes = d.items.map((t, i) => ({ id: `n${i + 1}`, type: 'check', prompt: plain(t) }));
    quest.bands = d.bands.map((b) => ({ label: b.label, copy: plain(b.copy) }));
    quest.closing = { id: 'commit', type: 'text', prompt: plain(d.commitPrompt) };
  } else if (d.archetype === 'snapshot') {
    quest.nodes = d.dimensions.map((x, i) => ({ id: `n${i + 1}`, type: 'scale', label: plain(x.label), prompt: plain(x.body), min: 1, max: 5 }));
    quest.bands = d.bands.map((b) => ({ label: b.label, copy: plain(b.copy) }));
    quest.closing = { id: 'reflect', type: 'text', prompt: plain(d.reflectPrompt) };
  } else if (d.archetype === 'worksheet') {
    quest.nodes = d.prompts.map((p, i) => ({ id: `n${i + 1}`, type: 'text', label: plain(p.kicker), prompt: plain(p.prompt) }));
    quest.closing = { id: 'synthesis', type: 'text', prompt: plain(d.synthesisPrompt) };
  } else if (d.archetype === 'starter') {
    quest.nodes = d.steps.map((s, i) => ({ id: `n${i + 1}`, type: 'text', label: plain(s.label), prompt: plain(s.body) }));
    quest.closing = { id: 'commit', type: 'text', prompt: plain(d.closingPrompt) };
  }
  fs.writeFileSync(path.join(outDir, `${tool.key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
  built += 1;
}
console.log(`built ${built} quests`);
