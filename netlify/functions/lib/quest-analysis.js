// Reads what the member actually wrote or chose and turns it into findings
// in Co.LLab™ Legacy language. Deterministic and rule-based: every sentence
// it produces points back to something in the member's own answers (their
// words, their scores, which phase of The IV Phases™ they mention or skip).
const PHASES = ['Foundations', 'Infrastructure Planning & Management', 'Internal Operating Systems', 'Preservation'];

const LEXICON = [
  /\b(mission|vision|purpose|values?|belief|direction|clarity|why|principles?|identity|strengths?|foundations?|goals?|meaning|intention|standard)\w*/gi,
  /\b(plan\w*|roles?|responsib\w*|owner\w*|process\w*|structure\w*|decisions?|budget\w*|priorit\w*|schedule\w*|resources?|accountab\w*|timeline\w*|strateg\w*|organiz\w*|delegat\w*|milestones?|metrics?|measure\w*)\b/gi,
  /\b(daily|weekly|habits?|rhythm|routines?|meetings?|practic\w*|communicat\w*|culture|behaviou?rs?|feedback|team\w*|workflows?|systems?|tools?|follow-?up|check-?ins?|training|onboarding|execut\w*|collaborat\w*|trust)\b/gi,
  /\b(document\w*|succe\w+|transfer\w*|legacy|continu\w*|hand-?offs?|archive\w*|records?|mentor\w*|next generation|future|outlast\w*|sustain\w*|preserv\w*|estate|heirs?|retire\w*|pass(ed)? on)\b/gi,
];

const BUILD = [
  'Write one sentence of purpose that a new team member could repeat in their own words. Everything you build on top of it will lean on it.',
  'Give it an owner and a structure: one named person, one decision it is responsible for, and one date to review it together.',
  'Put it into the rhythm of the week: a standing check-in, a visible practice, or a habit that someone owns.',
  'Document it and name who carries it forward. If you stepped away for a year, this has to keep running without you.',
];
const PROTECT = [
  'Keep it visible: restate it at the start of your next planning cycle so it stays the reason, not just the history.',
  'Record how it is organized and who owns it, so it survives a change of role.',
  'Make the practice teachable: show it to one new person and let them run it once while you watch.',
  'Add it to your legacy record: what it is, why it works, and who can carry it next.',
];
const LEGACY_QUESTION = [
  'If you were not in the room, what would still be true about this work?',
  'Who besides you could make the next decision here, and what would they need to know?',
  'What happens here every week whether or not you are watching?',
  'What would the next leader need in their hands on day one?',
];

const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const lowerFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const countHits = (text, i) => (String(text).match(LEXICON[i]) || []).length;

function phaseIndexOfText(text, fallback) {
  const hits = LEXICON.map((_, i) => countHits(text, i));
  const best = Math.max(...hits);
  return best > 0 ? hits.indexOf(best) : fallback;
}

function phaseIndexOfQuest(q) {
  const p = String(q.phase || '');
  if (/preserv/i.test(p) || /\bIV\b/.test(p)) return 3;
  if (/operating|III/.test(p)) return 2;
  if (/planning|II\b/.test(p)) return 1;
  return 0;
}

function quote(text, max = 90) {
  const t = clean(text);
  const first = t.split(/(?<=[.!?])\s+/)[0] || t;
  return first.length > max ? `${first.slice(0, max - 1).trimEnd()}…` : first;
}

