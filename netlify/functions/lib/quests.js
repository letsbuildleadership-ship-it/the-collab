// Quest engine: validates a member's answers and turns them into an outcome —
// what's working, what to build next, and one next move — in collaborative
// language. Questions and result bands come from content/quests/*.json, which
// scripts/build-quests.mjs derives from the free-tool PDFs.
const fs = require('fs');
const { analyze } = require('./quest-analysis');
const path = require('path');

const dir = path.join(__dirname, '../../../content/quests');
const quests = new Map();
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
  const q = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  quests.set(q.key, q);
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

function publicQuest(q) {
  const { key, title, phase, archetype, intro, nodes, closing, upsell, minAnswered, scaleHint } = q;
  return { key, title, phase, archetype, intro, nodes, closing, omni: OMNI, upsell, minAnswered, scaleHint };
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
    if (answeredNodes < required || answers[q.closing.id] === undefined) return { ok: false, error: required === q.nodes.length ? 'Please answer every step before finishing.' : `Please answer at least ${required} steps and your commitment before finishing.` };
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

module.exports = { quests, publicQuest, validateAnswers, cleanNotes, outcomeFor };
