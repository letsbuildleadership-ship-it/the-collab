// What a member's finished quests add up to, across all their IP: the Phase Readiness view
// (every completed quest's phase map, totalled across The IV Phases™), one Legacy Statement
// assembled from their own answers, and the 30, 90 and 365-day check-ins on each commitment.
// Private to the member: built only from their own record, never shared or published.
const { quests } = require('./quests');
const { PHASES, phaseIndexOfText, phaseIndexOfQuest, readText } = require('./quest-analysis');

const CHECKIN_DAYS = [30, 90, 365];
const DAY = 24 * 60 * 60 * 1000;
const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

/** Totals the phase map of every completed quest. Readiness = strengths ÷ (strengths + gaps). */
function phaseReadiness(record) {
  const done = Object.entries(record.quests || {}).filter(([, v]) => v && v.status === 'done' && v.outcome && Array.isArray(v.outcome.phaseMap));
  const totals = PHASES.map((name) => ({ name, strengths: 0, gaps: 0, mentions: 0, answered: 0, total: 0, quests: 0 }));
  done.forEach(([, v]) => v.outcome.phaseMap.forEach((p, i) => {
    if (!totals[i]) return;
    totals[i].strengths += p.strengths || 0;
    totals[i].gaps += p.gaps || 0;
    totals[i].mentions += p.mentions || 0;
    totals[i].answered += p.answered || 0;
    totals[i].total += p.total || 0;
    if ((p.strengths || 0) + (p.gaps || 0) + (p.mentions || 0) > 0) totals[i].quests += 1;
  }));
  const phases = totals.map((t) => ({ ...t, readiness: t.strengths + t.gaps ? Math.round((100 * t.strengths) / (t.strengths + t.gaps)) : null }));
  const scored = phases.filter((p) => p.readiness !== null);
  const thinnest = scored.length ? [...scored].sort((a, b) => a.readiness - b.readiness)[0].name : null;
  const strongest = scored.length ? [...scored].sort((a, b) => b.readiness - a.readiness)[0].name : null;
  const untouched = phases.filter((p) => p.readiness === null).map((p) => p.name);
  let read = '';
  if (!done.length) read = 'Finish a quest to see where your organization stands across The IV Phases™.';
  else if (scored.length === 1 && untouched.length) read = `So far your quests read only ${strongest}. ${untouched[0]} is next: the phases hold each other up.`;
  else if (thinnest && strongest && thinnest !== strongest) read = `Across ${done.length} finished quest${done.length === 1 ? '' : 's'}, ${strongest} is your strongest phase and ${thinnest} is the thinnest. Build ${thinnest} next.`;
  else read = `Across ${done.length} finished quest${done.length === 1 ? '' : 's'}, your phases are even. Keep building all four.`;
  return { quests: done.length, phases, thinnest, strongest, untouched, read };
}

function nodePhase(q, n, answer) {
  if (Number.isInteger(n.phase)) return n.phase;
  return phaseIndexOfText(`${n.section || ''} ${n.prompt} ${answer || ''}`, phaseIndexOfQuest(q));
}

/**
 * The member's own words from every finished quest, sorted into The IV Phases™, strongest first.
 * The draft is suggested; the member's saved statement (their edits) always wins.
 */
