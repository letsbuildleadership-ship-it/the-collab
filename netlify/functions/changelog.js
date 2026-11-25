// Public changelog: what changed in The Co.LLab™ IP and portal, and why. Release notes come
// from content/changelog.json; when the owner marks a member's feedback done with a public
// note, that note is added here. Only the owner-written note, the IP it concerns and the date
// are published: never the member, their words, or their account.
const store = require('./lib/store');
const { json } = require('./lib/http');
const releases = require('../../content/changelog.json').entries;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const published = (await store.opsList('ip-changelog')).map((e) => ({ date: e.date, title: e.title, ip: e.ip || null, source: 'Member feedback', text: e.text }));
  const entries = [...published, ...releases].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return json(200, { entries }, { 'Cache-Control': 'public, max-age=300' });
};
