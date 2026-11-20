// The Co.LLab™ pitch deck (assets/pitch/The-CoLLab-Pitch-Deck.pdf): the whole site, in seven sections, few words.
// The look follows the trees deck (scripts/pitch-deck/build.mjs): black-and-white photographs beside the site's green,
// ember headlines with a baked glow. The Omnidirectional Enterprise™ figures explain the model.
// Prices come from content/pricing.json (scripts/pitch/data.mjs); all copy is the site's own.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { P } from './data.mjs';
import { bakeGlow } from './glow.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const QR = require('qrcode');
const assets = path.join(here, 'assets');
const b64 = (f, t) => `data:${t};base64,${fs.readFileSync(f).toString('base64')}`;
const logo = b64(`${repo}/assets/img/logo-mark.png`, 'image/png');
const tree = (n) => b64(`${assets}/tree-${n}.jpg`, 'image/jpeg');
const sign = b64(`${assets}/logo-sign.png`, 'image/png');
const freeTools = JSON.parse(fs.readFileSync(`${repo}/content/free-tools.json`, 'utf8')).tools.length;
const fig = (n) => b64(`${assets}/oe-figure-${n}.jpg`, 'image/jpeg');
const baseCss = fs.readFileSync(`${repo}/scripts/pdf-src/base.css`, 'utf8');
const SITE = 'https://wearethellab.com';
const qr = (u) => QR.toDataURL(u, { margin: 1, width: 360, color: { dark: '#0f1d13', light: '#ffffff' } });
const qSite = await qr(SITE), qPartner = await qr(`${SITE}/pages/partnership.html`), qCall = await qr('https://calendly.com/letsbuildleadership/partnership-conversation');
const RIBBON = ['Enterprises', 'Nonprofits', 'Communities', 'People', 'Creators', 'Knowledge + IP', 'Capital', 'Technology', 'Products &amp; Services'];
const SECTIONS = ['Intro to The Co.LLab™', 'Mission and vision', 'Omnidirectional Enterprise™', 'Partnership™', 'The Co.LLab Founders Organization™', 'Scalability and economic impact', 'Connect'];

