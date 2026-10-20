// The numbers and names the pitch and deck state, read from the same registry the site sells from
// (content/pricing.json), so a price, term, seat count or product name can never differ from the site.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reg = JSON.parse(fs.readFileSync(path.join(root, 'content/pricing.json'), 'utf8'));
const pricing = createRequire(import.meta.url)('../../netlify/functions/lib/pricing.js');

const plan = (key, interval) => reg.memberships.find((m) => m.key === key).plans.find((p) => p.interval === interval);
const perMo = (key) => plan(key, 'month').price_display;
const perYr = (key) => plan(key, 'year').price_display;
const dollars = (e) => pricing.priceDollars(e);
const fmt = (n) => `$${n.toLocaleString('en-US')}`;
const four = pricing.fourPhasesKeys().map((k) => pricing.entryForKey(k)).map(dollars);
const years = (m) => (m >= 1200 ? 'Lifetime' : `${m / 12} year${m === 12 ? '' : 's'}`);
const partnerIp = reg.partner_ip.map((p) => p.name);

export const P = {
  libMo: perMo('library-card'), libYr: perYr('library-card'),
  memMo: perMo('membership'), memYr: perYr('membership'),
  journalYr: perYr('journal'),
  range: `${fmt(Math.min(...four))}–${fmt(Math.max(...four))}`,
  tiers: reg.partnerships.map((t, i) => ({
    label: t.tier_label, price: t.price_display, line: t.headline, bestFor: t.legacy_line.replace(/'/g, '\u2019'), seats: t.seats,
    term: `${years(t.term_months)} · ${t.seats} seat${t.seats === 1 ? '' : 's'}`,
    termShort: years(t.term_months).toLowerCase(), partnerIp: partnerIp[i],
  })),
  phaseLines: reg.partnerships.map((t) => t.legacy_line.replace(/'/g, '\u2019')),
};
