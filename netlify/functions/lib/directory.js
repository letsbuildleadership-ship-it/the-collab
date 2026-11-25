// The .LLab Collaborating Companies: companies that license Co.LLab™ IP (any paid .LLab™ product)
// or hold a Membership collaborate through the Omnidirectional Enterprise™, and
// show what they offer so others can work with them directly. Part of the license
// and the Membership, opt-in, and reviewed before it appears. Founders purchases
// alone do not qualify (Founders is not a membership).
const membershipStatus = require('./membership-status');
const pricing = require('./pricing');

// The nine directions of the Omnidirectional Enterprise™ (the same substations as the model and the IP analysis).
const DIRECTIONS = ['Enterprises', 'Nonprofits', 'Communities', 'People', 'Products & Services', 'Technology', 'Capital', 'Knowledge + IP', 'Creators'];
const KINDS = ['product', 'service'];
// An enterprise listing, or a Nonprofit & Community listing that can ask for skills or volunteers.
const CATEGORIES = ['enterprise', 'nonprofit-community'];
const REQUEST_KINDS = ['skill', 'volunteer'];
// Optional flags for successor and apprentice matching.
const SEEKING = ['successor', 'apprenticeship'];

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
  if (companyName.length < 2) return { error: 'Add your enterprise name.' };
  const description = clean(input.description, 600);
  if (description.length < 20) return { error: 'Describe what your enterprise does in a sentence or two (at least 20 characters).' };

  const website = cleanUrl(input.website);
  if (website === null) return { error: 'Website must be a full https:// address.' };
  const contactEmail = clean(input.contactEmail, 120).toLowerCase();
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: 'That contact email does not look right.' };
  if (!website && !contactEmail) return { error: 'Add a website or a contact email so members can reach you.' };

  const directions = [...new Set((Array.isArray(input.directions) ? input.directions : []).map((d) => (d === 'Businesses' ? 'Enterprises' : d)).filter((d) => DIRECTIONS.includes(d)))].slice(0, 3);
  if (!directions.length) return { error: 'Choose one to three directions your enterprise serves.' };

  const offerings = [];
  for (const o of (Array.isArray(input.offerings) ? input.offerings : []).slice(0, 6)) {
    const name = clean(o && o.name, 60);
    if (!name) continue;
    const url = cleanUrl(o.url);
    if (url === null) return { error: `The link for "${name}" must be a full https:// address.` };
    offerings.push({ name, kind: KINDS.includes(o.kind) ? o.kind : 'service', description: clean(o.description, 200), url });
  }
  const category = CATEGORIES.includes(input.category) ? input.category : 'enterprise';
  const requests = category === 'nonprofit-community'
    ? (Array.isArray(input.requests) ? input.requests : []).slice(0, 4).map((r) => ({ kind: REQUEST_KINDS.includes(r && r.kind) ? r.kind : 'skill', text: clean(r && r.text, 200) })).filter((r) => r.text)
    : [];
  if (!offerings.length && !requests.length) return { error: 'List at least one product or service you offer.' };

  const seeking = [...new Set((Array.isArray(input.seeking) ? input.seeking : []).filter((x) => SEEKING.includes(x)))];
  const offerText = clean(input.memberOffer && input.memberOffer.text, 200);
  const offerTerms = clean(input.memberOffer && input.memberOffer.terms, 400);
  if (offerText && !offerTerms) return { error: 'Add the terms of your member offer (who it is for, how to claim it, and when it ends).' };
  const memberOffer = offerText ? { text: offerText, terms: offerTerms } : null;

  return { listing: { companyName, tagline: clean(input.tagline, 140), description, location: clean(input.location, 60), website, contactEmail, directions, offerings, category, requests, seeking, introOptIn: input.introOptIn === true, memberOffer } };
}

/**
 * What the public may see: no member identity or account email. The member offer (text and
 * terms) is for signed-in members only; the public only sees that one exists.
 */
function publicView(l, { member = false } = {}) {
  return {
    id: l.publicId, companyName: l.companyName, tagline: l.tagline, description: l.description, location: l.location, website: l.website, contactEmail: l.contactEmail,
    directions: l.directions, offerings: l.offerings || [], approvedAt: l.approvedAt,
    category: l.category || 'enterprise', requests: l.requests || [], seeking: l.seeking || [], acceptsIntros: l.introOptIn === true,
    hasMemberOffer: !!l.memberOffer, memberOffer: member && l.memberOffer ? l.memberOffer : undefined,
  };
}

module.exports = { DIRECTIONS, CATEGORIES, SEEKING, REQUEST_KINDS, isEligible, validateListing, publicView, cleanUrl };
