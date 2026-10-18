// Quest engine: validates a member's answers and turns them into an outcome —
// what's working, what to build next, and one next move — in collaborative
// language. Questions and result bands come from content/quests/*.json, which
// scripts/build-quests.mjs derives from the free-tool PDFs.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../../../content/quests');
const quests = new Map();
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
  const q = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  quests.set(q.key, q);
}

const MAX_TEXT = 1000;

const STRETCH = [
  'Make it outlast you: write down how this works and who else could run it without you.',
  'Test it together: ask the two people closest to the work whether it is as true for them as it is for you.',
  'Raise the bar: decide what "even better" looks like here, and set one date to check.',
  'Share it forward: teach this to one person on your team this month so it becomes a habit, not a habit of yours.',
];
const BUILD = [
  'Let\'s close this together: pick one small step this week that makes it true, name who it involves, and set a date to look again.',
  'Start with the smallest version: one person, one page, one week. Then we build from what works.',
  'Name the gap out loud with your team, then agree on who owns the first step.',
  'Pick the easiest piece of this and finish it completely before touching the rest.',
];

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);

function publicQuest(q) {
  const { key, title, phase, archetype, intro, nodes, closing, upsell } = q;
  return { key, title, phase, archetype, intro, nodes, closing, upsell };
}

/** @returns {{ ok: true, answers: object } | { ok: false, error: string }} */
function validateAnswers(q, raw, { complete }) {
  const answers = {};
  const input = raw && typeof raw === 'object' ? raw : {};
  const all = [...q.nodes, q.closing];
  for (const node of all) {
    const v = input[node.id];
    const missing = v === undefined || v === null || v === '';
    if (missing) {
      if (complete) return { ok: false, error: 'Please answer every step before finishing.' };
      continue;
    }
    if (node.type === 'check') {
      if (typeof v !== 'boolean') return { ok: false, error: 'Invalid answer.' };
      answers[node.id] = v;
    } else if (node.type === 'scale') {
      if (!Number.isInteger(v) || v < node.min || v > node.max) return { ok: false, error: 'Invalid score.' };
      answers[node.id] = v;
    } else {
      if (typeof v !== 'string') return { ok: false, error: 'Invalid answer.' };
      const t = clean(v).slice(0, MAX_TEXT);
      if (!t && complete) return { ok: false, error: 'Please answer every step before finishing.' };
      if (t) answers[node.id] = t;
    }
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
  const strengths = [];
  const improvements = [];
  let score = null;
  let max = null;
  let n = 0;

  if (q.archetype === 'checklist') {
    max = q.nodes.length;
    score = q.nodes.filter((x) => answers[x.id] === true).length;
    q.nodes.forEach((x, i) => {
      if (answers[x.id] === true) strengths.push({ label: x.prompt, text: 'Already true. Protect it.' });
      else improvements.push({ label: x.prompt, text: BUILD[i % BUILD.length] });
    });
  } else if (q.archetype === 'snapshot') {
    max = q.nodes.length * 5;
    score = q.nodes.reduce((a, x) => a + (answers[x.id] || 0), 0);
    q.nodes.forEach((x) => {
      const v = answers[x.id];
      if (v >= 4) strengths.push({ label: `${x.label} (${v}/5)`, text: `A real strength. ${x.prompt}` });
      else improvements.push({ label: `${x.label} (${v}/5)`, text: BUILD[n++ % BUILD.length] });
    });
  } else {
    q.nodes.forEach((x) => {
      const t = answers[x.id];
      strengths.push({ label: x.label || x.prompt, text: t });
    });
  }

  // Even a perfect score gets a way to improve: stretch moves, never "you're done".
  if (!improvements.length) {
    const picks = q.archetype === 'checklist' || q.archetype === 'snapshot' ? q.nodes.slice(0, 3) : [];
    picks.forEach((x, i) => improvements.push({ label: x.label || x.prompt, text: STRETCH[i % STRETCH.length] }));
  }
  if (q.archetype === 'worksheet' || q.archetype === 'starter') {
    q.nodes.forEach((x, i) => improvements.push({
      label: x.label || x.prompt,
      text: i % 2 ? 'Turn this into one sentence you can say out loud to your team, with one owner and one date.' : 'Read it back tomorrow. If any word is vague, replace it with something someone could check.',
    }));
  }

  const band = bandFor(q, score);
  const summary = band
    ? band.copy
    : 'You finished the whole quest, and the words are yours. The next step is to put them to work with the people you lead.';

  return {
    score,
    max,
    bandLabel: band ? band.label : null,
    summary,
    strengths,
    improvements: improvements.slice(0, 8),
    commitment: answers[q.closing.id] || '',
    nextMove: q.upsell ? `${q.upsell.name} (${q.upsell.price}) ${lowerFirst(q.upsell.copy)}` : '',
  };
}

module.exports = { quests, publicQuest, validateAnswers, cleanNotes, outcomeFor };