const css = `
@page { size: 13.3333in 7.5in; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background:#0f1d13; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
body { font-family:'Inter',-apple-system,'Helvetica Neue',Arial,sans-serif; color:#f6ead9; }
.s { width:13.3333in; height:7.5in; position:relative; overflow:hidden; page-break-after:always; padding:1.1in .85in .9in; background-color:#0f1d13; display:flex; flex-direction:column; }
.s:last-child { page-break-after:auto; }
.s > * { position:relative; z-index:2; }
.s > .ph { position:absolute; top:0; right:0; bottom:0; z-index:1; background-size:cover; background-position:center; }
.hd { position:absolute !important; top:.38in; left:.85in; right:.85in; display:flex; align-items:center; justify-content:space-between; }
.lock { display:flex; align-items:center; gap:12px; } .lock img { height:34px; } .lock b { display:block; font-size:16px; font-weight:800; color:#fff; } .lock span { display:block; font-size:10.5px; font-weight:700; color:#fff; line-height:1.2; }
.pg { background:#0f1d13; font-size:13px; font-weight:800; letter-spacing:.16em; color:#ff6a2e; border:1px solid rgba(255,106,46,.5); border-radius:999px; padding:6px 14px; }
.sec { position:absolute !important; left:.85in; bottom:.4in; font-size:13px; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:#fff; }
.sec i { font-style:normal; color:#ff6a2e; margin-right:10px; }
.k { display:flex; align-items:center; gap:14px; font-size:16px; font-weight:800; letter-spacing:.2em; text-transform:uppercase; color:#ff6a2e; margin-bottom:16px; } .k::before { content:''; width:36px; height:2px; background:#ff6a2e; }
h1, h2 { color:#ff602e; font-weight:200; letter-spacing:-.035em; line-height:1.02; } h1 b, h2 b { font-weight:800; color:#ff3a14; }
h1 { font-size:96px; } h2 { font-size:56px; margin-bottom:22px; }
.s p.lead { font-size:28px; line-height:1.4; color:#fdf6ec; font-weight:500; max-width:none; margin:0; opacity:1; }
.s p.fine { color:#fff; opacity:1; }
.panel { background:#0f1d13; border:1px solid rgba(255,96,46,.4); border-radius:16px; }
.ey { display:block; font-size:14px; font-weight:800; letter-spacing:.18em; text-transform:uppercase; color:#ff6a2e; }
.grow { flex:1; min-height:0; }
.w { width:100% !important; }
.ribbon { display:flex; flex-wrap:wrap; gap:8px; } .ribbon span { white-space:nowrap; font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:#fff; border:1.5px solid rgba(255,96,46,.75); border-radius:999px; padding:6px 12px; background:#0f1d13; }
.list { display:grid; gap:12px; } .li { padding:12px 22px; display:grid; grid-template-columns:2.9in 1fr; align-items:center; gap:16px; } .li b { font-size:24px; color:#fff; font-weight:800; line-height:1.15; } .li span { font-size:20px; color:#fdf6ec; }
.ag { display:grid; grid-template-columns:1fr 1fr; gap:12px; } .ag div { padding:14px 22px; display:flex; align-items:center; gap:18px; font-size:22px; font-weight:800; color:#fff; } .ag i { font-style:normal; font-size:34px; font-weight:200; color:#ff602e; width:44px; }
.mv { display:grid; gap:18px; } .mv .panel { padding:24px 30px; } .mv p { font-size:27px; line-height:1.38; color:#fff; font-weight:600; margin-top:8px; }
.figrow { display:grid; grid-template-columns:5.5in 1fr; gap:.55in; align-items:center; height:100%; }
.figrow img { width:5.5in; height:5.5in; object-fit:contain; border-radius:14px; border:1px solid rgba(255,96,46,.35); background:#0f1d13; display:block; }
.figrow h2 { font-size:54px; margin-bottom:20px; }
.wide .num { grid-template-columns:2.9in 1fr; padding:10px 22px; } .nums { display:grid; gap:12px; } .num { padding:12px 22px; display:grid; grid-template-columns:1.55in 1fr; align-items:center; } .num .n { font-size:46px; font-weight:200; color:#ff602e; line-height:1; } .num .l { font-size:21px; font-weight:700; color:#fff; line-height:1.25; }
.ph4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } .ph4 .panel { padding:24px 22px; border-top:4px solid #ff602e; } .ph4 .v { font-size:40px; font-weight:800; color:#fff; line-height:1.05; margin:10px 0 10px; } .ph4 .nm { font-size:18px; font-weight:700; color:#fdf6ec; line-height:1.3; }
.t4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } .t4 .panel { padding:24px 22px; border-top:4px solid #ff602e; } .t4 .pr { font-size:50px; font-weight:800; color:#fff; line-height:1; margin:12px 0 10px; } .t4 .vb { font-size:24px; font-weight:300; color:#ff602e; } .t4 .tm { font-size:17px; font-weight:700; color:#fff; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,96,46,.35); }
.big { font-size:120px; font-weight:800; color:#ff3a14; line-height:.9; letter-spacing:-.04em; margin:6px 0 22px; }
.chk { display:grid; gap:12px; } .chk div { padding:14px 22px; font-size:23px; font-weight:700; color:#fff; } .chk div::before { content:'›'; color:#ff602e; font-weight:800; margin-right:14px; }
.fine { font-size:15px; font-weight:700; color:#fff; margin-top:16px; }
.chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; } .chips span { font-size:14px; font-weight:800; color:#fff; border:1.5px solid rgba(255,96,46,.7); border-radius:999px; padding:7px 14px; background:#0f1d13; }
.qrs { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:6px; } .qrs .panel { padding:16px; display:grid; grid-template-columns:1.25in 1fr; gap:14px; align-items:center; } .qrs img { width:1.25in; background:#fff; padding:5px; border-radius:8px; display:block; } .qrs b { display:block; font-size:20px; color:#ff3a14; font-weight:800; line-height:1.15; } .qrs span { font-size:15px; font-weight:700; color:#fff; }
.cts { display:grid; grid-template-columns:repeat(3,auto); justify-content:start; gap:10px 34px; margin-top:22px; font-size:18px; font-weight:700; color:#fff; } .cts small { display:block; font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#ff6a2e; }
`;

