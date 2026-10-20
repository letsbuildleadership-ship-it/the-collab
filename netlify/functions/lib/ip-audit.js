// Content and portfolio audit of all Co.LLab™ IP, for the owner's IP analysis:
// how each guided IP is structured against The IV Phases™ and the
// Omnidirectional Enterprise™, where its questions are weak, and where the
// portfolio itself is thin. Usage-driven findings come from ip-insights.js.
const { quests } = require('./quests');
const { PHASES, OE_NODES, phaseIndexOfText, phaseIndexOfQuest } = require('./quest-analysis');
const pricing = require('./pricing');
const freeTools = require('../../../content/free-tools.json').tools;
const raw = require('../../../content/pricing.json');

const PHASE_KEYS = { foundations: 0, 'infrastructure-planning': 1, 'operating-systems': 2, preservation: 3 };
const phaseFromText = (t) => {
  const s = String(t || '');
  if (/IV\\b|Preservation/.test(s)) return 3;
  if (/III|Operating/.test(s)) return 2;
  if (/II\\b|Planning/.test(s)) return 1;
  if (/I\\b|Foundations/.test(s)) return 0;
  return null;
};

function questPhase(q, n) {
  if (Number.isInteger(n.phase)) return n.phase;
  return phaseIndexOfText(`${n.section || ''} ${n.label || ''} ${n.prompt}`, phaseIndexOfQuest(q));
}

/** Structure and language checks on one guided IP. */
function auditQuest(q) {
  const counts = [0, 0, 0, 0];
  const text = [];
  const longPrompts = [];
  const labels = [];
  const seen = new Map();
  q.nodes.forEach((n) => {
    counts[questPhase(q, n)] += 1;
    text.push(`${n.label || ''} ${n.prompt} ${(n.options || []).join(' ')}`);
    if (n.prompt.length > 220) longPrompts.push(n.prompt);
    if (n.type === 'text' && /^[^?]{1,40}:$/.test(n.prompt.trim()) && n.prompt.trim().split(/\s+/).length <= 5) labels.push(n.prompt);
    if (!n.coverage) { const k = `${n.section || ''}|${n.prompt}`; seen.set(k, (seen.get(k) || 0) + 1); }
  });
  const all = text.join(' ');
  const oe = OE_NODES.map(([name, re]) => ({ name, prompts: q.nodes.filter((n) => (`${n.label || ''} ${n.prompt} ${(n.options || []).join(' ')}`.match(re) || []).length).length }));
  const duplicates = [...seen.entries()].filter(([, c]) => c > 1).map(([k]) => k.split('|').slice(1).join('|'));

  const findings = [];
  const push = (id, severity, text2, evidence) => findings.push({ id: `content-${q.key}-${id}`, ip: q.key, severity, source: 'content', text: text2, evidence });
  const emptyPhases = PHASES.filter((_, i) => !counts[i]);
  if (emptyPhases.length && q.archetype === 'workbook') push('phase-gap', 'high', `${q.title} has no prompts for ${emptyPhases.join(' or ')}. Every Co.LLab™ IP should carry The IV Phases™ through to Preservation.`, `Prompts per phase: ${counts.join(' / ')}`);
  else if (q.archetype === 'workbook' && q.nodes.length >= 8 && Math.max(...counts) >= 3 * Math.max(1, Math.min(...counts.filter((c) => c > 0)))) push('phase-balance', 'medium', `${q.title} is heavily weighted to ${PHASES[counts.indexOf(Math.max(...counts))]}. Consider balancing the other phases.`, `Prompts per phase: ${counts.join(' / ')}`);
  if (labels.length >= 3) push('labels', 'medium', `${q.title} has ${labels.length} prompts that are bare labels (for example "${labels[0]}"). Add a guiding question so members know what a strong answer looks like.`, labels.slice(0, 4).join(' | '));
  if (longPrompts.length) push('long', 'low', `${longPrompts.length} prompt${longPrompts.length === 1 ? '' : 's'} in ${q.title} run past 220 characters. Consider splitting each into one question.`, longPrompts[0].slice(0, 160));
  if (q.nodes.length > 40) push('length', 'medium', `${q.title} asks ${q.nodes.length} questions. Long quests risk drop-off; consider a short path and a full path.`, `${q.nodes.length} questions`);
  if (duplicates.length) push('duplicates', 'medium', `${q.title} repeats ${duplicates.length} prompt${duplicates.length === 1 ? '' : 's'}: "${duplicates[0].slice(0, 90)}".`, duplicates.join(' | ').slice(0, 200));
  const reached = oe.filter((o) => o.prompts).length;
  if (reached < 3 && q.archetype === 'workbook' && !q.open) push('omni-reach', 'low', `The questions in ${q.title} speak to only ${reached} of the 8 Omnidirectional Enterprise™ directions. Consider adding a prompt that reaches outward.`, `Directions reached: ${oe.filter((o) => o.prompts).map((o) => o.name).join(', ') || 'none'}`);

  return { phaseCounts: counts, oe, longPrompts: longPrompts.length, labelPrompts: labels.length, findings, wordsPerPrompt: Math.round(all.split(/\s+/).length / Math.max(1, q.nodes.length)) };
}

