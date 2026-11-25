// Continuous IP improvement without an approval queue. Routine improvements are approved
// automatically: a new recommendation or idea is marked "planned" as soon as it appears, and it
// is marked "done" only once it is implemented and verified (a shipped release recorded in
// content/ip-implementation-log.json, or the IP audit itself no longer finding the problem).
// The owner can still override any item (decline needs a note), and only items flagged as a
// genuine founder decision (legal, financial, security or material business) wait for them.
// Every change of status is written to an audit trail ('ip-audit-log'), never overwritten.
const crypto = require('crypto');
const store = require('./store');
const implementation = require('../../../content/ip-implementation-log.json');

const OPEN = ['new', 'considering', 'planned'];
const AUTO_PLAN_NOTE = 'Approved automatically as a routine improvement; queued for implementation.';

async function log(entry) {
  const at = entry.at || new Date().toISOString();
  await store.opsPut('ip-audit-log', `${at}-${crypto.randomBytes(3).toString('hex')}`, { ...entry, at });
}

/** Sets a status and records the change in the audit trail. */
async function setStatus(collection, id, status, note, by, extra = {}, prev = null) {
  const at = extra.at || new Date().toISOString();
  const value = { ...(prev || {}), ...extra, id, status, note, decidedAt: at, by };
  delete value.at;
  await store.opsPut(collection, id, value);
  await log({ collection, id, from: prev ? prev.status : 'new', to: status, by, note, at });
  return value;
}

/** The release record for an item id, if this item was implemented and verified in a release. */
function shipped(id) {
  for (const r of implementation.releases || []) {
    const item = (r.items || []).find((i) => i.id === id);
    if (item) return { release: r, item };
  }
  return null;
}

const doneNote = ({ release, item }) => `Implemented in the ${release.date} release: ${item.change} Verified: ${release.verified}`;

/**
 * Brings a list of items up to date: shipped items become done (after a planned step, so the
 * trail shows when work began), unseen items are approved as planned, and an owner's decline
 * (or any owner decision) is always kept. A recommendation the audit no longer finds is closed
 * as done whoever queued it, since the problem is gone. Returns the status map.
 */
async function reconcile(collection, items, { resolvedIds = [] } = {}) {
  const stored = new Map((await store.opsList(collection)).map((s) => [s.id, s]));
  const ids = new Set(items.map((i) => i.id));
  for (const it of items) {
    let s = stored.get(it.id) || null;
    const ship = shipped(it.id);
    // An owner's own decision on an item is never overridden by automation.
    if (ship && (!s || (OPEN.includes(s.status) && s.by !== 'owner'))) {
      if (!s || s.status === 'new') s = await setStatus(collection, it.id, 'planned', 'Work began in the release.', 'auto', { text: it.text || it.title, at: ship.release.started }, s);
      s = await setStatus(collection, it.id, 'done', doneNote(ship), 'auto-verify', { text: it.text || it.title }, s);
    } else if (!s || s.status === 'new') {
      s = await setStatus(collection, it.id, it.founderDecision ? 'considering' : 'planned', it.founderDecision ? `Needs a founder decision: ${it.founderDecision}` : AUTO_PLAN_NOTE, 'auto', { text: it.text || it.title, ip: it.ip || null, severity: it.severity || null }, s);
    }
    stored.set(it.id, s);
  }
  // A recommendation the audit no longer finds was fixed: record it as done, with the release if known.
  for (const id of resolvedIds) {
    if (ids.has(id)) continue;
    let s = stored.get(id) || null;
    if (s && !OPEN.includes(s.status)) continue;
    const ship = shipped(id);
    if (!s && !ship) continue;
    if (!s || s.status === 'new') s = await setStatus(collection, id, 'planned', 'Work began in the release.', 'auto', { text: ship ? ship.item.text : null, ip: ship ? ship.item.ip : null, severity: ship ? ship.item.severity : null, at: ship ? ship.release.started : undefined }, s);
    s = await setStatus(collection, id, 'done', ship ? doneNote(ship) : `Verified resolved: the IP audit of ${new Date().toISOString().slice(0, 10)} no longer finds it.`, 'auto-verify', {}, s);
    stored.set(id, s);
  }
  return stored;
}

/** Every recommendation id recorded in a release, so items fixed before they were ever stored still close. */
function releasedIds(prefix) {
  return (implementation.releases || []).flatMap((r) => (r.items || []).map((i) => i.id)).filter((id) => !prefix || prefix.test(id));
}

async function auditTrail(limit = 200) {
  const rows = await store.opsList('ip-audit-log');
  return rows.sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, limit);
}

module.exports = { reconcile, setStatus, log, auditTrail, releasedIds, shipped, OPEN, implementation };
