// Password reset links: a single-use code that lets a member choose a new
// password and signs them in. Created either by the member ("Forgot
// password?", emailed to them) or by the owner from the admin Customers page
// (a link the owner sends the customer directly).
const store = require('./store');

const SITE = (process.env.URL || 'https://wearethellab.com').replace(/\/$/, '');
const HOUR = 60 * 60 * 1000;

async function createResetLink(token, hours = 1) {
  const code = store.randomToken();
  await store.saveResetCode(code, { token, expiresAt: new Date(Date.now() + hours * HOUR).toISOString() });
  return { code, url: `${SITE}/pages/login.html?reset=${encodeURIComponent(code)}` };
}

/** The customer token a still-valid code belongs to, or null. */
async function tokenForResetCode(code) {
  if (!code) return null;
  const info = await store.getResetCode(code);
  if (!info) return null;
  if (Date.parse(info.expiresAt) < Date.now()) {
    await store.deleteResetCode(code);
    return null;
  }
  return info.token;
}

module.exports = { createResetLink, tokenForResetCode };
