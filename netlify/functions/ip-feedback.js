// Members tell The Co.LLab™ how to improve the IP and how to better support the
// Omnidirectional Enterprise™ ecosystem. Each submission is saved for the
// owner's IP review (nothing is published) and the owner is emailed.
const store = require('./lib/store');
const { tokenFromEvent, json, CORS_HEADERS } = require('./lib/http');
const { quests } = require('./lib/quests');
const { sendMail } = require('./lib/mailer');

const clean = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  const token = tokenFromEvent(event);
  if (!token) return json(401, { error: 'Not signed in.' });
  const record = await store.getCustomerByToken(token);
  if (!record) return json(401, { error: 'Invalid or expired access link.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const quest = quests.get(String(body.questKey || ''));
  const unclear = clean(body.unclear, 800);
  const support = clean(body.support, 800);
  const ecosystem = clean(body.ecosystem, 800);
  if (!quest) return json(400, { error: 'Unknown quest.' });
  if (!unclear && !support && !ecosystem) return json(400, { error: 'Write something in at least one box.' });

  const today = new Date().toISOString().slice(0, 10);
  const day = record.ipFeedbackDay && record.ipFeedbackDay.date === today ? record.ipFeedbackDay : { date: today, count: 0 };
  if (day.count >= 5) return json(429, { error: 'Thank you. That is plenty for today.' });
  record.ipFeedbackDay = { date: today, count: day.count + 1 };
  await store.saveCustomer(record);

  const item = {
    id: `fb-${Date.now()}-${(record.memberId || 'm').replace(/\W/g, '')}`,
    createdAt: new Date().toISOString(),
    questKey: quest.key,
    questTitle: quest.title,
    memberId: record.memberId || null,
    unclear,
    support,
    ecosystem,
    status: 'new',
    note: null,
    decidedAt: null,
  };
  await store.opsPut('ip-feedback', item.id, item);

  try {
    const to = process.env.OWNER_EMAIL || process.env.SMTP_USER || 'letsbuildleadership@gmail.com';
    const lines = [['Unclear or missing', unclear], ['How The Co.LLab™ could support their organization', support], ['How it could support the Omnidirectional Enterprise™ ecosystem', ecosystem]].filter(([, v]) => v);
    await sendMail({
      to,
      subject: `New IP feedback on ${quest.title}`,
      text: `${lines.map(([k, v]) => `${k}:\n${v}`).join('\n\n')}\n\nDecide on it in your IP review: https://wearethellab.netlify.app/admin/ip-feedback.html`,
      html: `<p><strong>${quest.title}</strong></p>${lines.map(([k, v]) => `<p><em>${k}</em><br/>${v.replace(/</g, '&lt;')}</p>`).join('')}<p><a href="https://wearethellab.netlify.app/admin/ip-feedback.html">Decide on it in your IP review</a></p>`,
    });
  } catch (err) {
    console.error('IP feedback email failed:', err.message);
  }
  return json(201, { ok: true });
};
