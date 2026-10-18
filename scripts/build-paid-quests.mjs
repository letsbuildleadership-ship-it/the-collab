// Builds guided quests for the paid workbooks (content/quests/<product-key>.json)
// by reading each product PDF's own steps, questions, tick-lists and 1-5
// statements, so the quest asks exactly what the workbook asks.
// Needs `pdftotext` (poppler). Re-run after a workbook PDF changes:
//   node scripts/build-paid-quests.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'content/pricing.json'), 'utf8'));
const KEYS = [
  'strength-map', 'alignment-map', 'build-plan', 'legacy-profile', 'operating-system', 'legacy-map', 'diagnostic', 'blueprint', 'legacy-architecture',
  'creator-identity-map', 'creator-alignment-map', 'creator-venture-build-plan', 'creator-operating-system', 'creative-estate-mapping', 'creator-legacy-architecture',
];
// Fixes for lines the PDF text extraction can't express cleanly.
const DROP = /^(Knowledge, leadership continuity|Clarity, purpose, identity|Strategy, decision-making, accountability|Culture, communication, execution)/;
const RENAME = new Map([
  [/^Your identity is not "I make paintings"/, 'What are you actually doing through your medium? Complete: I use [your medium] to …'],
]);

// The Creator Website Blueprint™ is a manual rather than a workbook, so its quest is written to follow
// the manual's Blueprint, Your First Site and Streamlined Loop™ parts, one phase at a time.
const WEBSITE_QUEST = [
  [0, 'Foundations', 'What is the one sentence your website must say about you and your work?'],
  [0, 'Foundations', 'Who is the one person the site is for first, and what do they need from you?'],
  [0, 'Foundations', 'What is the one action you want a visitor to take?'],
  [1, 'Infrastructure Planning & Management', 'Which pages will the site have, and what does each one do for the visitor?'],
  [1, 'Infrastructure Planning & Management', 'Which tool will you use for each step of the Streamlined Loop™: brief, build, hold, publish and connect?'],
  [1, 'Infrastructure Planning & Management', 'What will you offer or sell on it, and how will people pay or contact you?'],
  [2, 'Internal Operating Systems', 'What is your update loop: how often will you update the site, and what is the first ten-minute update you will do?'],
  [2, 'Internal Operating Systems', 'Which photographs, copy and links will you keep current, and where do you keep them?'],
  [3, 'Preservation', 'Who owns your domain, hosting account and code repository, and where are those logins safely kept?'],
  [3, 'Preservation', 'If you could not touch the site for six months, what would keep it running and who could update it?'],
  [3, 'Preservation', 'What will you write down so someone else could rebuild the site from your notes?'],
];
const PHASE_LABEL = { foundations: 'Phase I · Foundations', 'infrastructure-planning': 'Phase II · Infrastructure Planning & Management', 'operating-systems': 'Phase III · Internal Operating Systems', preservation: 'Phase IV · Preservation' };

const SKIP_SECTIONS = /^(THE CO\.LLAB PRINCIPLE|THE NEXT STEP|YOUR NEXT STEP|HOW TO RESPOND|BUILD FROM STRENGTH|YOUR CO\.LLAB™ INFRASTRUCTURE PROFILE|YOUR INFRASTRUCTURE ROADMAP|THE CO\.LLAB™? OPERATING RHYTHM|YOUR NEXT MOVE|THE LEGACY INFRASTRUCTURE MODEL|THE FINAL OUTPUT)/;
const INSTRUCTION = /^(build from|define|choose|complete|ask yourself|repeat|circle|select|use |check|identify the|note|key question|strengthen|explore)/i;
const titleCase = (s) => s.toLowerCase().replace(/(^|[\s—–-])([a-z])/g, (m, a, b) => a + b.toUpperCase()).replace(/\bIv\b/g, 'IV').replace(/\bIi\b/g, 'II').replace(/\bIii\b/g, 'III').replace(/Co\.llab/g, 'Co.LLab').replace(/\bLlab\b/g, '.LLab').replace(/ And /g, ' and ').replace(/ Of /g, ' of ').replace(/ To /g, ' to ').replace(/ The /g, ' the ');
const PHASE_QUESTION = ['What should never be lost as we grow?', 'What depends on a person that should belong to the organization?', 'How do we make what matters part of how we operate?', 'What must exist for what we built to continue?'];
const phaseOf = (header, fallback) => {
  if (/PHASE IV|PRESERVATION/.test(header)) return 3;
  if (/PHASE III|OPERATING SYSTEMS/.test(header)) return 2;
  if (/PHASE II\b|PLANNING/.test(header)) return 1;
  if (/PHASE I\b|FOUNDATIONS/.test(header)) return 0;
  return fallback;
};

