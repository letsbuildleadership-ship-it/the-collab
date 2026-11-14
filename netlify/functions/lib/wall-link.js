// Legacy Wall links: once a member has purchased (a product, a Membership,
// a Partnership or a founding level), they may link their name on the Legacy
// Walls to their website. Only plain https web addresses are accepted.
const { memberStanding } = require('./member-standing');

function canLinkOnWall(record) {
  if (!record) return false;
  if (record.founder) return true;
  const s = memberStanding(record);
  return !!s && s.key !== 'community';
}

/** A clean https URL, or null to remove, or { error }. */
function cleanWallUrl(input) {
  const raw = String(input == null ? '' : input).trim();
  if (!raw) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch (e) {
    return { error: 'Enter a web address, like yourcompany.com.' };
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { error: 'Enter a web address, like yourcompany.com.' };
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(url.hostname)) return { error: 'Enter a web address, like yourcompany.com.' };
  if (url.username || url.password) return { error: 'Enter a web address, like yourcompany.com.' };
  url.protocol = 'https:';
  const out = url.toString();
  return out.length > 200 ? { error: 'That web address is too long.' } : out;
}

module.exports = { canLinkOnWall, cleanWallUrl };
