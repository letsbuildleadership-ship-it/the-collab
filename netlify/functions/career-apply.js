// Careers application (pages/careers.html). Public: no account needed.
// Each submission is saved to the owner's operations store (Netlify Blobs,
// "collab-ops" -> career-applications/{id}.json; nothing is published) and
// emailed to the owner through the site's existing mailer (lib/mailer.js:
// OWNER_EMAIL, else the configured sending account). Submitting creates no
// employment, engagement or compensation.
const crypto = require('crypto');
const store = require('./lib/store');
const { json, CORS_HEADERS } = require('./lib/http');
const { sendMail } = require('./lib/mailer');

const AREAS = {
  'sales-partner': 'Independent Sales Partner',
  'strategic-collaborator': 'Strategic Collaborator',
  'future-opportunities': 'Future Opportunities',
};
const DAILY_LIMIT = 5; // submissions per network address per day
const EMAIL_RE = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/;

const line = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
const block = (s, n) => String(s == null ? '' : s).replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, n);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function validate(body) {
  const v = {
    fullName: line(body.fullName, 120),
    email: line(body.email, 200).toLowerCase(),
    country: line(body.country, 80),
    area: line(body.area, 40),
    experience: block(body.experience, 2000),
    website: line(body.website, 300),
    introduction: block(body.introduction, 1500),
    consent: body.consent === true || body.consent === 'yes' || body.consent === 'on',
  };
  const errors = {};
  if (v.fullName.length < 2) errors.fullName = 'Enter your full legal name.';
  if (!EMAIL_RE.test(v.email)) errors.email = 'Enter a valid email address.';
  if (v.country.length < 2) errors.country = 'Enter your country of residence.';
  if (!AREAS[v.area]) errors.area = 'Choose an area of interest.';
  if (v.experience.length < 20) errors.experience = 'Describe your relevant experience (at least 20 characters).';
  if (v.introduction.length < 20) errors.introduction = 'Write a short introduction (at least 20 characters).';
  if (v.website) {
    let u = v.website;
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    try {
      const parsed = new URL(u);
      if (!/^https?:$/.test(parsed.protocol) || !parsed.hostname.includes('.')) throw new Error('bad');
      v.website = parsed.href;
    } catch (e) { errors.website = 'Enter a valid web address, or leave it blank.'; }
  }
  if (!v.consent) errors.consent = 'Please agree to be contacted about your application.';
  return { v, errors };
}

function clientKey(event) {
  const h = event.headers || {};
  const ip = h['x-nf-client-connection-ip'] || h['client-ip'] || String(h['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  return crypto.createHash('sha256').update(`careers:${ip}`).digest('hex').slice(0, 32);
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  if (event.body && event.body.length > 20000) return json(413, { error: 'Application is too long.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  if (!body || typeof body !== 'object') return json(400, { error: 'Invalid request body.' });

  // Honeypot: real visitors never see or fill this field. Answer as if accepted.
  if (line(body.org_url, 200)) return json(201, { ok: true });

  const { v, errors } = validate(body);
  if (Object.keys(errors).length) return json(400, { error: 'Please correct the highlighted fields.', fields: errors });

  const today = new Date().toISOString().slice(0, 10);
  const who = clientKey(event);
  const rate = (await store.opsGet('career-rate', `${today}-${who}`)) || { count: 0 };
  if (rate.count >= DAILY_LIMIT) return json(429, { error: 'Thank you. We have received several applications from this connection today. Please try again tomorrow.' });
  await store.opsPut('career-rate', `${today}-${who}`, { count: rate.count + 1 });

  const id = `app-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const item = {
    id,
    createdAt: new Date().toISOString(),
    fullName: v.fullName,
    email: v.email,
    country: v.country,
    area: v.area,
    areaLabel: AREAS[v.area],
    experience: v.experience,
    website: v.website || null,
    introduction: v.introduction,
    consentToContact: true,
    status: 'new',
  };
  try {
    await store.opsPut('career-applications', id, item);
  } catch (err) {
    console.error('Career application save failed:', err.message);
    return json(500, { error: 'We could not save your application. Please try again shortly.' });
  }

  try {
    const to = process.env.OWNER_EMAIL || process.env.SMTP_USER || 'letsbuildleadership@gmail.com';
    const rows = [
      ['Full legal name', item.fullName], ['Email', item.email], ['Country of residence', item.country],
      ['Area of interest', item.areaLabel], ['Portfolio or website', item.website || '—'],
      ['Relevant experience', item.experience], ['Introduction', item.introduction],
      ['Consent to be contacted', 'Yes'], ['Reference', item.id],
    ];
    await sendMail({
      to,
      replyTo: item.email,
      subject: `Careers application: ${item.areaLabel} · ${item.fullName} (${item.country})`,
      text: rows.map(([k, val]) => `${k}:\n${val}`).join('\n\n'),
      html: `<h2 style="font-family:Arial,sans-serif;">New Careers application</h2>${rows.map(([k, val]) => `<p style="font-family:Arial,sans-serif;"><strong>${esc(k)}</strong><br/>${esc(val).replace(/\n/g, '<br/>')}</p>`).join('')}`,
    });
  } catch (err) {
    console.error('Career application email failed (application is saved):', err.message);
  }
  return json(201, { ok: true, reference: id });
};

exports._validate = validate;
exports.AREAS = AREAS;
