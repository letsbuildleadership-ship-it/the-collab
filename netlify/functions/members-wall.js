// Public, unauthenticated: the Membership Legacy Wall. Once a member, always a
// member: everyone who has held a confirmed account, a Membership, a purchase or
// a Partnership, grouped by the highest standing they have ever held. Names only
// (no Member Numbers, emails or purchases); members without a name, test accounts
// and replaced sign-ups never appear.
const store = require('./lib/store');
const { json } = require('./lib/http');

const GROUPS = [
  { key: 'partnership', label: 'Partnership Members' },
  { key: 'llab', label: '.LLab Members' },
  { key: 'community', label: 'Community Members' },
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  try {
    const members = (await store.listMembers()).filter((m) => m.name && String(m.name).trim());
    const groups = GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      members: members
        .filter((m) => m.standing === g.key)
        .sort((a, b) => String(a.since).localeCompare(String(b.since)))
        .map((m) => ({ displayName: String(m.name).trim() })),
    }));
    return json(200, { total: members.length, groups }, { 'Cache-Control': 'public, max-age=60' });
  } catch (err) {
    console.error('members-wall error', err);
    return json(500, { error: 'Could not load the Membership Legacy Wall.' });
  }
};