function workbookLines(key) {
  const txt = execFileSync('pdftotext', ['-layout', path.join(root, 'content/library', `${key}.pdf`), '-'], { encoding: 'utf8', maxBuffer: 20e6 });
  const lines = txt.split('\n')
    .map((l) => l.replace(/\s+/g, ' ').replace(/ The Co\.LLab™$/, '').replace(/(PAGE\s*)?\d+ OF \d+/g, '').trim())
    .filter((l) => l && l !== 'The Co.LLab™' && l !== 'PAGE');
  // The workbook starts at the first "The Co.LLab: Building Leadership Infrastructure™" line after the license page.
  const start = lines.findIndex((l) => l === 'The Co.LLab: Building Leadership Infrastructure™');
  const out = [];
  for (const l of lines.slice(start + 1)) {
    if (/^(Explore The Co\.LLab|G L O SS A RY|Glossary Of Terms|APPENDIX A)/.test(l)) break;
    if (/^THE CO\.LLAB™ — /.test(l)) continue;
    out.push(l);
  }
  return out;
}

function parse(key) {
  const lines = workbookLines(key);
  const nodes = [];
  const scaleHint = [];
  let header = '';
  let skipping = false;
  let phase = null;
  let pendingQuestion = null;
  let pick = { min: 1, max: 1 };
  let lastChoose = null;
  let sectionNodeStart = 0;
  let sectionNarrative = [];
  let stemSection = false;

  const isHeader = (l) => /^(STEP \d+|PHASE (I|II|III|IV)\b|WEEK \d|PART [A-Z0-9]+|MODULE \d|PILLAR \d)/.test(l) || (/^[A-Z0-9 &™.\-—–’']+$/.test(l) && /[A-Z]{3}/.test(l) && !/^\d+\.?$/.test(l) && l.length < 70);
  const bullets = (l) => l.replace(/^[^A-Za-z0-9"“]+/, '').trim();

  // join wrapped sentences: a line without terminal punctuation followed by a lowercase-starting line
  const joined = [];
  for (let i = 0; i < lines.length; i += 1) {
    let l = lines[i];
    while (i + 1 < lines.length && !/[?:.!↓™]$/.test(l) && !isHeader(l) && /^[a-z]/.test(lines[i + 1]) && !/^☐/.test(l) && l.length > 30) { l = `${l} ${lines[i + 1]}`; i += 1; }
    joined.push(l);
  }

  const push = (n) => {
    const pm = /^(FOUNDATIONS|INFRASTRUCTURE PLANNING & MANAGEMENT|INTERNAL OPERATING SYSTEMS|PRESERVATION) — /.exec(n.prompt || '');
    if (/^Offer \/ Price/.test(n.prompt || '') || DROP.test(n.prompt || '')) return {};
    for (const [re, to] of RENAME) if (re.test(n.prompt || '')) n = { ...n, prompt: to };
    nodes.push({ id: `n${nodes.length + 1}`, section: titleCase(header), phase: pm ? phaseOf(pm[1], phase) : phase, ...n });
    return nodes[nodes.length - 1];
  };
  const closeSection = (nextHeader = '') => {
    if (/^(PHASE|FOUNDATIONS|INFRASTRUCTURE|INTERNAL|PRESERVATION)/.test(nextHeader)) { sectionNarrative = []; return; }
    // a section that asked for something in plain sentences (no "?" or ":" prompt) still becomes one prompt
    if (header && !skipping && !stemSection && nodes.length === sectionNodeStart && sectionNarrative.length) {
      const text = sectionNarrative.join(' ').replace(/\s+/g, ' ');
      const sentences = text.match(/[^.?!]+[.?!]+/g) || [text];
      push({ type: 'text', prompt: sentences.slice(0, 2).join(' ').trim().slice(0, 260) });
    }
    sectionNarrative = [];
  };

  for (let i = 0; i < joined.length; i += 1) {
    const l = joined[i];
    const next = joined[i + 1] || '';
    if (/^\d — /.test(l)) { scaleHint.push(l.replace(' — ', ' = ')); continue; }

    if (isHeader(l) && !/^[A-Z]$/.test(l)) {
      closeSection(l);
      header = l;
      skipping = SKIP_SECTIONS.test(l);
      stemSection = /STATEMENT|COMMITMENT/.test(l);
      phase = phaseOf(l, null);
      pendingQuestion = null;
      lastChoose = null;
      sectionNodeStart = nodes.length;
      continue;
    }
    if (skipping || l === '↓' || l === '.' || /^\d+\.$/.test(l)) continue;

    const scale = l.match(/^\s*(\d+)\.\s+(.+?)\s+1 2 3 4 5$/);
    if (scale) { push({ type: 'scale', prompt: scale[2], min: 1, max: 5 }); continue; }
    if (/^\d+\.\s+.+/.test(l) && /^1 2 3 4 5$/.test(next)) { push({ type: 'scale', prompt: l.replace(/^\d+\.\s+/, ''), min: 1, max: 5 }); i += 1; continue; }
    if (/^1 2 3 4 5$/.test(l)) continue;

    if (l.startsWith('☐')) {
      const opt = l.replace(/^☐\s*/, '').trim();
      if (/^Other:?$/i.test(opt)) continue;
      if (!lastChoose) lastChoose = push({ type: 'choose', prompt: pendingQuestion || 'Choose what fits', options: [], pickMin: pick.min, pickMax: pick.max });
      lastChoose.options.push(opt);
      continue;
    }
    lastChoose = null;

    // "Explore:" / "Build from:" tick-lists become a coverage question: which of these exist today?
    if (/^(Explore|Build from):?$/i.test(l)) {
      const options = [];
      let j = i + 1;
      while (j < joined.length && !isHeader(joined[j]) && !/[:.?!]$/.test(joined[j]) && joined[j].length <= 45 && !/^(Define|Strengthen)/.test(joined[j])) { options.push(bullets(joined[j])); j += 1; }
      if (options.length >= 3) push({ type: 'choose', coverage: true, prompt: 'Which of these are already in place in your organization today?', options, pickMin: 0, pickMax: options.length });
      i = j - 1;
      continue;
    }
    if (/^Key question:?$/i.test(l)) {
      const hasQ = /\?$/.test(next);
      if (!hasQ && phase !== null) push({ type: 'text', prompt: PHASE_QUESTION[phase] });
      continue;
    }

    const choose = l.match(/^Choose (\d+)[–-](\d+):?$/i);
    if (choose) { pick = { min: Number(choose[1]), max: Number(choose[2]) }; continue; }
    if (/^Choose one:?$/i.test(l)) { pick = { min: 1, max: 1 }; continue; }
    if (/^Complete( this| each section)?:?$/i.test(l)) continue;
    if (INSTRUCTION.test(l) && l.length < 60 && /[:.]$/.test(l)) continue;

    if (/^Strengthen:/.test(l)) continue;

    const startsChoice = () => { let j = i + 1; while (joined[j] && /^(Choose|☐)/.test(joined[j]) && !joined[j].startsWith('☐')) j += 1; return joined[j] && joined[j].startsWith('☐'); };

    if (/\?$/.test(l)) {
      pendingQuestion = l;
      if (startsChoice()) continue;
      push({ type: 'text', prompt: l });
      continue;
    }
    if (/:$/.test(l) && l.length < 160) {
      pendingQuestion = l;
      if (startsChoice()) continue;
      push({ type: 'text', prompt: l });
      continue;
    }
    // sentence stems in "statement" / "commitment" sections: "I create / for / because" is one sentence
    if (stemSection && !/[.!?]$/.test(l) && l.length < 80) {
      const prev = nodes[nodes.length - 1];
      if (/^[a-z]/.test(l) && l.split(' ').length <= 4 && prev && prev.stem && nodes.length > sectionNodeStart) prev.prompt = `${prev.prompt.replace(/ …$/, '')} … ${l} …`;
      else push({ type: 'text', stem: true, prompt: `${l} …` });
      continue;
    }
    if (next === '.') { push({ type: 'text', prompt: `${l} …` }); continue; }
    if (header && /\.$/.test(l)) sectionNarrative.push(l);
  }
  closeSection();
  nodes.forEach((n) => delete n.stem);
  return { nodes, scaleHint };
}

const outDir = path.join(root, 'content/quests');
{
  const entry = pricing.products.find((p) => p.key === 'creator-website-blueprint');
  const nodes = WEBSITE_QUEST.map(([phase, section, prompt], i) => ({ id: `n${i + 1}`, section: `Phase ${['I', 'II', 'III', 'IV'][phase]} — ${section}`, phase, type: 'text', prompt }));
  const quest = {
    key: entry.key, title: entry.name, phase: PHASE_LABEL[entry.phase_key], archetype: 'workbook',
    intro: 'Plan your creator website one phase at a time, so it is built to keep working and to be carried forward.',
    pdfTitle: entry.name, minAnswered: 0.6, upsell: null, nodes,
    closing: { id: 'commit', type: 'text', prompt: 'The one change we will make next, who will own it, and by when:' },
  };
  fs.writeFileSync(path.join(outDir, `${entry.key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
}
let n = 0;
for (const key of KEYS) {
  const entry = pricing.products.find((p) => p.key === key);
  const { nodes, scaleHint } = parse(key);
  const textNodes = nodes.filter((x) => x.type === 'text');
  const quest = {
    key,
    title: entry.name,
    phase: PHASE_LABEL[entry.phase_key] || entry.phase_key,
    archetype: 'workbook',
    intro: entry.description || `Work through ${entry.name} step by step.`,
    pdfTitle: entry.name,
    minAnswered: 0.6,
    upsell: null,
    ...(scaleHint.length ? { scaleHint: scaleHint.join('  ·  ') } : {}),
    nodes,
    closing: { id: 'commit', type: 'text', prompt: 'The one change we will make next, who will own it, and by when:' },
  };
  fs.writeFileSync(path.join(outDir, `${key}.json`), `${JSON.stringify(quest, null, 2)}\n`);
  console.log(key.padEnd(30), String(nodes.length).padStart(3), 'nodes', `(text ${textNodes.length}, choose ${nodes.filter((x) => x.type === 'choose').length}, scale ${nodes.filter((x) => x.type === 'scale').length})`);
  n += 1;
}
console.log(`built ${n} workbook quests`);
