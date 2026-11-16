// Quest engine: validates a member's answers and turns them into an outcome —
// what's working, what to build next, and one next move — in collaborative
// language. Questions and result bands come from content/quests/*.json, which
// scripts/build-quests.mjs derives from the free-tool PDFs.
const fs = require('fs');
const { analyze, phaseIndexOfText, phaseIndexOfQuest } = require('./quest-analysis');
const path = require('path');

// content/quests ships via netlify.toml `included_files`; where it lands differs between
// the repo (lib/ is three levels deep) and the bundled function (one file in netlify/functions),
// so try each known location, like lib/pdf-path.js does for PDFs.
const dir = [
  path.join(__dirname, '../../../content/quests'),
  path.join(__dirname, '../../content/quests'),
  path.join(process.cwd(), 'content/quests'),
  process.env.LAMBDA_TASK_ROOT ? path.join(process.env.LAMBDA_TASK_ROOT, 'content/quests') : null,
].filter(Boolean).find((d) => fs.existsSync(d));
const quests = new Map();
if (!dir) console.error('quests: content/quests not found; quests are unavailable');
for (const f of dir ? fs.readdirSync(dir).filter((n) => n.endsWith('.json') && !n.startsWith('_')) : []) {
  const q = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  quests.set(q.key, q);
}

// Revisions from the owner's IP review (content/quests/_revisions.json) are layered over the
// generated quests here, so rebuilding a quest from its workbook never loses them.
function applyRevisions(q, rev) {
  const nodes = q.nodes.map((n) => ({ ...n }));
  const fallback = phaseIndexOfQuest(q);
  const pin = (n) => (Number.isInteger(n.phase) ? n.phase : phaseIndexOfText(`${n.section || ''} ${n.label || ''} ${n.prompt}`, fallback));
  const byId = (id) => nodes.find((n) => n.id === id);
  Object.entries(rev.replace || {}).forEach(([id, prompt]) => { const n = byId(id); if (n) { n.phase = pin(n); n.prompt = prompt; } });
  Object.entries(rev.guide || {}).forEach(([id, prompt]) => {
    const n = byId(id);
    if (!n) return;
    n.phase = pin(n);
    n.label = n.label || n.prompt.replace(/:\s*$/, '').trim();
    n.prompt = prompt;
  });
  (rev.drop || []).forEach((id) => { const i = nodes.findIndex((n) => n.id === id); if (i >= 0) nodes.splice(i, 1); });
  Object.entries(rev.split || {}).forEach(([id, parts]) => {
    const i = nodes.findIndex((n) => n.id === id);
    if (i < 0) return;
    const n = nodes[i];
    n.phase = pin(n);
    n.prompt = parts[0];
    nodes.splice(i + 1, 0, ...parts.slice(1).map((p, k) => ({ id: `${id}${'bcdefg'[k]}`, section: n.section, phase: n.phase, type: 'text', prompt: p })));
  });
  (rev.add || []).forEach((a, k) => {
    const item = Array.isArray(a) ? { phase: a[0], prompt: a[1] } : a;
    const anchor = item.after && item.after !== 'LAST_IN_SECTION' ? byId(item.after) : null;
    const section = item.section || (anchor && anchor.section) || rev.section || 'Carry It Through The IV Phases™';
    const node = { id: `r${k + 1}`, section, phase: item.phase, type: 'text', prompt: item.prompt };
    let at = nodes.length;
    if (anchor) at = nodes.indexOf(anchor) + 1;
    else if (item.before) at = Math.max(0, nodes.findIndex((n) => n.id === item.before));
    else {
      const last = nodes.map((n) => n.section).lastIndexOf(section);
      if (last >= 0) at = last + 1;
    }
    nodes.splice(at, 0, node);
  });
  const out = { ...q, nodes };
  if (Array.isArray(rev.shortPath)) {
    const ids = new Set(nodes.map((n) => n.id));
    out.shortPath = rev.shortPath.filter((id) => ids.has(id));
  }
  return out;
}
const revFile = dir ? path.join(dir, '_revisions.json') : null;
const revisions = revFile && fs.existsSync(revFile) ? JSON.parse(fs.readFileSync(revFile, 'utf8')).quests || {} : {};
Object.entries(revisions).forEach(([key, rev]) => { if (quests.has(key)) quests.set(key, applyRevisions(quests.get(key), rev)); });

// Industry editions (content/quests/_editions.json): the same quest and steps, in an audience's language.
const edFile = dir ? path.join(dir, '_editions.json') : null;
const editions = edFile && fs.existsSync(edFile) ? JSON.parse(fs.readFileSync(edFile, 'utf8')) : {};
function editionsFor(key) {
  const e = editions[key];
  return e ? Object.entries(e).map(([id, v]) => ({ id, name: v.name, serves: v.serves })) : [];
}
function withEdition(q, edition) {
  const e = editions[q.key] && editions[q.key][edition];
  if (!e) return q;
  return { ...q, edition, editionName: e.name, intro: e.intro || q.intro, nodes: q.nodes.map((n) => (e.prompts[n.id] ? { ...n, prompt: e.prompts[n.id] } : n)) };
}

