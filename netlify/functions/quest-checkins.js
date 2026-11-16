// Daily (scheduled in netlify.toml): sends each member the commitment check-ins now due
// (30, 90 and 365 days after a quest is finished), one email per member.
const store = require('./lib/store');
const { sendMail } = require('./lib/mailer');
const { dueFor, emailFor } = require('./lib/checkins');

exports.handler = async () => {
  const customers = await store.listCustomers();
  let sent = 0;
  for (const record of customers) {
    const due = dueFor(record);
    if (!due.length) continue;
    try {
      await sendMail(emailFor(record, due));
    } catch (err) {
      console.error('Check-in email failed:', err.message);
      continue; // not marked sent, so it is tried again tomorrow
    }
    const at = new Date().toISOString();
    due.forEach((d) => { record.quests[d.key].checkins[d.days] = { sentAt: at }; });
    await store.saveCustomer(record);
    sent += 1;
  }
  return { statusCode: 200, body: `check-ins sent to ${sent}` };
};