function catalog() {
  const items = [];
  const freeKeys = new Set(freeTools.map((t) => t.key));
  const seen = new Set();
  const add = (i) => { seen.add(i.key); items.push(i); };

  for (const q of quests.values()) {
    const entry = pricing.entryForKey(q.key) || {};
    const free = freeKeys.has(q.key);
    add({
      key: q.key,
      title: q.title,
      kind: q.open ? 'Open quest' : free ? 'Free tool' : 'Paid IP',
      line: entry.line || (free ? 'free' : q.open ? 'free' : 'core'),
      phase: q.phase,
      phaseIndex: Number.isInteger(PHASE_KEYS[entry.phase_key]) ? PHASE_KEYS[entry.phase_key] : phaseIndexOfQuest(q),
      price: free || q.open ? 'Free' : entry.price_display || null,
      questions: q.nodes.length + 1,
      audit: auditQuest(q),
    });
  }
  const others = [];
  for (const list of ['blueprint_series', 'partner_ip', 'bonus_products']) for (const e of raw[list] || []) others.push({ e, list });
  for (const { e, list } of others) {
    if (seen.has(e.key)) continue;
    add({ key: e.key, title: e.name || e.key, kind: list === 'partner_ip' ? 'Partner IP' : list === 'blueprint_series' ? 'Blueprint series' : 'Bonus', line: e.line || list.replace('_', ' '), phase: e.phase || e.phase_key || null, phaseIndex: phaseFromText(e.phase) ?? PHASE_KEYS[e.phase_key] ?? null, price: e.price_display || null, questions: 0, audit: null });
  }
  return items;
}

/** Portfolio-level findings: where the set of IP itself is thin. */
function portfolio(items) {
  const lines = ['core', 'creator', 'partner', 'free'];
  const matrix = {};
  lines.forEach((l) => { matrix[l] = [0, 0, 0, 0]; });
  items.forEach((i) => {
    const l = lines.includes(i.line) ? i.line : i.line === 'blueprint series' || i.kind === 'Blueprint series' ? null : 'core';
    if (l && Number.isInteger(i.phaseIndex)) matrix[l][i.phaseIndex] += 1;
  });
  const questItems = items.filter((i) => i.audit);
  const phaseTotals = [0, 0, 0, 0];
  const oeTotals = OE_NODES.map(([name]) => ({ name, prompts: 0 }));
  questItems.forEach((i) => {
    i.audit.phaseCounts.forEach((c, p) => { phaseTotals[p] += c; });
    i.audit.oe.forEach((o, idx) => { oeTotals[idx].prompts += o.prompts; });
  });

  const recs = [];
  const push = (id, severity, text, evidence) => recs.push({ id: `portfolio-${id}`, ip: 'Portfolio', severity, source: 'content', text, evidence });
  const freeByPhase = [0, 0, 0, 0];
  freeTools.forEach((t) => { const p = phaseFromText(t.phase); if (p !== null) freeByPhase[p] += 1; });
  const minFree = Math.min(...freeByPhase);
  PHASES.forEach((name, p) => { if (freeByPhase[p] === minFree && freeByPhase[p] < Math.max(...freeByPhase)) push(`free-${p}`, 'medium', `${name} has the fewest free tools (${freeByPhase[p]}, against ${Math.max(...freeByPhase)} in the strongest phase). A free entry point there would widen the funnel into that phase.`, `Free tools per phase: ${freeByPhase.join(' / ')}`); });
  lines.filter((l) => l !== 'free').forEach((l) => matrix[l].forEach((c, p) => { if (!c) push(`gap-${l}-${p}`, 'high', `No ${l === 'core' ? '.LLab' : l} IP in ${PHASES[p]}. Each line should carry all four phases.`, `${l} by phase: ${matrix[l].join(' / ')}`); }));
  const weakest = [...oeTotals].sort((a, b) => a.prompts - b.prompts).slice(0, 3);
  weakest.filter((w) => w.prompts <= 2).forEach((w) => push(`omni-${w.name}`, 'medium', `The questions across all guided IP reach ${w.name} in only ${w.prompts} prompt${w.prompts === 1 ? '' : 's'}. That Omnidirectional Enterprise™ direction is under-served by the IP itself.`, `Prompts reaching each direction: ${oeTotals.map((o) => `${o.name} ${o.prompts}`).join(', ')}`));
  const ph = phaseTotals.map((c, i) => [PHASES[i], c]);
  const thin = [...ph].sort((a, b) => a[1] - b[1])[0];
  push('phase-depth', 'low', `${thin[0]} has the fewest guided prompts across all IP (${thin[1]}). Consider whether the IP goes as deep there as in the other phases.`, `Guided prompts per phase: ${ph.map((x) => x.join(' ')).join(', ')}`);
  return { matrix, freeByPhase, phaseTotals, oe: oeTotals, recommendations: recs };
}

module.exports = { auditQuest, catalog, portfolio, PHASES };
