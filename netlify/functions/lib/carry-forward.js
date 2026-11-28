// Carry-forward: what a member already wrote in one IP follows them into the next, so the
// same mission, vision, purpose, values or legacy statement is never typed twice across
// The IV Phases™. Only the member's own words are offered, only from their own record,
// and never filled in for them: the quest page shows each one as a suggestion they can
// use or ignore (customer-entered information stays customer-entered).
const { quests } = require('./quests');

// A prompt asks for one of these when it opens with the topic (tested against every quest
// in test/ip-integration.test.js so the matches stay exact, not "mentions mission somewhere").
const TOPICS = [
  ['mission', 'Mission', /^(?:what is (?:our|your|my) mission|my mission\b|our mission\b)/i],
  ['vision', 'Vision', /^(?:what is (?:our|your|my) vision|our vision\b)/i],
  ['purpose', 'Purpose', /^(?:what is (?:our|your|my) purpose|the purpose of the enterprise|our purpose\b)/i],
  ['values', 'Values', /^(?:our core values|the values that shall govern|our leadership values)/i],
  ['legacy-statement', 'Legacy statement', /^what is (?:our|your|my) legacy statement/i],
];

const topicOf = (node) => {
  if (!node || node.type !== 'text') return null;
  const t = TOPICS.find(([, , re]) => re.test(String(node.prompt || '').trim()));
  return t ? { id: t[0], label: t[1] } : null;
};

/**
 * For each text step of `quest` that asks for a topic the member already answered in another
 * quest, the most recent answer: { [nodeId]: { topic, label, value, fromKey, fromTitle, at } }.
 */
function carryFor(quest, record) {
  const out = {};
  if (!quest || !record || !record.quests) return out;
  const wanted = new Map();
  for (const n of quest.nodes || []) {
    const t = topicOf(n);
    if (t && !wanted.has(t.id)) wanted.set(t.id, { node: n, label: t.label });
  }
  if (!wanted.size) return out;
  const found = new Map();
  for (const [k, saved] of Object.entries(record.quests)) {
    if (k === quest.key || !saved || !saved.answers) continue;
    const other = quests.get(k);
    if (!other) continue;
    const at = saved.completedAt || saved.updatedAt || '';
    for (const n of other.nodes || []) {
      const t = topicOf(n);
      const v = saved.answers[n.id];
      if (!t || !wanted.has(t.id) || typeof v !== 'string' || !v.trim()) continue;
      const prev = found.get(t.id);
      if (!prev || String(at) > String(prev.at)) found.set(t.id, { value: v.trim().slice(0, 1000), fromKey: k, fromTitle: other.title, at });
    }
  }
  for (const [topic, f] of found) {
    const w = wanted.get(topic);
    out[w.node.id] = { topic, label: w.label, ...f };
  }
  return out;
}

module.exports = { carryFor, topicOf, TOPICS };