let n = 0, SEC = 0;
// photo: a tree photograph on the right (its left edge already fades into the green), w = its width in inches.
const slide = (inner, photo = '', w = 4.2) => {
  n += 1;
  return `<section class="s"${photo ? ` style="padding-right:${w + 0.35}in"` : ''}>${photo ? `<div class="ph" style="width:${w}in;background-image:url(${tree(photo)})"></div>` : ''}${n > 1 ? `<div class="hd"><div class="lock"><img src="${logo}"/><div><b>The Co.LLab™</b><span>Building Leadership<br/>Infrastructure</span></div></div>${`<div class="pg">${String(n - 1).padStart(2, '0')}</div>`}</div>` : ''}${inner}${SEC ? `<div class="sec"><i>${String(SEC).padStart(2, '0')}</i>${SECTIONS[SEC - 1]}</div>` : ''}</section>`;
};
const sec = (i, ...fns) => { SEC = i; return fns.map((f) => f()).join(''); };
const k = (t) => `<p class="k">${t}</p>`;
const li = (b, s) => `<div class="li panel"><b>${b}</b><span>${s}</span></div>`;
const num = (a, l) => `<div class="num panel"><span class="n">${a}</span><span class="l">${l}</span></div>`;
const figSlide = (i, kicker, h, nums) => slide(`<div class="grow"><div class="figrow"><img src="${fig(i)}" alt=""/><div>${k(kicker)}<h2>${h}</h2><div class="nums">${nums}</div></div></div></div>`);

const title = () => slide(`<div class="grow" style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;margin-top:-.4in"><img src="${sign}" alt="The Co.LLab™: Building Leadership Infrastructure" style="width:7.4in;display:block;margin:0 0 .45in -.1in"/>${k('Omnidirectional Enterprise™')}<p class="lead" style="font-size:30px;margin-bottom:28px">An IP and leadership-infrastructure ecosystem,<br/>where ideas become infrastructure, and infrastructure becomes legacy.</p><div class="ribbon">${RIBBON.map((r) => `<span>${r}</span>`).join('')}</div><p class="fine" style="margin-top:26px;font-size:17px;letter-spacing:.12em">WEARETHELLAB.COM</p></div>`, 'forest', 4.2);

// 01 Intro
const intro = () => slide(`${k('Intro to The Co.LLab™')}<h2>Not a company. <b>An ecosystem.</b></h2><div class="list w" style="width:8.4in">${li('The Co.LLab™', 'The holding company. The model, run first hand.')}${li('The Co.LLab+™', 'Community: the Marketplace and Agriculture.')}${li('The .LLab™', 'Commerce: IP, research, products, Membership.')}${li('The Co.LLab Founders Organization™', 'Founders back the build.')}</div>`, 'lodge');
const vision = () => slide(`<div class="grow w" style="display:flex;flex-direction:column;justify-content:center">${k('Why it matters')}<h1 style="font-size:72px">Every company starts with a vision. <b>Most lose it.</b></h1><p class="lead" style="margin-top:26px;font-size:30px">The founder steps back, people change, the market shifts.</p></div>`, 'woods', 5);

// 02 Mission and vision
const mission = () => slide(`${k('Mission and vision')}<h2>Build the infrastructure <b>behind potential.</b></h2><div class="mv w" style="width:8.3in"><div class="panel"><span class="ey">Mission</span><p>Leadership infrastructure that turns human potential into performance, enterprise value and lasting legacy.</p></div><div class="panel"><span class="ey">Vision</span><p>Infrastructure built around people, not people forced to fit it.</p></div></div>`, 'crater', 4.4);

