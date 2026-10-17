// Renders the standalone ad creatives (and the social share card) from the same photographs,
// palette and approved copy the website uses.
//   node scripts/build-ads.mjs            -> marketing/ads/*.png
// Every line of copy below is lifted from approved site copy; prices come from content/pricing.json.
// Strategy and the lever each ad pulls: docs/marketing-strategy.md
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const tiers = require(path.join(root, 'netlify/functions/lib/pricing.js')).registry.partnerships;
const money = (t) => Number(t.price_display.replace(/[^0-9]/g, ''));
const fmt = (n) => '$' + n.toLocaleString('en-US');
const lo = fmt(Math.min(...tiers.map(money))), hi = fmt(Math.max(...tiers.map(money)));
const seats = tiers.map((t) => t.seats).join(', ').replace(/, (\d+)$/, ', or $1');

const LEGAL = 'A license for internal business use. Results depend on how each business applies it.';
const EYE = 'Omnidirectional Enterprise™ Partnership';
// *word* = emphasis (fire gradient, bold)
const ADS = [
  { id: '01-legacy',       lever: 'Loss aversion + identity',      eyebrow: EYE, hook: 'Every company starts with a vision. *Most lose it.*', support: 'The founder steps back, people change, the market shifts.', cta: 'See the four tiers', img: 'scaffolding', pos: '50% 40%', legal: true },
  { id: '02-succession',   lever: 'Mortality salience + legacy',   eyebrow: EYE, hook: '*Pass it on.* So it outlasts you.', support: 'Phase IV · Preservation. The Legacy Preservation Vault™, licensed to keep.', cta: 'Preserve your legacy', img: 'track', pos: '50% 56%', legal: true },
  { id: '03-four-phases',  lever: 'Cognitive ease (4-step ladder)', eyebrow: 'The IV Phases™', hook: 'Define it. Plan it. Live it. *Pass it on.*', support: 'Define your legacy, build it into how you work, and pass it on.', cta: 'See the four phases', img: 'storefront', pos: '50% 45%', legal: false },
  { id: '04-economics',    lever: 'Authority + reframe',            eyebrow: 'The economic case', hook: 'Generating value and capturing value *are different processes.*', support: 'Practice Omnidirectional Enterprise™ with licensed Co.LLab IP™.', cta: 'Read the case', img: 'scaffolding', pos: '25% 50%', legal: true },
  { id: '05-one-payment',  lever: 'Risk reversal + price clarity',  eyebrow: EYE, hook: '*One payment.* Licensed to keep.', support: `No subscription. No automatic charges. Four levels, ${lo}–${hi}.`, cta: 'Choose your level', img: 'racks', pos: '40% 62%', legal: true },
  { id: '06-start-free',   lever: 'Foot-in-the-door + reciprocity', eyebrow: 'The .LLab', hook: '*Start free.* Build your legacy.', support: 'Join The .LLab — free, no card needed. Every free tool, by phase.', cta: 'Join The .LLab free', img: 'storefront', pos: '50% 40%', legal: false },
  { id: '07-unity',        lever: 'Unity + belonging',              eyebrow: 'Omnidirectional Enterprise™', hook: '*Nobody builds alone.*', support: 'Value moves between businesses, nonprofits, communities, people, technology, capital, knowledge + IP, and creators.', cta: 'See the model', img: 'stage', pos: '60% 40%', legal: false },
  { id: '08-team',         lever: 'Status + internal buy-in',       eyebrow: EYE, hook: 'Your legacy. *Your whole team.*', support: `Seats for ${seats} people. One account each, added by invite.`, cta: 'See the seat levels', img: 'booth', pos: '50% 58%', legal: true },

  { id: '09-define',        lever: 'Phase I · identity (booth, sign, table)',     eyebrow: 'The IV Phases™ · Phase I · Foundations', hook: '*Define* your legacy.', support: 'Who you are and what you stand on.', cta: 'See the Partner level', img: 'booth', pos: '50% 58%', legal: true },
  { id: '10-plan',          lever: 'Phase II · structure (scaffolding)',           eyebrow: 'The IV Phases™ · Phase II · Planning', hook: '*Plan* your legacy.', support: "Where it's going and how it connects.", cta: 'See the Strategic level', img: 'scaffolding', pos: '50% 40%', legal: true },
  { id: '11-live',          lever: 'Phase III · standards in daily use (racks)',   eyebrow: 'The IV Phases™ · Phase III · Operating Systems', hook: '*Live* your legacy.', support: 'In every decision, every day.', cta: 'See the Enterprise level', img: 'racks', pos: '40% 62%', legal: true },
];

const SIZES = {
  feed: { w: 1080, h: 1350, suffix: '4x5' },
  wide: { w: 1200, h: 628, suffix: 'landscape' },
};

const hookHtml = (s) => s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
const img = (n) => 'file://' + path.join(root, 'assets/img/editorial', n + '.jpg');
const logo = 'file://' + path.join(root, 'assets/img/logo-mark.png');

