// Public list of approved companies (GET), plus the signed-in member's own
// listing (GET ?mine=1, POST to save, POST { action: 'remove' } to take it down).
// Every save goes back to "pending" and is reviewed before it appears.
const crypto = require('crypto');
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { resolveAccess } = require('./lib/access');
const { isEligible, validateListing, publicView, DIRECTIONS } = require('./lib/directory');
const { sendMail } = require('./lib/mailer');

const COLLECTION = 'directory';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  const qs = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && !qs.mine) {
    const all = await store.opsList(COLLECTION);
    const listings = all.filter((l) => l.status === 'approved').sort((a, b) => a.companyName.localeCompare(b.companyName)).map(publicView);
    return json(200, { directions: DIRECTIONS, listings }, { 'Cache-Control': 'public, max-age=60' });
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
  if (!eligible) return json(403, { error: 'Collaborating Companies is open to companies that license Co.LLab™ IP (any .LLab™ product) or hold a Membership.' });

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
      subject: `Collaborating company to review: ${listing.companyName}`,
      text: `${listing.companyName}\n${listing.description}\n\nReview it: https://wearethellab.netlify.app/admin/collaborating-companies.html`,
      html: `<p><strong>${listing.companyName.replace(/</g, '&lt;')}</strong></p><p>${listing.description.replace(/</g, '&lt;')}</p><p><a href="https://wearethellab.netlify.app/admin/collaborating-companies.html">Review it</a></p>`,
    });
  } catch (err) {
    console.error('Collaborating Companies review email failed:', err.message);
  }
  return json(200, { listing: { ...listing, memberId: undefined } });
};
