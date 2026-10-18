// Anonymous, aggregate view of how members use the quests, so the owner can
// see which parts of the IP work and which need attention. No member
// identifiers, no written answers: only counts and rates.
const { quests } = require('./quests');
const { readText, PHASES } = require('./quest-analysis');

const MIN_SAMPLE = 5;

function computeInsights(customers) {
  const perQuest = [];
  const phaseGaps = PHASES.map(() => 0);
  let completedTotal = 0;
  const omniSilent = {};
  const suggestions = [];

  for (const q of quests.values()) {
    const rows = customers.map((c) => (c.quests || {})[q.key]).filter(Boolean);
    const started = rows.length;
    const done = rows.filter((r) => r.status === 'done');
    const nodes = q.nodes.map((n) => {
      const answered = rows.filter((r) => {
        const v = (r.answers || {})[n.id];
        return n.type === 'text' ? typeof v === 'string' && v.trim() : v !== undefined;
      });
      const thin = n.type === 'text' ? answered.filter((r) => ['thin', 'vague'].includes(readText(r.answers[n.id]).level)).length : 0;
      return { id: n.id, prompt: n.prompt, answered: answered.length, answeredRate: started ? answered.length / started : null, thinRate: answered.length ? thin / answered.length : null };
    });
    done.forEach((r) => {
      completedTotal += 1;
      ((r.outcome && r.outcome.phaseMap) || []).forEach((p, i) => { phaseGaps[i] += p.gaps + ((p.total || 0) - (p.answered || 0)); });
      ((r.outcome && r.outcome.omni && r.outcome.omni.nodes) || []).forEach((n) => { if (!n.mentions) omniSilent[n.name] = (omniSilent[n.name] || 0) + 1; });
    });
    perQuest.push({ key: q.key, title: q.title, started, completed: done.length, completionRate: started ? done.length / started : null, nodes });

    if (started >= MIN_SAMPLE) {
      if (done.length / started < 0.4) suggestions.push({ id: `complete-${q.key}`, text: `Only ${Math.round((done.length / started) * 100)}% of members who start "${q.title}" finish it (${done.length} of ${started}). Consider shortening it or splitting it.` });
      nodes.filter((n) => n.answeredRate < 0.5).slice(0, 2).forEach((n) => suggestions.push({ id: `skip-${q.key}-${n.id}`, text: `In "${q.title}", "${n.prompt.slice(0, 90)}" is answered by only ${Math.round(n.answeredRate * 100)}% of members who start it. Consider rewording or moving it.` }));
      nodes.filter((n) => n.thinRate >= 0.5 && n.answered >= MIN_SAMPLE).slice(0, 2).forEach((n) => suggestions.push({ id: `thin-${q.key}-${n.id}`, text: `In "${q.title}", ${Math.round(n.thinRate * 100)}% of answers to "${n.prompt.slice(0, 90)}" are thin or vague. The question may need an example or a sharper prompt.` }));
    }
  }

  if (completedTotal >= MIN_SAMPLE) {
    const top = phaseGaps.indexOf(Math.max(...phaseGaps));
    suggestions.push({ id: 'phase-gap', text: `Across ${completedTotal} completed quests, ${PHASES[top]} is the most common gap. Consider strengthening the IP and the free tools that support that phase.` });
    Object.entries(omniSilent).filter(([, n]) => n / completedTotal >= 0.7).slice(0, 3).forEach(([name]) => suggestions.push({ id: `omni-${name}`, text: `Most members' answers never reach ${name} (${omniSilent[name]} of ${completedTotal}). Consider prompts or Collaborating Companies features that connect work to that direction of the Omnidirectional Enterprise™.` }));
  }

  return {
    sampleSize: customers.length,
    completedQuests: completedTotal,
    enoughData: completedTotal >= MIN_SAMPLE,
    note: completedTotal >= MIN_SAMPLE ? 'Based on member activity. Counts only, no names or answers.' : `Not enough activity yet for reliable patterns (need ${MIN_SAMPLE}+ completed quests; ${completedTotal} so far). Suggestions appear automatically once there is.`,
    phaseGaps: PHASES.map((name, i) => ({ name, gaps: phaseGaps[i] })),
    perQuest: perQuest.filter((p) => p.started),
    suggestions,
  };
}

module.exports = { computeInsights, MIN_SAMPLE };
