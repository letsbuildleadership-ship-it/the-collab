// Public, unauthenticated Legacy Walls. Once a member, always a member: names
// only (no Member Numbers, emails or purchases), grouped by the highest standing
// ever held; lapsed terms never remove anyone. Members without a name, test
// accounts and replaced sign-ups never appear.
//   ?wall=llab (default)  The .LLab Membership Legacy Wall: .LLab Members, Community Members
//   ?wall=partnership     The Partnership Legacy Wall: by Partnership tier, highest first
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

const LLAB = [
  { key: 'llab', label: '.LLab Members' },
  { key: 'community', label: 'Community Members' },
];

const bySince = (a, b) => String(a.since).localeCompare(String(b.since));
const plaque = (m) => ({ displayName: String(m.name).trim() });

function wallGroups(members, wall) {
  if (wall === 'partnership') {
    const tiers = (pricing.registry.partnerships || []).slice().reverse();
    return tiers.map((t) => ({
      key: t.key,
      label: `${t.tier_label} Partners`,
      members: members.filter((m) => m.partnershipKey === t.key).sort(bySince).map(plaque),
    }));
  }
  return LLAB.map((g) => ({ key: g.key, label: g.label, members: members.filter((m) => m.standing === g.key).sort(bySince).map(plaque) }));
}

exports.wallGroups = wallGroups;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const wall = ((event.queryStringParameters || {}).wall === 'partnership') ? 'partnership' : 'llab';
  try {
    const members = (await store.listMembers()).filter((m) => m.name && String(m.name).trim());
    const groups = wallGroups(members, wall);
    const total = groups.reduce((n, g) => n + g.members.length, 0);
    return json(200, { wall, total, groups }, { 'Cache-Control': 'public, max-age=60' });
  } catch (err) {
    console.error('members-wall error', err);
    return json(500, { error: 'Could not load the Legacy Wall.' });
  }
};