// 03 Omnidirectional Enterprise™: the economic case, then the four figures
const econ = () => slide(`${k('The economic case')}<h2>Creating value is half the work. <b>Capturing it is the other half.</b></h2><div class="chk"><div class="panel">Value is created everywhere. It is captured in few places.</div><div class="panel">Most enterprises go it alone: their own playbook, capital and walls.</div><div class="panel">Omnidirectional Enterprise™ connects them, and reinvests the returns.</div></div>`, 'meadow', 4.2);
const oe1 = () => figSlide(1, 'Figure 1 · Phase I · Foundations', 'Not a ladder. <b>A network.</b>', num('1', 'Source: the model, owning and licensing the IP') + num('9', 'Substations, where economic activity happens') + num('18', 'Two-way lines. Value moves in every direction.'));
const oe2 = () => figSlide(2, 'Figure 2 · Phase II · Planning', 'We built The Co.LLab™ <b>on it.</b>', num('10', 'Circles, each a part of our enterprise') + num('45', 'Two-way connections') + num('7', 'Currents carrying the value'));
const oe3 = () => figSlide(3, 'Figure 3 · Phase III · Operating', 'Enterprises <b>plug in.</b>', num('1', 'Every enterprise becomes a Conductor') + num('30', 'Circles across 3 Conductors') + num('435', 'Possible two-way connections'));
const oe4 = () => figSlide(4, 'Figure 4 · Phase IV · Preservation', 'Together: <b>the Grid.</b>', num('7', 'Conductors wired together') + num('70', 'Circles') + num('2,415', 'Possible two-way connections, and growing'));
const phases = () => slide(`${k('The IV Phases™')}<h2>One method. <b>Four phases.</b></h2><div class="ph4">${['Foundations', 'Infrastructure Planning &amp; Management', 'Internal Operating Systems', 'Preservation'].map((nm, i) => `<div class="panel"><span class="ey">Phase ${['I', 'II', 'III', 'IV'][i]}</span><div class="v">${P.tiers[i].verb}.</div><div class="nm">${nm}</div></div>`).join('')}</div><p class="lead" style="margin-top:30px;font-size:24px">Every enterprise runs on the same foundation, licensed as IP.</p>`);

// 04 Partnership™
const partner = () => slide(`${k('Partnership™')}<h2>Every level. <b>One legacy.</b></h2><div class="t4">${P.tiers.map((t) => `<div class="panel"><span class="ey">${t.label}</span><div class="pr">${t.price}</div><div class="vb">${t.verb}.</div><div class="tm">${t.term}</div></div>`).join('')}</div><p class="fine">One-time. Licensed to keep. Every tier includes all IV Phases™ and The .LLab Membership™.</p>`);

// 05 The Co.LLab Founders Organization™
const founders = () => slide(`${k('The Co.LLab Founders Organization™')}<h2>Back the build. <b>Become a Founder.</b></h2><div class="w" style="display:grid;grid-template-columns:3.2in 1fr;gap:.4in;align-items:start;width:8.4in"><div><span class="ey">Founding starts at</span><div class="big">${P.founders[0].price}</div></div><div class="chk"><div class="panel">Free .LLab™ products from its phase</div><div class="panel">Credited in full toward a Partnership™</div><div class="panel">Your name on the Omnidirectional Legacy Wall</div></div></div><p class="fine w">Built to invest back out: scholarships, angel investment and charitable donations. No ownership stake or financial return.</p>`, 'rocks');

