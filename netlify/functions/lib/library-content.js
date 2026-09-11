// The Legacy Library™ — content loader plus the pure state-machine that
// turns a customer record's library progress into: which month is open,
// which Marks have been earned, which Phase Crowns and Cycle Rings have
// been earned, and which Order of Distinction that adds up to.
//
// Recognition here is never a score — it's a record of demonstrated
// stewardship (a month is only "complete" once every Mark in it has
// actually been earned), and nothing in this file ever touches download
// access or Stripe entitlements. It's additive, low-stakes state layered
// on top of an active `library-card` membership.
const content = require('../../../content/library.json');

const MONTHS = content.months; // 12 entries, order 1-12
const PHASES = content.triarch.phases; // crown, scepter, signet, heirloom
const ORDERS = content.triarch.orders;
const MARKS = content.triarch.marks;

const PHASE_BY_KEY = new Map(PHASES.map((p) => [p.key, p]));
const MONTH_BY_ORDER = new Map(MONTHS.map((m) => [m.order, m]));
const PHASE_MONTH_ORDERS = new Map(); // phaseKey -> [1,2,3] style month order list
PHASES.forEach((p) => PHASE_MONTH_ORDERS.set(p.key, []));
MONTHS.forEach((m) => PHASE_MONTH_ORDERS.get(m.phase).push(m.order));

const ORDER_BY_KEY = new Map(ORDERS.map((o) => [o.key, o]));
const MARK_BY_KEY = new Map(MARKS.map((m) => [m.key, m]));

function monthByOrder(order) {
  return MONTH_BY_ORDER.get(order) || null;
}

function phaseForMonthOrder(order) {
  const m = monthByOrder(order);
  return m ? m.phase : null;
}

function phaseMeta(phaseKey) {
  return PHASE_BY_KEY.get(phaseKey) || null;
}

function emptyMonthProgress() {
  return {
    books: [false, false, false, false],
    research: { done: false, note: '' },
    practice: { done: false, note: '' },
    reflection: { done: false, note: '' },
    community: { done: false, note: '' },
  };
}

function emptyCycle() {
  return {
    months: {},
    phaseCrowns: { crown: false, scepter: false, signet: false, heirloom: false },
    cycleRing: false,
  };
}

/** Lazily initializes record.library on first contact with the Legacy Library. */
function ensureLibrary(record) {
  if (!record.library) {
    record.library = {
      enrolledAt: new Date().toISOString(),
      onboarded: false,
      cycles: { 1: emptyCycle() },
    };
  }
  if (!record.library.cycles) record.library.cycles = { 1: emptyCycle() };
  return record.library;
}

function ensureCycle(library, cycleNumber) {
  const key = String(cycleNumber);
  if (!library.cycles[key]) library.cycles[key] = emptyCycle();
  return library.cycles[key];
}

function ensureMonth(cycle, monthOrder) {
  const key = String(monthOrder);
  if (!cycle.months[key]) cycle.months[key] = emptyMonthProgress();
  return cycle.months[key];
}

/**
 * Which cycle number and month (1-12) is "current" for this member, purely
 * from elapsed calendar time since enrollment. The cycle then repeats
 * forever: month 13 since enrollment is cycle 2, month 1 again.
 */
function currentCycleAndMonth(library) {
  const enrolled = new Date(library.enrolledAt);
  const now = new Date();
  const monthsElapsed = Math.max(
    0,
    (now.getFullYear() - enrolled.getFullYear()) * 12 + (now.getMonth() - enrolled.getMonth())
  );
  const cycleNumber = Math.floor(monthsElapsed / 12) + 1;
  const monthOrder = (monthsElapsed % 12) + 1; // 1-12
  return { cycleNumber, monthOrder };
}

function isMonthFullyStewarded(monthProgress) {
  if (!monthProgress) return false;
  return (
    monthProgress.books.every(Boolean) &&
    monthProgress.research.done &&
    monthProgress.practice.done &&
    monthProgress.reflection.done &&
    monthProgress.community.done
  );
}

function isPhaseFullyStewarded(cycle, phaseKey) {
  const orders = PHASE_MONTH_ORDERS.get(phaseKey) || [];
  if (!orders.length) return false;
  return orders.every((order) => isMonthFullyStewarded(cycle.months[String(order)]));
}

/** Re-derives phaseCrowns and cycleRing for one cycle from its month progress. */
function recomputeCycleDistinctions(cycle) {
  PHASES.forEach((p) => {
    if (isPhaseFullyStewarded(cycle, p.key)) cycle.phaseCrowns[p.key] = true;
  });
  if (PHASES.every((p) => cycle.phaseCrowns[p.key])) cycle.cycleRing = true;
}

/** Cumulative totals across every cycle the member has ever stewarded. */
function lifetimeTotals(library) {
  const totals = {
    book: 0,
    research: 0,
    practice: 0,
    reflection: 0,
    community: 0,
    phaseCrowns: 0,
    cycleRings: 0,
    phaseCrownsEverEarned: { crown: false, scepter: false, signet: false, heirloom: false },
  };
  Object.values(library.cycles).forEach((cycle) => {
    Object.values(cycle.months).forEach((mp) => {
      totals.book += mp.books.filter(Boolean).length;
      if (mp.research.done) totals.research += 1;
      if (mp.practice.done) totals.practice += 1;
      if (mp.reflection.done) totals.reflection += 1;
      if (mp.community.done) totals.community += 1;
    });
    PHASES.forEach((p) => {
      if (cycle.phaseCrowns[p.key]) {
        totals.phaseCrowns += 1;
        totals.phaseCrownsEverEarned[p.key] = true;
      }
    });
    if (cycle.cycleRing) totals.cycleRings += 1;
  });
  return totals;
}

function computeOrder(totals) {
  if (totals.cycleRings >= 1) return 'legacy-bearer';
  const earnedCount = Object.values(totals.phaseCrownsEverEarned).filter(Boolean).length;
  if (earnedCount >= 4) return 'sovereign';
  if (earnedCount === 3) return 'steward';
  if (earnedCount === 2) return 'architect';
  if (earnedCount === 1) return 'curator';
  return 'initiate';
}

module.exports = {
  content,
  MONTHS,
  PHASES,
  ORDERS,
  MARKS,
  monthByOrder,
  phaseForMonthOrder,
  phaseMeta,
  emptyMonthProgress,
  emptyCycle,
  ensureLibrary,
  ensureCycle,
  ensureMonth,
  currentCycleAndMonth,
  isMonthFullyStewarded,
  isPhaseFullyStewarded,
  recomputeCycleDistinctions,
  lifetimeTotals,
  computeOrder,
  ORDER_BY_KEY,
  MARK_BY_KEY,
};
