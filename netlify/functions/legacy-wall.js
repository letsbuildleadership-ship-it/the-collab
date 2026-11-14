// Public, unauthenticated: the Omnidirectional Legacy Wall on
// pages/omnidirectional-enterprise.html. One wall for everyone who participates
// in The Co.LLab(TM) (free members, The .LLab Members, product owners, creators,
// Partners, Founders and charity partners), organized by the Omnidirectional
// Enterprise(TM) area they take part in. Someone who participates in several areas
// appears in each. Once a member, always a member: lapsed terms never remove
// anyone. Names only, plus the website link a member who has purchased chose to add.
const store = require('./lib/store');
const pricing = require('./lib/pricing');
const { json } = require('./lib/http');

const bySince = (a, b) => String(a.since).localeCompare(String(b.since));
const plaque = (m) => ({ displayName: String(m.name).trim(), url: m.url || null });
const named = (list) => list.filter((m) => m.name && String(m.name).trim()).sort(bySince).map(plaque);

function buildWall(people) {
  const reg = pricing.registry;
  const creatorKeys = new Set((reg.products || []).filter((p) => p.line === 'creator').map((p) => p.key));
  const productKeys = new Set([...(reg.products || []).filter((p) => !p.founder_rank && p.line !== 'creator').map((p) => p.key), ...(reg.blueprint_series || []).map((p) => p.key)]);
  const partnerTiers = (reg.partnerships || []).slice().reverse();
  const founderLevels = pricing.recognitionLevels().slice().reverse();
  const memberships = reg.memberships || [];
  const nodes = [
    { node: 'Enterprises', page: 'partnership.html', where: 'Partnership™', groups: partnerTiers.map((t) => ({ label: `${t.tier_label} Partners`, members: named(people.filter((p) => p.partnershipKey === t.key)) })) },
    { node: 'Communities', page: 'founders.html', where: 'The Co.LLab Founders Organization™', groups: founderLevels.map((l) => ({ label: l.label, members: named(people.filter((p) => p.founderLevel === l.key)) })) },
    { node: 'Nonprofits', page: 'impact.html', where: 'The .LLab Impact™', groups: [{ label: 'Charity partners', members: (pricing.impactPartners() || []).map((n) => ({ displayName: n.name, url: n.website || null })) }] },
    { node: 'People', page: 'products.html', where: 'The .LLab™ Membership', groups: [
      ...memberships.map((m) => ({ label: `${m.name} Members`, members: named(people.filter((p) => p.membershipKeys.includes(m.key))) })),
      { label: 'Community Members', members: named(people.filter((p) => p.free)) },
    ] },
    { node: 'Products & Services', page: 'all-products.html', where: 'The .LLab Products™', groups: [{ label: 'The .LLab product owners', members: named(people.filter((p) => p.purchasedKeys.some((k) => productKeys.has(k)))) }] },
    { node: 'Creators', page: 'creator.html', where: 'The .LLab Creators™', groups: [{ label: 'The .LLab Creators™', members: named(people.filter((p) => p.purchasedKeys.some((k) => creatorKeys.has(k)))) }] },
    { node: 'Capital', page: 'founders.html', where: 'Founders and Partners who fund the build', groups: [] },
    { node: 'Knowledge + IP', page: 'think.html', where: 'The .LLab R.A.T.™ · Research And Theory', groups: [] },
    { node: 'Technology', page: 'technology.html', where: 'Technology · The .LLab Legacy Ventures™', groups: [] },
  ];
  for (const n of nodes) n.groups = n.groups.filter((g) => g.members.length);
  return nodes;
}

exports.buildWall = buildWall;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  try {
    const nodes = buildWall(await store.listParticipants());
    const total = nodes.reduce((n, x) => n + x.groups.reduce((m, g) => m + g.members.length, 0), 0);
    return json(200, { total, nodes }, { 'Cache-Control': 'public, max-age=60' });
  } catch (err) {
    console.error('legacy-wall error', err);
    return json(500, { error: 'Could not load the Omnidirectional Legacy Wall.' });
  }
};
