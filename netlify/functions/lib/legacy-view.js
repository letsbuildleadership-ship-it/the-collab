// A member's whole-organization view, built only from their own finished quests:
// Phase Readiness (every quest's phase map added together) and one Legacy Statement
// that joins their own words across The IV Phases™ (mission, structure, practice,
// preservation), their commitments, and how value moves beyond their walls.
const { quests, withEdition } = require('./quests');
const { PHASES, phaseIndexOfText, phaseIndexOfQuest } = require('./quest-analysis');

const HEADINGS = ['Our mission and foundations', 'Our structure', 'Our practice', 'What we preserve'];
const PER_PHASE = 3;

const nodePhase = (q, n) => (Number.isInteger(n.phase) ? n.phase : phaseIndexOfText(`${n.section || ''} ${n.label || ''} ${n.prompt}`, phaseIndexOfQuest(q)));
const words = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

function completed(record) {
  return Object.entries(record.quests || {})
    .filter(([key, v]) => v && v.status === 'done' && quests.has(key))
    .map(([key, v]) => ({ key, saved: v, quest: withEdition(quests.get(key), v.edition) }))
    .sort((a, b) => String(a.saved.completedAt).localeCompare(String(b.saved.completedAt)));
}

function readiness(done) {
  const totals = PHASES.map((name) => ({ name, answered: 0, total: 0, strengths: 0, gaps: 0, mentions: 0 }));
  done.forEach(({ saved }) => (saved.outcome && saved.outcome.phaseMap ? saved.outcome.phaseMap : []).forEach((p, i) => {
    const t = totals[i];
    if (!t) return;
    ['answered', 'total', 'strengths', 'gaps', 'mentions'].forEach((k) => { t[k] += Number(p[k]) || 0; });
  }));
  const signal = (t) => t.strengths + t.mentions - t.gaps;
  const scored = totals.map((t, i) => ({ i, s: signal(t), has: t.answered + t.strengths + t.gaps + t.mentions > 0 }));
  const withData = scored.filter((x) => x.has);
  const strongest = withData.length ? withData.reduce((a, b) => (b.s > a.s ? b : a)).i : null;
  const thinnest = withData.length > 1 ? withData.reduce((a, b) => (b.s < a.s ? b : a)).i : null;
  return {
    phases: totals.map((t, i) => ({ ...t, level: t.strengths + t.gaps ? Math.round((t.strengths / (t.strengths + t.gaps)) * 100) : null, strongest: i === strongest, thinnest: i === thinnest && thinnest !== strongest })),
    quests: done.length,
  };
}

function statement(done) {
  const byPhase = PHASES.map(() => []);
  const commitments = [];
  const outward = [];
  const seen = new Set();
  done.forEach(({ key, quest, saved }) => {
    const answers = saved.answers || {};
    quest.nodes.forEach((n) => {
      const v = answers[n.id];
      if (n.type !== 'text' || typeof v !== 'string' || words(v) < 4) return;
      const k = v.toLowerCase();
      if (seen.has(k)) return;
      seen.add(k);
      byPhase[nodePhase(quest, n)].push({ text: v, from: quest.title, prompt: n.label || n.prompt, key, weight: words(v) });
    });
    const c = answers[quest.closing && quest.closing.id];
    if (typeof c === 'string' && c.trim()) commitments.push({ text: c.trim(), from: quest.title, key, date: String(saved.completedAt || '').slice(0, 10) });
    if (typeof answers.omni === 'string' && answers.omni.trim()) outward.push({ text: answers.omni.trim(), from: quest.title, key });
  });
  const sections = byPhase.map((list, i) => ({
    phase: PHASES[i],
    heading: HEADINGS[i],
    lines: list.sort((a, b) => b.weight - a.weight).slice(0, PER_PHASE).map(({ weight, ...l }) => l),
  }));
  const filled = sections.filter((s) => s.lines.length).length;
  return { sections, commitments: commitments.slice(-6), outward: outward.slice(-3), filled, complete: filled === 4 };
}

function legacyView(record) {
  const done = completed(record);
  return { readiness: readiness(done), statement: statement(done), sources: done.map(({ key, quest, saved }) => ({ key, title: quest.title, completedAt: saved.completedAt || null })) };
}

module.exports = { legacyView };
