// Links in emails sent only to the owner go through the private entry address
// (/admin/<ADMIN_ENTRY>/<page>): signed in, it opens the page; signed out, it shows
// the owner sign-in and then opens the page. Without ADMIN_ENTRY it falls back to
// the plain address.
const SITE = 'https://wearethellab.com';

function ownerLink(page) {
  const entry = process.env.ADMIN_ENTRY;
  return entry ? `${SITE}/admin/${encodeURIComponent(entry)}/${page}` : `${SITE}/admin/${page}`;
}

module.exports = { ownerLink };