/** Reads one written answer: how specific is it, and what is missing. */
function readText(text) {
  const t = clean(text);
  const words = t ? t.split(' ').length : 0;
  const has = {
    number: /\d/.test(t),
    time: /\b(today|tomorrow|this (week|month|quarter|year)|next (week|month|quarter)|by (mon|tues|wednes|thurs|fri|satur|sun)\w*|by (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|within|every (day|week|month|quarter)|daily|weekly|monthly|quarterly|\d+ (days?|weeks?|months?))\b/i.test(t),
    owner: /\b(i will|we will|i'll|we'll|owner|assign\w*|responsible|\w+ will|my team|our team|the team)\b/i.test(t),
  };
  const vague = (t.match(/\b(better|more|improve\w*|things|stuff|everyone|always|never|try|maybe|hopefully|etc|good|great|various|some)\b/gi) || []).map((x) => x.toLowerCase());
  const signals = Object.values(has).filter(Boolean).length;
  let level = 'developing';
  if (words < 6) level = 'thin';
  else if (signals >= 2) level = 'specific';
  else if (vague.length >= 2 && signals < 1) level = 'vague';
  const missing = [];
  if (!has.owner) missing.push('who owns it');
  if (!has.time) missing.push('when you will do or check it');
  if (!has.number) missing.push('how you will know it worked');
  return { text: t, words, has, vague: [...new Set(vague)], level, missing };
}

function textInsight(node, answer, phaseIdx) {
  const r = readText(answer);
  const name = node.label && !/^prompt \d/i.test(node.label) ? node.label : quote(node.prompt, 60);
  const q = quote(r.text);
  let text;
  let evidence;
  if (r.level === 'thin') {
    evidence = `Your answer to "${name}" is ${r.words} word${r.words === 1 ? '' : 's'}: "${q}"`;
    text = 'Legacy work needs enough detail for someone else to carry it. Add who it involves, what it looks like in practice, and when you will check it together.';
  } else if (r.level === 'vague') {
    evidence = `You wrote "${q}" and used ${r.vague.slice(0, 3).map((v) => `"${v}"`).join(', ')}.`;
    text = `Words like these are hard to build on. Restate it so another leader could check it: ${r.missing.join(', ')}.`;
  } else if (r.level === 'specific') {
    const has = [r.has.owner && 'an owner', r.has.time && 'a timeframe', r.has.number && 'a number'].filter(Boolean);
    evidence = `"${q}" names ${has.length > 1 ? `${has.slice(0, -1).join(', ')} and ${has[has.length - 1]}` : has[0]}.`;
    text = `That is infrastructure language. Next: ${lowerFirst(PROTECT[phaseIdx])}`;
  } else {
    evidence = `"${q}" is a solid start, and it does not yet say ${r.missing.slice(0, 2).join(' or ')}.`;
    text = `Add that and it can be carried by someone other than you. Then: ${lowerFirst(BUILD[phaseIdx])}`;
  }
  return { label: name, evidence, text, level: r.level };
}

function phaseMapFrom(buckets) {
  return PHASES.map((name, i) => ({ name, mentions: buckets[i].mentions, strengths: buckets[i].strengths, gaps: buckets[i].gaps }));
}

function legacyRead(map, extra) {
  const withData = map.filter((p) => p.mentions + p.strengths + p.gaps > 0);
  const weight = (p) => p.gaps * 2 - p.strengths - p.mentions * 0.5;
  const thin = [...map].sort((a, b) => weight(b) - weight(a))[0];
  const strong = [...map].sort((a, b) => weight(a) - weight(b))[0];
  const silent = map.filter((p) => p.mentions === 0 && p.strengths === 0 && p.gaps === 0).map((p) => p.name);
  const parts = [];
  if (withData.length > 1 && strong.name !== thin.name) {
    parts.push(`Your answers lean on ${strong.name} and are thinnest in ${thin.name}.`);
  } else {
    parts.push(`Your answers sit mostly in ${thin.name}.`);
  }
  if (silent.length) parts.push(`Nothing you wrote touches ${silent.join(' or ')}. In The IV Phases™ each phase holds up the next, so that is where the infrastructure is not yet built.`);
  parts.push(`Start in ${thin.name}. ${PHASES.indexOf(thin.name) >= 0 ? LEGACY_QUESTION[PHASES.indexOf(thin.name)] : ''}`);
  if (extra) parts.push(extra);
  return { text: parts.join(' '), thinIdx: PHASES.indexOf(thin.name), strongIdx: PHASES.indexOf(strong.name) };
}

const emptyBuckets = () => PHASES.map(() => ({ mentions: 0, strengths: 0, gaps: 0 }));

const stem = (w) => String(w).toLowerCase().replace(/[^a-z ]/g, '').trim().slice(0, 6);

function analyzeWorkbook(q, answers) {
  const base = phaseIndexOfQuest(q);
  const buckets = PHASES.map(() => ({ mentions: 0, strengths: 0, gaps: 0, answered: 0, total: 0 }));
  const strengths = [];
  const improvements = [];
  const isText = (n) => n.type === 'text';
  const written = q.nodes.filter(isText).map((n) => answers[n.id]).concat(answers[q.closing.id]).filter(Boolean).join(' ');
  LEXICON.forEach((_, i) => { buckets[i].mentions += countHits(written, i); });

  const scaleSum = { total: 0, count: 0, byPhase: PHASES.map(() => ({ sum: 0, n: 0 })) };
  const lowItems = PHASES.map(() => []);
  const unanswered = PHASES.map(() => []);

  q.nodes.forEach((n) => {
    const a = answers[n.id];
    const answered = n.type === 'text' ? typeof a === 'string' && a.trim() !== '' : a !== undefined;
    const p = Number.isInteger(n.phase) ? n.phase : phaseIndexOfText(`${n.section || ''} ${n.prompt} ${n.type === 'text' ? a || '' : ''}`, base);
    buckets[p].total += 1;
    if (!answered) { unanswered[p].push(n); return; }
    buckets[p].answered += 1;

    if (n.type === 'scale') {
      scaleSum.total += a; scaleSum.count += 1; scaleSum.byPhase[p].sum += a; scaleSum.byPhase[p].n += 1;
      if (a >= 4) { buckets[p].strengths += 1; strengths.push({ label: n.prompt, evidence: `You rated this ${a} of 5 (${PHASES[p]}).`, text: PROTECT[p], rank: a }); } else if (a <= 2) { buckets[p].gaps += 1; lowItems[p].push({ n, a }); }
    } else if (n.type === 'choose' && n.coverage) {
      const left = n.options.filter((o) => !a.includes(o));
      buckets[p].strengths += a.length; buckets[p].gaps += left.length;
      if (a.length) strengths.push({ label: `In place in ${PHASES[p]}`, evidence: `You said these already exist: ${a.join(', ')}.`, text: PROTECT[p], rank: a.length });
      if (left.length) improvements.push({ label: `Not yet in place in ${PHASES[p]}`, evidence: `You did not select: ${left.join(', ')}.`, text: BUILD[p], weight: left.length + 3 });
    } else if (n.type === 'choose') {
      const others = q.nodes.filter((x) => x !== n && isText(x)).map((x) => answers[x.id]).concat(answers[q.closing.id]).filter(Boolean).join(' ').toLowerCase();
      const unmatched = a.filter((o) => !others.includes(stem(o)));
      if (a.length && !unmatched.length) strengths.push({ label: quote(n.prompt, 70), evidence: `You chose ${a.join(', ')}, and your written answers show it.`, text: PROTECT[p], rank: 3 });
      if (unmatched.length) {
        buckets[p].gaps += 1;
        improvements.push({ label: quote(n.prompt, 70), evidence: `You chose ${a.join(', ')}, but nothing you wrote mentions ${unmatched.join(', ')}.`, text: `A choice becomes infrastructure when people can see it in behavior. Describe what ${unmatched[0]} looks like in a decision this month, and who would notice.`, weight: 4 });
      }
    } else if (n.type === 'text') {
      const ins = textInsight({ label: '', prompt: n.prompt }, a, p);
      if (ins.level === 'specific') { buckets[p].strengths += 1; strengths.push({ label: quote(n.prompt, 70), evidence: ins.evidence, text: a, rank: 2 }); } else buckets[p].gaps += 1;
      if (ins.level !== 'specific') improvements.push({ label: quote(n.prompt, 70), evidence: ins.evidence, text: ins.text, weight: ins.level === 'developing' ? 2 : 3 });
    }
  });

  PHASES.forEach((name, p) => {
    const b = buckets[p];
    if (b.total >= 2 && b.answered / b.total < 0.5) {
      improvements.push({ label: `${name}: ${b.answered} of ${b.total} answered`, evidence: `You left ${b.total - b.answered} ${name} prompts open, starting with "${quote((unanswered[p].find((x) => x.type === 'text') || unanswered[p][0]).prompt, 70)}".`, text: `${BUILD[p]} ${LEGACY_QUESTION[p]}`, weight: 6 });
    }
    const low = lowItems[p].sort((x, y) => x.a - y.a).slice(0, 2);
    low.forEach(({ n, a }) => improvements.push({ label: quote(n.prompt, 80), evidence: `You rated this ${a} of 5 in ${name}${scaleSum.byPhase[p].n ? `, where your average is ${(scaleSum.byPhase[p].sum / scaleSum.byPhase[p].n).toFixed(1)}` : ''}.`, text: BUILD[p], weight: 5 - a + 2 }));
  });

  const c = answers[q.closing.id];
  if (c) {
    const r = readText(c);
    buckets[phaseIndexOfText(c, base)].mentions += 1;
    const gaps = [!r.has.time && 'a date', !r.has.owner && 'an owner'].filter(Boolean);
    improvements.push({ label: 'Your commitment', evidence: `You committed to: "${quote(c, 110)}"`, text: gaps.length ? `Add ${gaps.join(' and ')} so it becomes a commitment someone can hold you to.` : 'It already has the pieces. Tell one person so it is held together.', weight: 1 });
  }

  improvements.sort((a, b) => b.weight - a.weight);
  strengths.sort((a, b) => (b.rank || 0) - (a.rank || 0));
  if (improvements.filter((i) => i.label !== 'Your commitment').length < 3) {
    strengths.slice(0, 3).forEach((s, i) => improvements.unshift({ label: s.label, evidence: s.evidence, text: PROTECT[(i + 1) % 4] }));
  }

  const map = PHASES.map((name, i) => ({ name, mentions: buckets[i].mentions, strengths: buckets[i].strengths, gaps: buckets[i].gaps, answered: buckets[i].answered, total: buckets[i].total }));
  let score = null;
  let max = null;
  let extra = '';
  if (scaleSum.count) {
    score = scaleSum.total;
    max = scaleSum.count * 5;
    const avgs = scaleSum.byPhase.map((x, i) => ({ i, avg: x.n ? x.sum / x.n : null })).filter((x) => x.avg !== null);
    const lo = [...avgs].sort((a, b) => a.avg - b.avg)[0];
    const hi = [...avgs].sort((a, b) => b.avg - a.avg)[0];
    extra = `Across ${scaleSum.count} statements your average is ${(score / scaleSum.count).toFixed(1)} of 5. ${PHASES[lo.i]} is lowest (${lo.avg.toFixed(1)}) and ${PHASES[hi.i]} is highest (${hi.avg.toFixed(1)}).`;
  } else {
    const answeredAll = buckets.reduce((a, b) => a + b.answered, 0);
    const totalAll = buckets.reduce((a, b) => a + b.total, 0);
    extra = `You worked through ${answeredAll} of ${totalAll} prompts and touched ${buckets.filter((b) => b.answered).length} of the four phases.`;
  }
  const read = legacyRead(map.map((m) => ({ ...m, gaps: m.gaps + (m.total - m.answered) })), extra);
  return { score, max, strengths: strengths.slice(0, 8).map(({ rank, ...r }) => r), improvements: improvements.slice(0, 8).map(({ weight, level, ...r }) => r), phaseMap: map, legacyRead: read.text, summary: extra };
}

function analyze(q, answers) {
  if (q.archetype === 'workbook') return analyzeWorkbook(q, answers);
  const base = phaseIndexOfQuest(q);
  const buckets = emptyBuckets();
  const strengths = [];
  const improvements = [];
  let score = null;
  let max = null;
  let extra = '';

  const writtenText = [...q.nodes.filter((n) => n.type === 'text').map((n) => answers[n.id]), answers[q.closing.id]].filter(Boolean).join(' ');
  LEXICON.forEach((_, i) => { buckets[i].mentions += countHits(writtenText, i); });

  if (q.archetype === 'checklist') {
    max = q.nodes.length;
    const nots = [];
    q.nodes.forEach((n) => {
      const p = phaseIndexOfText(n.prompt, base);
      if (answers[n.id] === true) { buckets[p].strengths += 1; strengths.push({ label: n.prompt, evidence: `You marked this as true today (${PHASES[p]}).`, text: PROTECT[p] }); } else { buckets[p].gaps += 1; nots.push({ n, p }); }
    });
    score = max - nots.length;
    nots.forEach(({ n, p }) => {
      const same = nots.filter((x) => x.p === p).length;
      improvements.push({ label: n.prompt, evidence: `You marked this "Not yet". It sits in ${PHASES[p]}${same > 1 ? `, where ${same} of your ${nots.length} open items live` : ''}.`, text: BUILD[p], weight: same });
    });
    improvements.sort((a, b) => b.weight - a.weight);
    if (nots.length === 0) extra = 'Every item is true today. The legacy question now is whether it stays true without you.';
  } else if (q.archetype === 'snapshot') {
    max = q.nodes.length * 5;
    const scored = q.nodes.map((n) => ({ n, v: answers[n.id], p: phaseIndexOfText(`${n.label} ${n.prompt}`, base) }));
    score = scored.reduce((a, x) => a + x.v, 0);
    const hi = [...scored].sort((a, b) => b.v - a.v)[0];
    const lo = [...scored].sort((a, b) => a.v - b.v)[0];
    const spread = hi.v - lo.v;
    scored.forEach((x) => {
      if (x.v >= 4) { buckets[x.p].strengths += 1; strengths.push({ label: `${x.n.label} (${x.v}/5)`, evidence: `You scored ${x.n.label} ${x.v} of 5.`, text: PROTECT[x.p] }); } else buckets[x.p].gaps += 1;
    });
    [...scored].sort((a, b) => a.v - b.v).filter((x) => x.v <= 3).forEach((x) => {
      const gapNote = spread >= 2 && x === lo ? ` ${hi.n.label} (${hi.v}) is carrying ${x.n.label} (${x.v}): a ${spread}-point gap.` : '';
      improvements.push({ label: `${x.n.label} (${x.v}/5)`, evidence: `You scored ${x.n.label} ${x.v} of 5.${gapNote}`, text: BUILD[x.p] });
    });
    extra = spread === 0 ? `All four dimensions scored ${lo.v}, an even foundation. Even foundations need one place to push first: choose ${lo.n.label}.` : `Your weakest link is ${lo.n.label} (${lo.v}); your strongest is ${hi.n.label} (${hi.v}).`;
  } else {
    q.nodes.forEach((n, i) => {
      const p = phaseIndexOfText(`${n.label || ''} ${n.prompt} ${answers[n.id]}`, Math.min(i, 3));
      const ins = textInsight(n, answers[n.id], p);
      if (ins.level === 'specific') { buckets[p].strengths += 1; strengths.push({ label: ins.label, evidence: ins.evidence, text: answers[n.id] }); } else buckets[p].gaps += 1;
      improvements.push({ ...ins, weight: ins.level === 'specific' ? 0 : ins.level === 'developing' ? 1 : 2 });
    });
    improvements.sort((a, b) => b.weight - a.weight);
    if (!strengths.length) q.nodes.forEach((n) => strengths.push({ label: n.label || quote(n.prompt, 60), evidence: 'Your words, in full:', text: answers[n.id] }));
  }

  const c = answers[q.closing.id];
  if (c) {
    const r = readText(c);
    const cp = phaseIndexOfText(c, base);
    buckets[cp].mentions += 1;
    const gaps = [!r.has.time && 'a date', !r.has.owner && 'an owner'].filter(Boolean);
    improvements.push({
      label: 'Your commitment',
      evidence: `You committed to: "${quote(c, 110)}"`,
      text: gaps.length ? `Add ${gaps.join(' and ')} so it becomes a commitment someone can hold you to.` : 'It already has the pieces. Tell one person so it is held together.',
    });
  }

  // Even when everything is strong, give a next level (stretch), built from their own strongest item.
  if (!improvements.length || improvements.every((i) => i.label === 'Your commitment')) {
    strengths.slice(0, 3).forEach((s, i) => improvements.unshift({ label: s.label, evidence: s.evidence, text: PROTECT[(i + 1) % 4] }));
  }

  const map = phaseMapFrom(buckets);
  const read = legacyRead(map, extra);
  return { score, max, strengths, improvements: improvements.slice(0, 8).map(({ weight, level, ...rest }) => rest), phaseMap: map, legacyRead: read.text };
}

module.exports = { analyze, readText, PHASES };