// 06 Scalability and long-term economic impact
const tile = (e, g, l) => `<div class="panel" style="padding:18px 22px"><span class="ey">${e}</span><div style="font-size:36px;font-weight:800;color:#fff;line-height:1.05;margin:8px 0 6px">${g}</div><span style="font-size:17px;font-weight:600;color:#fdf6ec">${l}</span></div>`;
const ways = () => slide(`${k('Revenue at every entry point')}<h2>Every way in. <b>One ecosystem.</b></h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">${tile('Free tools', `${freeTools} free`, 'No account needed. Start here.')}${tile('The .LLab™ products', `From ${P.range.split('–')[0]}`, 'IV Phases™ IP. Licensed to keep.')}${tile('The .LLab Library Card™', P.libMo, 'The library, open.')}${tile('The .LLab Membership™', P.memMo, 'Every product + the Infrastructure Analysis™.')}${tile('Partnership™', `From ${P.tiers[0].price}`, 'One-time. For enterprises.')}${tile('Founders', `From ${P.founders[0].price}`, 'Back the build.')}</div><p class="fine">For customers: a way in at every size. For investors: revenue at every step, from licensed, self-serve IP.</p>`);
const scale = () => slide(`${k('Scalability')}<h2>Connections grow <b>faster than circles.</b></h2><div class="nums wide">${num('10 → 45', 'One enterprise: 10 circles, 45 connections')}${num('30 → 435', 'Three Conductors')}${num('70 → 2,415', 'Seven Conductors, and more can join')}</div><p class="fine">n circles can make n(n−1)/2 two-way connections.</p>`, 'wing', 4.6);
const impact = () => slide(`${k('Long-term economic impact')}<h2>Built to outlast. <b>Local to global.</b></h2><div class="chk w" style="width:8.2in"><div class="panel">IP ownership spread across enterprises and regions</div><div class="panel">Returns reinvested, not extracted</div><div class="panel">Succession planned in Preservation</div></div><div class="chips w">${['The Co.LLab+ Marketplace™', 'The Co.LLab+™ Agriculture', 'The .LLab Atelier™', 'The .LLab AV Productions™', 'The .LLab Communications™', 'The .LLab Edu™', 'Renewable Energy Ecosystem™'].map((v) => `<span>${v}</span>`).join('')}</div><p class="fine w">Every .LLab™ page is a future company. In development; not offered for sale.</p>`, 'moon', 4);

// 07 Connect
const connect = () => slide(`${k('Connect')}<h2>Let’s build your legacy <b>through Omnidirectional Enterprise™.</b></h2><div class="qrs">${[[qSite, 'Start free', 'wearethellab.com'], [qPartner, 'Partnership™', `From ${P.tiers[0].price}`], [qCall, 'Book a call', 'A Partnership conversation']].map(([q, b, s]) => `<div class="panel"><img src="${q}"/><div><b>${b}</b><span>${s}</span></div></div>`).join('')}</div><div class="cts"><div><small>Ashley E. Clasby</small>Economic Enterprise Systems Strategist</div><div><small>Partnerships</small>partnerships@wearethellab.com</div><div><small>Founders</small>founders@wearethellab.com</div><div><small>General</small>hello@wearethellab.com</div><div><small>Instagram</small>@theco.llab_</div></div>`);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>The Co.LLab™ — The Pitch</title><style>${baseCss}${css}</style></head><body>${title()}${sec(1, vision, intro)}${sec(2, mission)}${sec(3, econ, oe1, oe2, oe3, oe4, phases)}${sec(4, partner)}${sec(5, founders)}${sec(6, ways, scale, impact)}${sec(7, connect)}</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
const over = await page.$$eval('.s', (ss) => ss.map((s, i) => { const R = s.getBoundingClientRect(); return [...s.querySelectorAll('*')].some((e) => { if (e.classList.contains('ph')) return false; const r = e.getBoundingClientRect(); return r.height > 0 && (r.bottom > R.bottom - 8 || r.right > R.right - 8); }) ? i + 1 : 0; }).filter(Boolean));
await page.evaluate(() => {
  const from = [255, 26, 26], to = [255, 106, 46];
  document.querySelectorAll('h1 b, h2 b').forEach((b) => {
    const chars = [...b.textContent]; const m = Math.max(chars.length - 1, 1); b.textContent = '';
    chars.forEach((ch, i) => { const t = i / m; const s = document.createElement('span'); s.textContent = ch; s.style.color = `rgb(${from.map((v, j) => Math.round(v + (to[j] - v) * t)).join(',')})`; b.appendChild(s); });
  });
});
await bakeGlow(browser, page, { sectionSel: '.s', titleSel: 'h1 b, h2 b', w: 1280, h: 720 });
await page.pdf({ path: `${repo}/assets/pitch/The-CoLLab-Pitch-Deck.pdf`, printBackground: true, preferCSSPageSize: true, outline: true });
console.log('slides', n, 'too close to the edge:', JSON.stringify(over));
await browser.close();
