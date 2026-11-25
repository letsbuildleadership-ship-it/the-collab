const { ownerLink } = require('./lib/owner-link');
// Public list of approved companies (GET), plus the signed-in member's own
// listing (GET ?mine=1, POST to save, POST { action: 'remove' } to take it down).
// Every save goes back to "pending" and is reviewed before it appears.
const crypto = require('crypto');
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { resolveAccess } = require('./lib/access');
const { isEligible, validateListing, publicView, DIRECTIONS, CATEGORIES, SEEKING } = require('./lib/directory');
const { sendMail } = require('./lib/mailer');

const COLLECTION = 'directory';

// Introductions: a signed-in member asks to be introduced to a listed enterprise that has opted
// in to introductions. The listing's owner receives the request by email at their account address
// (never shown to the requester) with the requester's name, email and message, and replies only if
// they choose. Each introduction is counted (no names, no words) for the annual Omnidirectional
// Enterprise™ report.
async function requestIntro(stored, body) {
  if (stored.emailVerified === false) return json(403, { error: 'Confirm your email first, so the enterprise can reply to you.' });
  const all = await store.opsList(COLLECTION);
  const target = all.find((l) => l.publicId === String(body.listingId || '') && l.status === 'approved');
  if (!target || target.introOptIn !== true) return json(404, { error: 'This enterprise is not taking introductions.' });
  if (target.memberId === stored.memberId) return json(400, { error: 'That is your own enterprise.' });
  const message = String(body.message || '').replace(/\s+/g, ' ').trim().slice(0, 800);
  if (message.length < 20) return json(400, { error: 'Say who you are and why you would like to connect (at least 20 characters).' });
  const today = new Date().toISOString().slice(0, 10);
  const day = stored.introDay && stored.introDay.date === today ? stored.introDay : { date: today, count: 0 };
  if (day.count >= 3) return json(429, { error: 'You can request three introductions a day.' });
  stored.introDay = { date: today, count: day.count + 1 };
  await store.saveCustomer(stored);

  const token = await store.getTokenByMemberId(target.memberId);
  const owner = token && (await store.getCustomerByToken(token));
  if (!owner || !owner.email) return json(404, { error: 'This enterprise is not taking introductions.' });
  const mineListing = await store.opsGet(COLLECTION, stored.memberId);
  const from = `${stored.name || stored.email}${mineListing && mineListing.status === 'approved' ? ` (${mineListing.companyName})` : ''}`;
  const esc = (x) => String(x).replace(/</g, '&lt;');
  await sendMail({
    to: owner.email,
    replyTo: stored.email,
    subject: `Introduction request through the .LLab Collaborating Enterprises: ${from}`,
    text: `${from} asked to be introduced to ${target.companyName} through the .LLab Collaborating Enterprises.\n\nTheir message:\n${message}\n\nReply to this email to answer them directly (${stored.email}). If you would rather not, no reply is needed. You can stop introductions any time on your enterprise page.`,
    html: `<p><strong>${esc(from)}</strong> asked to be introduced to ${esc(target.companyName)} through the .LLab Collaborating Enterprises.</p><p><em>Their message:</em><br/>${esc(message)}</p><p>Reply to this email to answer them directly (${esc(stored.email)}). If you would rather not, no reply is needed. You can stop introductions any time on your enterprise page.</p>`,
  });
  const at = new Date().toISOString();
  await store.opsPut('ecosystem-events', `intro-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`, { kind: 'intro', at, directions: target.directions || [] });
  return json(200, { ok: true });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  const qs = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && !qs.mine) {
    // Signed-in members also see the member offers; everyone else sees only that an offer exists.
    const t = tokenFromEvent(event);
    const viewer = qs.members && t ? await store.getCustomerByToken(t) : null;
    const all = await store.opsList(COLLECTION);
    const listings = all.filter((l) => l.status === 'approved').sort((a, b) => a.companyName.localeCompare(b.companyName)).map((l) => publicView(l, { member: !!viewer }));
    return json(200, { directions: DIRECTIONS, categories: CATEGORIES, seeking: SEEKING, member: !!viewer, listings }, { 'Cache-Control': viewer ? 'private, no-store' : 'public, max-age=60' });
  }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const stored = await store.getCustomerByToken(token);
  if (!stored || !stored.memberId) return json(401, { error: 'Invalid or expired access link.' });
  const eligible = isEligible(await resolveAccess(stored));
  const mine = await store.opsGet(COLLECTION, stored.memberId);

  if (event.httpMethod === 'GET') {
    return json(200, { eligible, directions: DIRECTIONS, listing: mine ? { ...mine, memberId: undefined } : null });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }

  if (body.action === 'remove') {
    if (mine) await store.opsDelete(COLLECTION, stored.memberId);
    return json(200, { ok: true });
  }
  if (body.action === 'intro') return requestIntro(stored, body);
  if (!eligible) return json(403, { error: 'The .LLab Collaborating Enterprises is open to enterprises that license Co.LLab™ IP (any .LLab™ product) or hold a Membership.' });

  const today = new Date().toISOString().slice(0, 10);
  const day = stored.directoryDay && stored.directoryDay.date === today ? stored.directoryDay : { date: today, count: 0 };
  if (day.count >= 10) return json(429, { error: 'Too many saves today. Please try again tomorrow.' });

  const v = validateListing(body);
  if (v.error) return json(400, { error: v.error });

  stored.directoryDay = { date: today, count: day.count + 1 };
  await store.saveCustomer(stored);

  const listing = {
    ...v.listing,
    memberId: stored.memberId,
    publicId: (mine && mine.publicId) || crypto.randomBytes(6).toString('hex'),
    status: 'pending',
    note: null,
    updatedAt: new Date().toISOString(),
    approvedAt: null,
  };
  await store.opsPut(COLLECTION, stored.memberId, listing);

  try {
    await sendMail({
      to: process.env.OWNER_EMAIL || process.env.SMTP_USER || 'letsbuildleadership@gmail.com',
      subject: `Collaborating enterprise to review: ${listing.companyName}`,
      text: `${listing.companyName}\n${listing.description}\n\nReview it: ${ownerLink('collaborating-companies.html')}`,
      html: `<p><strong>${listing.companyName.replace(/</g, '&lt;')}</strong></p><p>${listing.description.replace(/</g, '&lt;')}</p><p><a href="${ownerLink('collaborating-companies.html')}">Review it</a></p>`,
    });
  } catch (err) {
    console.error('The .LLab Collaborating Enterprises review email failed:', err.message);
  }
  return json(200, { listing: { ...listing, memberId: undefined } });
};
