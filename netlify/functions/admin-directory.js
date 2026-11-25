// Owner-only review of The .LLab Collaborating Companies pages: approve or reject, with a note the
// member sees. Approving or rejecting emails the member.
const store = require('./lib/store');
const { json } = require('./lib/http');
const { sendMail } = require('./lib/mailer');

const { isAdmin: authorized } = require('./lib/admin-auth');
const { DIRECTIONS } = require('./lib/directory');

/**
 * The data for the annual Omnidirectional Enterprise™ report, counted from the start: introductions
 * and member offers by year and direction, and what the live directory holds today. Counts only.
 */
function ecosystemReport(rows, events) {
  const live = rows.filter((l) => l.status === 'approved');
  const years = {};
  events.forEach((e) => {
    const y = String(e.at).slice(0, 4);
    const b = (years[y] = years[y] || { year: y, intros: 0, offers: 0, byDirection: {} });
    if (e.kind === 'intro') b.intros += 1;
    if (e.kind === 'offer') b.offers += 1;
    (e.directions || []).forEach((d) => { b.byDirection[d] = (b.byDirection[d] || 0) + 1; });
  });
  return {
    years: Object.values(years).sort((a, b) => b.year.localeCompare(a.year)),
    live: {
      listings: live.length,
      nonprofitCommunity: live.filter((l) => l.category === 'nonprofit-community').length,
      acceptingIntros: live.filter((l) => l.introOptIn).length,
      memberOffers: live.filter((l) => l.memberOffer).length,
      seekingSuccessor: live.filter((l) => (l.seeking || []).includes('successor')).length,
      seekingApprenticeship: live.filter((l) => (l.seeking || []).includes('apprenticeship')).length,
      byDirection: DIRECTIONS.map((d) => ({ direction: d, listings: live.filter((l) => (l.directions || []).includes(d)).length })),
    },
  };
}

exports.handler = async (event) => {
  if (!authorized(event)) return json(401, { error: 'Unauthorized.' });
  if (event.httpMethod === 'GET') {
    const [rows, events] = await Promise.all([store.opsList('directory'), store.opsList('ecosystem-events')]);
    rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
    return json(200, { listings: rows, report: ecosystemReport(rows, events) });
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
  // Count each member offer the first time it is published (for the annual report).
  if (status === 'approved' && item.memberOffer && item.offerCountedFor !== item.memberOffer.text) {
    await store.opsPut('ecosystem-events', `offer-${Date.now()}-${String(item.publicId || '').slice(0, 6)}`, { kind: 'offer', at: new Date().toISOString(), directions: item.directions || [] });
    await store.opsPut('directory', body.memberId, { ...updated, offerCountedFor: item.memberOffer.text });
  }

  if (status !== 'pending') {
    try {
      const token = await store.getTokenByMemberId(item.memberId);
      const record = token && (await store.getCustomerByToken(token));
      if (record && record.email) {
        const text = status === 'approved'
          ? `Your enterprise, ${item.companyName}, has joined the .LLab Collaborating Enterprises in the Omnidirectional Enterprise™: https://wearethellab.com/pages/collaborating-companies.html`
          : `Your .LLab Collaborating Enterprises page for ${item.companyName} needs a change before it can appear:\n\n${note}\n\nEdit it here: https://wearethellab.com/pages/collaborating-companies.html`;
        await sendMail({ to: record.email, subject: status === 'approved' ? 'Welcome to the .LLab Collaborating Enterprises' : 'Your .LLab Collaborating Enterprises page needs a change', text, html: `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre>` });
      }
    } catch (err) {
      console.error('The .LLab Collaborating Enterprises decision email failed:', err.message);
    }
  }
  return json(200, { ok: true });
};
