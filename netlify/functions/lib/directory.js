// Collaborating Companies: companies that license Co.LLab™ IP (any paid .LLab™ product)
// or hold a Membership collaborate through the Omnidirectional Enterprise™, and
// show what they offer so others can work with them directly. Part of the license
// and the Membership, opt-in, and reviewed before it appears. Founders purchases
// alone do not qualify (Founders is not a membership).
const membershipStatus = require('./membership-status');
const pricing = require('./pricing');

const DIRECTIONS = ['Businesses', 'Nonprofits', 'Communities', 'People', 'Technology', 'Capital', 'Knowledge + IP', 'Creators'];
const KINDS = ['product', 'service'];

const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

function isEligible(access) {
  const keys = membershipStatus.effectiveEntitlements(access).filter((k) => !pricing.founderRankForKey(k));
  return keys.length > 0 || membershipStatus.activeMembershipKeys(access).length > 0;
}

/** https only, no credentials, a real host; returns '' when empty and null when invalid. */
function cleanUrl(raw) {
  const t = String(raw || '').trim();
  if (!t) return '';
  let u;
  try { u = new URL(t); } catch (e) { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  if (!/\.[a-z]{2,}$/i.test(u.hostname) || /^\d+(\.\d+){3}$/.test(u.hostname)) return null;
  return u.toString().slice(0, 300);
}

function validateListing(raw) {
  const input = raw && typeof raw === 'object' ? raw : {};
  const companyName = clean(input.companyName, 80);
  if (companyName.length < 2) return { error: 'Add your company name.' };
  const description = clean(input.description, 600);
  if (description.length < 20) return { error: 'Describe what your company does in a sentence or two (at least 20 characters).' };

  const website = cleanUrl(input.website);
  if (website === null) return { error: 'Website must be a full https:// address.' };
  const contactEmail = clean(input.contactEmail, 120).toLowerCase();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: 'That contact email does not look right.' };
  if (!website && !contactEmail) return { error: 'Add a website or a contact email so members can reach you.' };

  const directions = [...new Set((Array.isArray(input.directions) ? input.directions : []).filter((d) => DIRECTIONS.includes(d)))].slice(0, 3);
  if (!directions.length) return { error: 'Choose one to three directions your company serves.' };

  const offerings = [];
  for (const o of (Array.isArray(input.offerings) ? input.offerings : []).slice(0, 6)) {
    const name = clean(o && o.name, 60);
    if (!name) continue;
    const url = cleanUrl(o.url);
    if (url === null) return { error: `The link for "${name}" must be a full https:// address.` };
    offerings.push({ name, kind: KINDS.includes(o.kind) ? o.kind : 'service', description: clean(o.description, 200), url });
  }
  if (!offerings.length) return { error: 'List at least one product or service you offer.' };

  return { listing: { companyName, tagline: clean(input.tagline, 140), description, location: clean(input.location, 60), website, contactEmail, directions, offerings } };
}

/** What the public may see: no member identity or account email. */
function publicView(l) {
  return { id: l.publicId, companyName: l.companyName, tagline: l.tagline, description: l.description, location: l.location, website: l.website, contactEmail: l.contactEmail, directions: l.directions, offerings: l.offerings, approvedAt: l.approvedAt };
}

module.exports = { DIRECTIONS, isEligible, validateListing, publicView, cleanUrl };
