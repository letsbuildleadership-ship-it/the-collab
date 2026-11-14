/**
 * Membership standing, permanent: once a member, always a member. The highest
 * standing a person has ever held (a Partnership, any paid Membership or purchase,
 * or a confirmed free account), never taken away when a term lapses.
 */
function memberStanding(r) {
  if (!r) return null;
  if (r.partnership || r.seat) return { key: 'partnership', label: 'Partnership Members', rank: 3 };
  if (Object.keys(r.memberships || {}).length || (r.purchases || []).length) return { key: 'llab', label: '.LLab Members', rank: 2 };
  if (r.signupSource !== 'free' || r.emailVerified === true) return { key: 'community', label: 'Community Members', rank: 1 };
  return null;
}

module.exports = { memberStanding };