const MAX_TEXT = 1000;

// Every quest ends by looking outward: an Omnidirectional Enterprise™ moves value in every direction.
const OMNI = {
  id: 'omni',
  type: 'text',
  optional: true,
  label: 'Beyond your own walls',
  prompt: 'Who outside your organization (companies, people, creators, communities) could carry, use or be strengthened by this work, and how would value move between you?',
};

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

function publicQuest(base, edition) {
  const q = withEdition(base, edition);
  const { key, title, phase, archetype, intro, nodes, closing, upsell, minAnswered, scaleHint, shortPath } = q;
  return { key, title, phase, archetype, intro, nodes, closing, omni: OMNI, upsell, minAnswered, scaleHint, shortPath, editions: editionsFor(key), edition: q.edition || null };
}

/** @returns {{ ok: true, answers: object } | { ok: false, error: string }} */
function validateAnswers(q, raw, { complete }) {
  const answers = {};
  const input = raw && typeof raw === 'object' ? raw : {};
  let answeredNodes = 0;
  for (const node of [...q.nodes, q.closing, OMNI]) {
    const v = input[node.id];
    const missing = v === undefined || v === null || v === '' || (Array.isArray(v) && node.type !== 'choose');
    if (missing) continue;
    if (node.type === 'check') {
      if (typeof v !== 'boolean') return { ok: false, error: 'Invalid answer.' };
      answers[node.id] = v;
    } else if (node.type === 'scale') {
      if (!Number.isInteger(v) || v < node.min || v > node.max) return { ok: false, error: 'Invalid score.' };
      answers[node.id] = v;
    } else if (node.type === 'choose') {
      if (!Array.isArray(v) || v.length > 40 || v.some((o) => typeof o !== 'string' || !node.options.includes(o))) return { ok: false, error: 'Invalid choice.' };
      const picks = [...new Set(v)];
      if (complete && !node.coverage && (picks.length < node.pickMin || picks.length > node.pickMax)) return { ok: false, error: `Please choose ${node.pickMin === node.pickMax ? node.pickMin : `${node.pickMin} to ${node.pickMax}`}.` };
      answers[node.id] = picks;
    } else {
      if (typeof v !== 'string') return { ok: false, error: 'Invalid answer.' };
      const t = clean(v).slice(0, MAX_TEXT);
      if (t) answers[node.id] = t;
    }
    if (node !== q.closing && node !== OMNI && answers[node.id] !== undefined) answeredNodes += 1;
  }
  if (complete) {
    const required = Math.ceil((q.minAnswered || 1) * q.nodes.length);
    const shortDone = Array.isArray(q.shortPath) && q.shortPath.length > 0 && q.shortPath.every((id) => answers[id] !== undefined);
    if ((answeredNodes < required && !shortDone) || answers[q.closing.id] === undefined) return { ok: false, error: required === q.nodes.length ? 'Please answer every step before finishing.' : `Please answer at least ${required} steps and your commitment before finishing.` };
  }
  return { ok: true, answers };
}

/** Optional "dig deeper" notes, keyed by node id. */
function cleanNotes(q, raw) {
  const notes = {};
  const input = raw && typeof raw === 'object' ? raw : {};
  for (const node of q.nodes) {
    if (typeof input[node.id] === 'string') {
      const t = clean(input[node.id]).slice(0, 300);
      if (t) notes[node.id] = t;
    }
  }
  return notes;
}

function bandFor(q, score) {
  for (const b of q.bands || []) {
    const m = String(b.label).match(/(\d+)\s*[–-]\s*(\d+)/);
    if (m && score >= Number(m[1]) && score <= Number(m[2])) return b;
  }
  return null;
}

function outcomeFor(q, answers) {
  const a = analyze(q, answers);
  const band = bandFor(q, a.score);
  const summary = band
    ? band.copy
    : a.summary || 'You finished the whole quest, and the words are yours. The next step is to put them to work with the people you lead.';
  return {
    score: a.score,
    max: a.max,
    bandLabel: band ? band.label : null,
    summary,
    legacyRead: a.legacyRead,
    phaseMap: a.phaseMap,
    strengths: a.strengths,
    improvements: a.improvements,
    commitment: answers[q.closing.id] || '',
    omni: a.omni,
    nextMove: q.upsell ? `${q.upsell.name} (${q.upsell.price}) ${lowerFirst(q.upsell.copy)}` : '',
  };
}

// The Infrastructure Snapshot™ a free member gets on a free tool: where they stand and one thing that is working.
// The Infrastructure Analysis™ (the build list, the phase and Omnidirectional reads, the report) is Membership.
function previewFor(o) {
  return {
    score: o.score,
    max: o.max,
    bandLabel: o.bandLabel,
    summary: o.summary,
    working: o.strengths.length,
    toBuild: o.improvements.length,
    oneStrength: o.strengths[0] || '',
  };
}

module.exports = { quests, publicQuest, withEdition, editionsFor, validateAnswers, cleanNotes, outcomeFor, previewFor };