function legacyDraft(record) {
  const picks = PHASES.map(() => []);
  const commitments = [];
  Object.entries(record.quests || {}).forEach(([key, v]) => {
    const q = quests.get(key);
    if (!q || !v || v.status !== 'done') return;
    const answers = v.answers || {};
    [...q.nodes, ...(q.extend || [])].forEach((n) => {
      const a = answers[n.id];
      if (n.type !== 'text' || typeof a !== 'string' || a.trim().length < 12) return;
      const r = readText(a);
      const score = (r.level === 'specific' ? 3 : r.level === 'developing' ? 2 : 1) + Math.min(a.length, 400) / 400;
      picks[nodePhase(q, n, a)].push({ quest: q.title, prompt: n.prompt, text: clean(a, 400), score });
    });
    const c = answers[q.closing.id];
    if (c) commitments.push({ quest: q.title, text: clean(c, 300) });
  });
  return {
    // Strongest first, and never the same sentence twice (members often reuse an answer).
    phases: PHASES.map((name, i) => {
      const seen = new Set();
      const lines = picks[i].sort((a, b) => b.score - a.score).filter((l) => { const k = l.text.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
      return { name, lines: lines.slice(0, 3).map(({ score, ...rest }) => rest) };
    }),
    commitments: commitments.slice(0, 8),
  };
}

function draftText(draft) {
  return draft.phases.map((p) => p.lines.map((l) => l.text).join(' '));
}

/** A member's saved Legacy Statement (four phases + a closing line), validated and trimmed. */
function cleanStatement(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const phases = PHASES.map((_, i) => clean((input.phases || [])[i], 1500));
  return { title: clean(input.title, 120), phases, closing: clean(input.closing, 600) };
}

/** Schedule the 30, 90 and 365-day check-ins for a quest's commitment (once per completion). */
function scheduleCheckins(record, questKey, commitment, completedAt) {
  const text = clean(commitment, 500);
  if (!text) return;
  record.commitments = record.commitments || {};
  const start = new Date(completedAt || Date.now()).getTime();
  const prev = record.commitments[questKey];
  if (prev && prev.text === text && prev.startedAt) return; // same commitment, keep its history
  record.commitments[questKey] = {
    text,
    startedAt: new Date(start).toISOString(),
    checkins: CHECKIN_DAYS.map((d) => ({ day: d, dueAt: new Date(start + d * DAY).toISOString(), reply: null, emailedAt: null })),
  };
}

const STATUSES = ['kept', 'in-progress', 'changed', 'not-yet'];

/** Due and upcoming check-ins for the portal, oldest due first. */
function checkinView(record, now = Date.now()) {
  const out = [];
  Object.entries(record.commitments || {}).forEach(([key, c]) => {
    const q = quests.get(key);
    (c.checkins || []).forEach((k) => {
      const due = new Date(k.dueAt).getTime();
      out.push({ questKey: key, quest: q ? q.title : key, commitment: c.text, day: k.day, dueAt: k.dueAt, due: due <= now, reply: k.reply });
    });
  });
  return out.sort((a, b) => a.dueAt.localeCompare(b.dueAt));
}

function recordCheckin(record, questKey, day, raw) {
  const c = (record.commitments || {})[questKey];
  if (!c) return { error: 'No commitment to check in on.' };
  const k = (c.checkins || []).find((x) => x.day === Number(day));
  if (!k) return { error: 'Unknown check-in.' };
  if (new Date(k.dueAt).getTime() > Date.now()) return { error: 'This check-in is not due yet.' };
  const status = String((raw || {}).status || '');
  if (!STATUSES.includes(status)) return { error: 'Choose what happened.' };
  k.reply = { status, note: clean((raw || {}).note, 800), at: new Date().toISOString() };
  return { ok: true, reply: k.reply };
}

/** Anonymous counts for the owner's IP review: which IP's commitments are kept. No names, no words. */
function checkinInsights(customers) {
  const byQuest = {};
  customers.forEach((r) => Object.entries(r.commitments || {}).forEach(([key, c]) => (c.checkins || []).forEach((k) => {
    if (!k.reply) return;
    const b = (byQuest[key] = byQuest[key] || { key, title: (quests.get(key) || {}).title || key, replies: 0, kept: 0, inProgress: 0, changed: 0, notYet: 0 });
    b.replies += 1;
    if (k.reply.status === 'kept') b.kept += 1;
    else if (k.reply.status === 'in-progress') b.inProgress += 1;
    else if (k.reply.status === 'changed') b.changed += 1;
    else b.notYet += 1;
  })));
  return Object.values(byQuest).sort((a, b) => b.replies - a.replies);
}

/**
 * Progression across The IV Phases™: for each phase, the member's quests finished, in progress and
 * open to them (owned IP, free tools, open quests), plus the IP in that phase they could add.
 * `next` is up to three steps, the thinnest or untouched phase first, so what a member documented in
 * one phase carries straight into the work of the next. Built only from their own record and catalog.
 */
function progression(record, ownedKeys, catalog) {
  const readiness = phaseReadiness(record);
  const mine = record.quests || {};
  const owned = new Set(ownedKeys || []);
  const phases = PHASES.map((name) => ({ name, done: [], inProgress: [], open: [], toAdd: [] }));
  for (const q of quests.values()) {
    if (q.editionOf) continue;
    const i = phaseIndexOfQuest(q);
    const s = mine[q.key];
    const free = /^free-/.test(q.key) || q.open;
    const item = { key: q.key, title: q.title };
    if (s && s.status === 'done') phases[i].done.push({ ...item, completedAt: s.completedAt || null, runs: 1 + ((s.history || []).length) });
    else if (s && s.status === 'draft') phases[i].inProgress.push(item);
    else if (owned.has(q.key) || free) phases[i].open.push({ ...item, free: !!free && !owned.has(q.key) });
    else if (catalog && catalog.has(q.key)) phases[i].toAdd.push(item);
  }
  // thinnest first: an untouched phase counts as the thinnest; ties go in The IV Phases™ order
  const rank = (i) => (readiness.phases[i].readiness === null ? -1 : readiness.phases[i].readiness);
  const order = PHASES.map((name, i) => i).sort((a, b) => rank(a) - rank(b) || a - b);
  const next = [];
  const push = (i, item, kind) => { if (next.length < 3 && !next.some((n) => n.key === item.key)) next.push({ phase: PHASES[i], phaseNo: ['I', 'II', 'III', 'IV'][i], key: item.key, title: item.title, kind }); };
  for (const i of order) { const p = phases[i]; if (p.inProgress[0]) push(i, p.inProgress[0], 'continue'); }
  for (const i of order) { const p = phases[i]; const o = p.open.find((x) => !x.free) || p.open[0]; if (o) push(i, o, 'start'); }
  for (const i of order) { const p = phases[i]; if (p.toAdd[0]) push(i, p.toAdd[0], 'add'); }
  return { phases: phases.map((p) => ({ name: p.name, done: p.done, inProgress: p.inProgress, open: p.open.length, toAdd: p.toAdd.length })), next };
}

module.exports = { progression, phaseReadiness, legacyDraft, draftText, cleanStatement, scheduleCheckins, checkinView, recordCheckin, checkinInsights, CHECKIN_DAYS, STATUSES };
