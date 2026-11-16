// Introductions between The .LLab Collaborating Companies: a signed-in, eligible member
// asks to work with a listed company (optionally about its member offer). The listed
// company's member receives the request by email with the requester's address as
// reply-to, and decides whether to answer. Only anonymous counts are kept (type and
// date, never who asked whom), for the yearly Omnidirectional Enterprise™ report.
const crypto = require('crypto');
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { resolveAccess } = require('./lib/access');
const { isEligible } = require('./lib/directory');
const { sendMail } = require('./lib/mailer');

const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Sign in to request an introduction.' });
  const me = await store.getCustomerByToken(token);
  if (!me || !me.memberId) return json(401, { error: 'Invalid or expired access link.' });
  if (!isEligible(await resolveAccess(me))) return json(403, { error: 'Introductions are part of a .LLab™ license or Membership.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const message = clean(body.message, 800);
  if (message.length < 20) return json(400, { error: 'Say in a sentence or two what you would like to explore together.' });
  const fromCompany = clean(body.fromCompany, 80);
  const viaOffer = body.viaOffer === true;

  const all = await store.opsList('directory');
  const target = all.find((l) => l.status === 'approved' && l.publicId === String(body.listingId || ''));
  if (!target) return json(404, { error: 'That company is not listed.' });
  if (target.memberId === me.memberId) return json(400, { error: 'That is your own company.' });
  if (viaOffer && !target.offer) return json(400, { error: 'That company has no member offer.' });

  const today = new Date().toISOString().slice(0, 10);
  const day = me.introDay && me.introDay.date === today ? me.introDay : { date: today, count: 0 };
  if (day.count >= 5) return json(429, { error: 'That is five introductions today. Please continue tomorrow.' });

  const ownerToken = await store.getTokenByMemberId(target.memberId);
  const owner = ownerToken && (await store.getCustomerByToken(ownerToken));
  const to = (owner && owner.email) || target.contactEmail;
  if (!to) return json(503, { error: 'That company cannot receive introductions right now.' });

  const who = fromCompany ? `${fromCompany} (a member of The .LLab Collaborating Companies)` : 'A member of The .LLab Collaborating Companies';
  const subject = viaOffer ? `${fromCompany || 'A member'} is interested in your member offer` : `Introduction request from ${fromCompany || 'a fellow member'}`;
  const lines = [
    `${who} would like to work with ${target.companyName}${viaOffer ? `, about your member offer: "${target.offer.text}"` : ''}.`,
    '',
    message,
    '',
    `Reply to this email to answer them directly at ${me.email}. Whether you answer is entirely your decision.`,
    '',
    'The Co.LLab™ · The .LLab Collaborating Companies',
  ];
  try {
    await sendMail({ to, replyTo: me.email, subject, text: lines.join('\n'), html: lines.map((l) => (l ? `<p>${esc(l)}</p>` : '')).join('') });
  } catch (err) {
    console.error('Introduction email failed:', err.message);
    return json(502, { error: 'The introduction could not be sent. Please try again.' });
  }
  me.introDay = { date: today, count: day.count + 1 };
  await store.saveCustomer(me);
  const id = `${today}-${crypto.randomBytes(5).toString('hex')}`;
  await store.opsPut('eco-events', id, { id, type: viaOffer ? 'offer' : 'intro', date: today });
  return json(200, { ok: true });
};
