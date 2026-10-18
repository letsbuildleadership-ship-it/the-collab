// Owner-only review of Directory listings: approve or reject, with a note the
// member sees. Approving or rejecting emails the member.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { sendMail } = require('./lib/mailer');

function authorized(event) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = event.headers['x-admin-token'] || event.headers['X-Admin-Token'];
  return header === expected;
}

exports.handler = async (event) => {
  if (!authorized(event)) return json(401, { error: 'Unauthorized.' });
  if (event.httpMethod === 'GET') {
    const rows = await store.opsList('directory');
    rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return json(200, { listings: rows });
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Invalid request body.' }); }
  const status = String(body.status || '');
  if (!['approved', 'rejected', 'pending'].includes(status)) return json(400, { error: 'Unknown status.' });
  const note = String(body.note || '').trim().slice(0, 500) || null;
  if (status === 'rejected' && !note) return json(400, { error: 'Add a note so the member knows what to change.' });
  const item = await store.opsGet('directory', body.memberId);
  if (!item) return json(404, { error: 'Not found.' });
  const updated = { ...item, status, note, approvedAt: status === 'approved' ? new Date().toISOString() : null };
  await store.opsPut('directory', body.memberId, updated);

  if (status !== 'pending') {
    try {
      const token = await store.getTokenByMemberId(item.memberId);
      const record = token && (await store.getCustomerByToken(token));
      if (record && record.email) {
        const text = status === 'approved'
          ? `Your company, ${item.companyName}, is now listed in the Omnidirectional Enterprise™ Directory: https://wearethellab.netlify.app/pages/directory.html`
          : `Your Directory listing for ${item.companyName} needs a change before it can appear:\n\n${note}\n\nEdit it here: https://wearethellab.netlify.app/pages/directory.html`;
        await sendMail({ to: record.email, subject: status === 'approved' ? 'You are listed in the Directory' : 'Your Directory listing needs a change', text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>` });
      }
    } catch (err) {
      console.error('Directory decision email failed:', err.message);
    }
  }
  return json(200, { ok: true });
};