function page(ad, size) {
  const wide = size.w > size.h;
  const hook = wide ? 66 : 96, sup = wide ? 28 : 38, eye = wide ? 22 : 28, cta = wide ? 24 : 32, url = wide ? 24 : 30, legal = wide ? 20 : 26;
  const pad = wide ? 56 : 72;
  return `<!doctype html><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0}
html,body{width:${size.w}px;height:${size.h}px;overflow:hidden;background:#0f1d13;font-family:Inter,'Helvetica Neue',Arial,sans-serif;color:#fdf6ec}
.ad{position:relative;width:${size.w}px;height:${size.h}px;overflow:hidden}
.photo{position:absolute;background:url('${img(ad.img)}') ${ad.pos}/cover no-repeat;}
${wide
  ? `.photo{top:0;right:0;bottom:0;width:44%}.panel{position:absolute;left:0;top:0;bottom:0;width:60%;padding:${pad}px;display:flex;flex-direction:column;justify-content:center;background:#0f1d13}
.panel::after{content:'';position:absolute;top:0;bottom:0;right:-90px;width:90px;background:linear-gradient(90deg,#0f1d13,rgba(15,29,19,0))}`
  : `.photo{inset:0 0 auto 0;height:62%}.panel{position:absolute;left:0;right:0;bottom:0;padding:${pad}px ${pad}px ${pad - 12}px;background:linear-gradient(to top,#0f1d13 0%,#0f1d13 84%,rgba(15,29,19,0) 100%);padding-top:150px;top:auto}`}
.logo{position:absolute;${wide ? 'right:36px;top:30px' : 'left:' + pad + 'px;top:56px'};width:${wide ? 190 : 260}px;border-radius:2px;box-shadow:0 0 0 1px rgba(255,138,31,.6),0 8px 30px rgba(0,0,0,.5)}
.eye{font-size:${eye}px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#ff8a1f;margin-bottom:${wide ? 18 : 24}px;display:flex;align-items:center;gap:16px}
.eye::before{content:'';width:44px;height:3px;background:linear-gradient(90deg,#ff2e12,#ff8a1f)}
h1{text-wrap:balance;font-size:${hook}px;line-height:1.02;font-weight:200;letter-spacing:-.025em;color:#fdf6ec;max-width:${wide ? '14ch' : '15ch'}}
h1 em{font-style:normal;font-weight:700;color:#ff6a3d;text-shadow:0 0 26px rgba(255,70,20,.45)}
.sup{text-wrap:pretty;font-size:${sup}px;line-height:1.35;font-weight:400;color:#ffd9c4;margin-top:${wide ? 22 : 30}px;max-width:${wide ? '30ch' : '34ch'}}
.row{display:flex;flex-wrap:wrap;align-items:center;gap:${wide ? 22 : 28}px;margin-top:${wide ? 30 : 40}px}
.cta{display:inline-flex;align-items:center;gap:14px;background:#ff602e;color:#0f1d13;font-weight:700;font-size:${cta}px;letter-spacing:.08em;text-transform:uppercase;padding:${wide ? '16px 28px' : '22px 38px'};border-radius:999px;white-space:nowrap}
.url{font-size:${url}px;font-weight:500;color:#fdf6ec;letter-spacing:.02em}
.legal{font-size:${legal}px;line-height:1.35;color:#ffd9c4;opacity:.9;margin-top:${wide ? 22 : 30}px;max-width:${wide ? '46ch' : '60ch'}}
</style>
<div class="ad"><div class="photo"></div><img class="logo" src="${logo}"><div class="panel">
<div class="eye">${ad.eyebrow}</div><h1>${hookHtml(ad.hook)}</h1><p class="sup">${ad.support}</p>
<div class="row"><span class="cta">${ad.cta} →</span><span class="url">wearethellab.netlify.app</span></div>
${ad.legal ? `<p class="legal">${LEGAL}</p>` : ''}</div></div>`;
}

const outDir = path.join(root, 'marketing/ads');
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const ctxFor = (s) => browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 });
const shoot = async (ad, size, file) => {
  const ctx = await ctxFor(size);
  const p = await ctx.newPage();
  const tmp = path.join(os.tmpdir(), `ad-${ad.id}-${size.w}x${size.h}.html`);
  fs.writeFileSync(tmp, page(ad, size));
  await p.goto('file://' + tmp, { waitUntil: 'load' });
  await p.waitForTimeout(250);
  await p.screenshot({ path: file });
  await ctx.close();
  console.log('wrote', path.relative(root, file));
};
for (const ad of ADS) for (const size of Object.values(SIZES)) await shoot(ad, size, path.join(outDir, `${ad.id}-${size.suffix}.png`));
// social share card: every pasted link is an ad
await shoot(ADS[0], { w: 1200, h: 630 }, path.join(root, 'assets/img/og-cover.png'));
fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(ADS.map(({ id, lever, hook, support, cta }) => ({ id, lever, hook: hook.replace(/\*/g, ''), support, cta })), null, 2) + '\n');
await browser.close();
