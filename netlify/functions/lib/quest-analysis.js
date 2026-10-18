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

// Language anchors: the Co.LLab™ mission moves human potential into performance, sustainable
// enterprise value and lasting legacy; The IV Phases™ carry it, Foundations first.
const BUILD = [
  'Name the human potential you are building around, then write one sentence of purpose a new team member could repeat. Foundations come first because everything else in The IV Phases™ leans on them.',
  'Turn it into leadership infrastructure: name one owner, the decision it is responsible for, and one review date, so it no longer depends on a single person.',
  'Make it how you operate: give it a standing rhythm (a check-in, a standard, a visible practice) so performance does not depend on memory.',
  'Preserve it so it outlasts you: document it, name who carries it, and set the date it will be handed on. This is how work becomes legacy.',
];
const PROTECT = [
  'Keep it central: restate it at the start of your next planning cycle so it stays the reason you build, not only the history.',
  'Capture how it is organized and who owns it, so it survives a change of role.',
  'Make it teachable: show it to one new person, then let them run it once while you watch.',
  'Add it to your legacy record: what it is, why it works, and who carries it next.',
];
// The guiding question of each phase (The IV Phases™ Reference Model).
const LEGACY_QUESTION = [
  'What should never be lost as we grow?',
  'What depends on a person that should belong to the organization?',
  'How do we make what matters part of how we operate?',
  'What must exist for what we built to continue?',
];
// Mission chain: human potential, performance, sustainable enterprise value, lasting legacy.
const CHAIN = ['human potential', 'performance', 'sustainable enterprise value', 'lasting legacy'];

// The eight directions value moves in an Omnidirectional Enterprise™.
const OE_NODES = [
  ['Businesses', /\b(compan\w+|business\w*|clients?|customers?|vendors?|suppliers?|partners?|partnerships?|organizations?)\b/gi],
  ['Nonprofits', /\b(nonprofits?|non-profits?|charit\w+|volunteers?|donors?|giving|foundations? (?:grant|board)|mission-driven)\b/gi],
  ['Communities', /\b(communit\w+|neighbou?rhoods?|local|public|members?|families|families|network\w*)\b/gi],
  ['People', /\b(people|employees?|staff|team\w*|leaders?|mentor\w*|apprentic\w+|successors?|talent|colleagues?)\b/gi],
  ['Technology', /\b(software|tools?|platforms?|apps?|automat\w+|data|digital|website|systems?|ai)\b/gi],
  ['Capital', /\b(funding|funds?|revenue|budgets?|invest\w+|profit\w*|pric\w+|cash|financ\w+|capital|grants?|income)\b/gi],
  ['Knowledge + IP', /\b(knowledge|documentation|frameworks?|methods?|curricul\w+|intellectual|IP|brand|playbooks?|research|processes)\b/gi],
  ['Creators', /\b(creators?|artists?|creative\w*|writers?|designers?|content|audiences?|studios?|makers?)\b/gi],
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
    text = `That is infrastructure language. Next step: ${PROTECT[phaseIdx]}`;
  } else {
    evidence = `"${q}" is a solid start, and it does not yet say ${r.missing.slice(0, 2).join(' or ')}.`;
    text = `Add that and it can be carried by someone other than you. Next step: ${BUILD[phaseIdx]}`;
  }
  return { label: name, evidence, text, level: r.level };
}

/** Which of the eight Omnidirectional Enterprise™ directions the member's own words reach. */
function omniRead(text) {
  const nodes = OE_NODES.map(([name, re]) => ({ name, mentions: (String(text).match(re) || []).length }));
  const touched = nodes.filter((n) => n.mentions > 0);
  const silent = nodes.filter((n) => !n.mentions).map((n) => n.name);
  let read;
  if (!touched.length) {
    read = 'Nothing you wrote reaches beyond your own walls yet. In an Omnidirectional Enterprise™ value moves in every direction, between companies, people, creators and communities. Start by naming one outside party who could carry, fund or learn from this work.';
  } else {
    read = `In an Omnidirectional Enterprise™ value moves in every direction. Your answers reach ${touched.length} of 8 directions (${touched.map((n) => n.name).join(', ')}).`;
    if (silent.length) read += ` They do not yet mention ${silent.slice(0, 4).join(', ')}${silent.length > 4 ? ' or the rest' : ''}. Ask who in those directions could carry this, strengthen it, or buy from you.`;
  }
  return { nodes, read };
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
  const ti = PHASES.indexOf(thin.name);
  parts.push(`The Co.LLab™ mission moves ${CHAIN.join(' → ')}. ${thin.name} is where that chain is weakest for you right now (${CHAIN[ti]}). Start there, and ask: ${LEGACY_QUESTION[ti]}`);
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

function analyzeCore(q, answers) {
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

const allText = (answers) => Object.values(answers).flatMap((v) => (Array.isArray(v) ? v : typeof v === 'string' ? [v] : [])).join(' ');

function analyze(q, answers) {
  const r = analyzeCore(q, answers);
  r.omni = omniRead(allText(answers));
  if (answers.omni) {
    const ins = textInsight({ label: 'Beyond your own walls', prompt: '' }, answers.omni, 2);
    const entry = { label: 'Beyond your own walls', evidence: ins.evidence, text: ins.level === 'specific' ? 'You named who this reaches. Join the Collaborating Companies so those directions can find you.' : ins.text };
    if (ins.level === 'specific') r.strengths.push({ label: entry.label, evidence: entry.evidence, text: answers.omni });
    r.improvements.push(entry);
    r.improvements = r.improvements.slice(0, 9);
  }
  return r;
}

module.exports = { analyze, readText, omniRead, PHASES, OE_NODES };
