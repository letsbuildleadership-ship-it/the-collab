// Quest engine: validates a member's answers and turns them into an outcome —
// what's working, what to build next, and one next move — in collaborative
// language. Questions and result bands come from content/quests/*.json, which
// scripts/build-quests.mjs derives from the free-tool PDFs.
const fs = require('fs');
const { analyze, phaseIndexOfText, phaseIndexOfQuest, PHASES } = require('./quest-analysis');
const path = require('path');
const phaseOverlay = require('../../../content/quest-phases.json').quests;

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
const PHASE_SECTION = PHASES.map((p, i) => `The IV Phases™ · ${['I', 'II', 'III', 'IV'][i]} · ${p}`);

// The IV Phases™ integration (content/quest-phases.json): clearer wording, the phase each
// prompt belongs to, new prompts written for this IP in the phases it was missing, a short
// path on long quests, and a four-phase build guide. Applied here, not in the base files,
// so rebuilding a quest from its PDF never loses it and saved answers keep their ids.
// Added prompts are numbered iv1, iv2, … in the order they are listed (append only).
function applyPhases(q, o) {
  if (!o) return q;
  const base = phaseIndexOfQuest(q);
  const drop = new Set(o.drop || []);
  const nodes = q.nodes.filter((n) => !drop.has(n.id)).map((n) => {
    const m = { ...n };
    if (o.fix && o.fix[n.id]) {
      if (!Number.isInteger(m.phase)) m.phase = phaseIndexOfText(`${n.section || ''} ${n.label || ''} ${n.prompt}`, base);
      m.prompt = o.fix[n.id];
    }
    if (o.pin && Number.isInteger(o.pin[n.id])) m.phase = o.pin[n.id];
    return m;
  });
  const extend = [];
  const tail = [];
  (o.add || []).forEach((a, i) => {
    const node = { id: `iv${i + 1}`, type: 'text', phase: a.phase, prompt: a.prompt };
    if (q.archetype !== 'workbook') { extend.push({ ...node, optional: true, label: PHASE_SECTION[a.phase] }); return; }
    const at = a.after ? nodes.findIndex((n) => n.id === a.after) : -1;
    if (at >= 0) nodes.splice(at + 1, 0, { ...node, section: nodes[at].section });
    else tail.push({ ...node, section: PHASE_SECTION[a.phase] });
  });
  tail.sort((x, y) => x.phase - y.phase).forEach((n) => nodes.push(n));
  const ids = new Set(nodes.map((n) => n.id));
  const shortPath = (o.shortPath || []).filter((id) => ids.has(id));
  return { ...q, nodes, extend, shortPath: shortPath.length ? shortPath : undefined, guide: o.guide || null };
}

/** An industry edition: the same quest in another sector's language. Access follows the original. */
function editionOf(q, e) {
  const swap = (t) => e.replace.reduce((s, [from, to]) => s.split(from).join(to), String(t || ''));
  return { ...q, key: e.key, title: e.title, intro: e.intro, direction: e.direction, editionOf: q.key, nodes: q.nodes.map((n) => ({ ...n, prompt: swap(n.prompt) })), closing: { ...q.closing, prompt: swap(q.closing.prompt) } };
}

for (const f of dir ? fs.readdirSync(dir).filter((n) => n.endsWith('.json')) : []) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const q = applyPhases(raw, phaseOverlay[raw.key]);
  quests.set(q.key, q);
  ((phaseOverlay[raw.key] || {}).editions || []).forEach((e) => quests.set(e.key, editionOf(q, e)));
}

const MAX_TEXT = 1000;

// Every quest ends by looking outward: an Omnidirectional Enterprise™ moves value in every direction.
const OMNI = {
  id: 'omni',
  type: 'text',
  optional: true,
  label: 'Beyond your own walls',
  prompt: 'Who outside your organization (enterprises, people, creators, communities) could carry, use or be strengthened by this work, and how would value move between you?',
};

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

function publicQuest(q) {
  const { key, title, phase, archetype, intro, nodes, closing, upsell, minAnswered, scaleHint, extend, shortPath, guide, editionOf: edition, direction } = q;
  return { key, title, phase, archetype, intro, nodes, closing, omni: OMNI, upsell, minAnswered, scaleHint, extend: extend || [], shortPath: shortPath || null, guide: guide || null, editionOf: edition || null, direction: direction || null };
}

/** The steps a member works on the chosen path: the short path on a long quest, or every step. */
function pathNodes(q, p) {
  if (p === 'short' && q.shortPath) { const s = new Set(q.shortPath); return q.nodes.filter((n) => s.has(n.id)); }
  return q.nodes;
}
const pathOf = (q, p) => (p === 'short' && q.shortPath ? 'short' : 'full');

/** @returns {{ ok: true, answers: object } | { ok: false, error: string }} */
function validateAnswers(q, raw, { complete, path: p } = {}) {
  const answers = {};
  const input = raw && typeof raw === 'object' ? raw : {};
  let answeredNodes = 0;
  const onPath = new Set(pathNodes(q, p).map((n) => n.id));
  for (const node of [...q.nodes, ...(q.extend || []), q.closing, OMNI]) {
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
    if (onPath.has(node.id) && answers[node.id] !== undefined) answeredNodes += 1;
  }
  if (complete) {
    const required = Math.ceil((q.minAnswered || 1) * onPath.size);
    if (answeredNodes < required || answers[q.closing.id] === undefined) return { ok: false, error: required === onPath.size ? 'Please answer every step before finishing.' : `Please answer at least ${required} steps and your commitment before finishing.` };
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

function outcomeFor(q, answers, p) {
  const a = analyze(p === 'short' && q.shortPath ? { ...q, nodes: pathNodes(q, 'short') } : q, answers);
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

module.exports = { quests, publicQuest, validateAnswers, cleanNotes, outcomeFor, previewFor, pathNodes, pathOf, applyPhases };
