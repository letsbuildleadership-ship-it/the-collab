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
const SECTIONS = ['Mission and vision', 'Omnidirectional Enterprise™', 'The economic effect', 'Partnership™', 'The Co.LLab Founders Organization™', 'Scalability', 'Connect'];

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
.mv { display:grid; gap:18px; } .mv .panel { padding:18px 28px; } .mv p { font-size:24px; line-height:1.38; color:#fff; font-weight:600; margin-top:8px; }
.figrow { display:grid; grid-template-columns:5.5in 1fr; gap:.55in; align-items:center; height:100%; }
.figrow img { width:5.5in; height:5.5in; object-fit:contain; border-radius:14px; border:1px solid rgba(255,96,46,.35); background:#0f1d13; display:block; }
.figrow h2 { font-size:54px; margin-bottom:20px; }
.wide .num { grid-template-columns:2.9in 1fr; padding:10px 22px; } .nums { display:grid; gap:12px; } .num { padding:12px 22px; display:grid; grid-template-columns:1.55in 1fr; align-items:center; } .num .n { font-size:46px; font-weight:200; color:#ff602e; line-height:1; } .num .l { font-size:21px; font-weight:700; color:#fff; line-height:1.25; }
.ph4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } .ph4 .panel { padding:24px 22px; border-top:4px solid #ff602e; } .ph4 .v { font-size:40px; font-weight:800; color:#fff; line-height:1.05; margin:10px 0 10px; } .ph4 .nm { font-size:18px; font-weight:700; color:#fdf6ec; line-height:1.3; }
.t4 { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; } .t4 .panel { padding:24px 22px; border-top:4px solid #ff602e; } .t4 .pr { font-size:50px; font-weight:800; color:#fff; line-height:1; margin:12px 0 10px; } .t4 .vb { font-size:24px; font-weight:300; color:#ff602e; } .t4 .tm { font-size:17px; font-weight:700; color:#fff; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,96,46,.35); }
.big { font-size:120px; font-weight:800; color:#ff3a14; line-height:.9; letter-spacing:-.04em; margin:6px 0 22px; }
.chk { display:grid; gap:12px; } .chk.tight { gap:9px; } .chk.tight div { padding:11px 22px; font-size:21px; } .chk div { padding:14px 22px; font-size:23px; font-weight:700; color:#fff; } .chk div::before { content:'›'; color:#ff602e; font-weight:800; margin-right:14px; }
.fine { font-size:15px; font-weight:700; color:#fff; margin-top:16px; }
.chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:20px; } .chips span { font-size:14px; font-weight:800; color:#fff; border:1.5px solid rgba(255,96,46,.7); border-radius:999px; padding:7px 14px; background:#0f1d13; }
.qrs { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; margin-top:6px; } .qrs .panel { padding:16px; display:grid; grid-template-columns:1.25in 1fr; gap:14px; align-items:center; } .qrs img { width:1.25in; background:#fff; padding:5px; border-radius:8px; display:block; } .qrs b { display:block; font-size:20px; color:#ff3a14; font-weight:800; line-height:1.15; } .qrs span { font-size:15px; font-weight:700; color:#fff; }
.cts { display:grid; grid-template-columns:repeat(3,auto); justify-content:start; gap:10px 34px; margin-top:22px; font-size:18px; font-weight:700; color:#fff; } .cts small { display:block; font-size:12px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; color:#ff6a2e; }
.pt4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; } .pt4 .panel { padding:14px 16px 12px; border-top:4px solid #ff602e; display:flex; flex-direction:column; } .pt4 .pr { font-size:38px; font-weight:800; color:#fff; line-height:1; margin:8px 0 6px; } .pt4 .vb { font-size:20px; font-weight:800; color:#ff602e; line-height:1.25; } .pt4 .vb span { display:block; font-size:15px; font-weight:600; color:#fdf6ec; } .pt4 ul { list-style:none; margin:10px 0 0; padding:10px 0 0; border-top:1px solid rgba(255,96,46,.35); } .pt4 li { font-size:13.5px; line-height:1.3; color:#fff; font-weight:600; margin:0 0 6px; padding-left:14px; position:relative; } .pt4 li::before { content:'›'; position:absolute; left:0; color:#ff602e; font-weight:800; } .pt4 li b { color:#ff9a6e; } .pt4 .bf { margin-top:auto; padding-top:8px; font-size:14px; font-weight:800; color:#ff9a6e; }
.fl4 { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; } .fl4 .panel { padding:8px 14px; } .fl4 .pr { font-size:24px; font-weight:800; color:#fff; line-height:1.1; } .fl4 b { display:block; font-size:15px; color:#ff602e; font-weight:800; margin:3px 0 3px; } .fl4 span { display:block; font-size:12.5px; line-height:1.3; color:#fdf6ec; font-weight:600; } .fl4 .hot { background:#ff3a14; border-color:#ff3a14; } .fl4 .hot b, .fl4 .hot span { color:#0f1d13; }
.stack { display:flex; align-items:center; gap:6px; margin-top:26px; } .stack i { font-style:normal; color:#ff602e; font-weight:800; } .stack div { flex:1; padding:8px 10px; border:1.5px solid rgba(255,96,46,.35); border-radius:12px; font-size:14px; font-weight:800; color:#d9cfc2; line-height:1.2; } .stack small { display:block; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#e0a080; } .stack .on { border-color:rgba(255,96,46,.8); color:#fff; } .stack .on small { color:#ff9a6e; } .stack .now { background:#ff3a14; border-color:#ff3a14; color:#0f1d13; } .stack .now small { color:#0f1d13; }
.chain { display:flex; align-items:center; gap:8px; margin-top:24px; } .chain span { white-space:nowrap; font-size:16px; font-weight:800; color:#0f1d13; background:linear-gradient(90deg,#ff2e12,#ff6a2e); border-radius:999px; padding:9px 18px; } .chain i { font-style:normal; color:#ff6a2e; font-weight:800; font-size:18px; }
.cur { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; } .cur .panel { padding:14px 18px; } .cur b { display:block; font-size:20px; color:#fff; font-weight:800; } .cur small { display:block; font-size:13px; font-weight:800; letter-spacing:.06em; color:#ff9a6e; margin:5px 0 6px; } .cur span { font-size:15.5px; line-height:1.35; color:#fdf6ec; } .cur .hot { background:#ff3a14; border-color:#ff3a14; } .cur .hot b, .cur .hot span { color:#0f1d13; }
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

const title = () => slide(`<div class="grow" style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start;margin-top:-.4in"><img src="${sign}" alt="The Co.LLab™: Building Leadership Infrastructure" style="width:7.4in;display:block;margin:0 0 .45in -.1in"/>${k('Omnidirectional Enterprise™')}<p class="lead" style="font-size:30px;margin-bottom:28px">An IP and leadership-infrastructure ecosystem,<br/>where ideas become infrastructure, and infrastructure becomes legacy.</p><div class="ribbon">${RIBBON.map((r) => `<span>${r}</span>`).join('')}</div><p class="fine" style="margin-top:26px;font-size:17px;letter-spacing:.12em">WEARETHELLAB.COM</p></div>`, 'forest', 4.2);

// 01 Mission and vision (pages/about.html)
const mission = () => slide(`${k('Mission and vision')}<h2 style="font-size:46px;margin-bottom:18px">Build the infrastructure <b>behind potential.</b></h2><div class="mv" style="gap:14px"><div class="panel"><span class="ey">Mission</span><p>${P.mission}</p></div><div class="panel"><span class="ey">Vision</span><p>${P.vision}</p></div></div>`, 'crater', 3.4);

// 02 Omnidirectional Enterprise™: the problem, the solution, Leadership Infrastructure™ (The IV Phases™), then the four models, each built on the one before
const problem = () => slide(`<div class="grow" style="display:flex;flex-direction:column;justify-content:center">${k('The problem')}<h1 style="font-size:58px">Value is created everywhere. <b>It is captured in few places.</b></h1><div class="chk" style="margin-top:30px"><div class="panel">Returns concentrate. Whole regions get left out.</div><div class="panel">Most enterprises go it alone, starting from zero.</div><div class="panel">When the founder steps back, the enterprise falters.</div></div></div>`, 'woods', 4.6);
const card = (e, b, p) => `<div class="panel" style="padding:24px 24px"><span class="ey">${e}</span><b style="display:block;font-size:27px;color:#fff;line-height:1.15;margin:10px 0 8px">${b}</b><span style="font-size:19px;line-height:1.4;color:#fdf6ec">${p}</span></div>`;
const solution = () => slide(`${k('The solution · Omnidirectional Enterprise™')}<h2>Not a ladder. <b>A network.</b></h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">${card('Within', 'Power inside every enterprise', 'One shared foundation: licensed IP and The IV Phases™.')}${card('Across', 'Then across every sector', 'Products, services, ideas and revenue move between enterprises, both ways.')}${card('Into a web', 'A grid that sustains communities', 'Built to keep communities strong, from local to global.')}</div><p class="lead" style="margin-top:28px;font-size:24px">Every enterprise on equal footing. Value moves in every direction.</p>`);
const PH = [['Phase I', 'Define it.', 'Foundations', 'Know who you are and what you stand on.'], ['Phase II', 'Plan it.', 'Infrastructure Planning &amp; Management', 'Decide what to build and how it connects.'], ['Phase III', 'Live it.', 'Internal Operating Systems', 'Build the systems that make it run.'], ['Phase IV', 'Pass it on.', 'Preservation', 'Make it last beyond any one person.']];
const phases = () => slide(`${k('Leadership Infrastructure™ · The IV Phases™')}<h2>Leadership, made structural. <b>Your legacy, in four phases.</b></h2><div class="ph4">${PH.map(([p, v, nm, l]) => `<div class="panel"><span class="ey">${p}</span><div class="v">${v}</div><div class="nm" style="color:#ff9a6e">${nm}</div><div class="nm" style="margin-top:10px;color:#fff">${l}</div></div>`).join('')}</div><p class="lead" style="margin-top:26px;font-size:23px">Captured, documented and embedded, so it outlasts the individuals who hold it.</p>`);
const MODELS = ['The model', 'The blueprint', 'Enterprises plug in', 'The Grid'];
const steps = (i) => `<div class="stack">${MODELS.map((m, j) => `<div class="${j < i ? 'on' : j === i ? 'now' : ''}"><small>${PH[j][1]}</small>${m}</div>`).join('<i>›</i>')}</div>`;
const figSlide = (i, kicker, h, line) => slide(`<div class="grow"><div class="figrow"><img src="${fig(i + 1)}" alt=""/><div>${k(kicker)}<h2>${h}</h2><p class="lead" style="font-size:25px">${line}</p>${steps(i)}</div></div></div>`);
const oe1 = () => figSlide(0, 'Figure 1 · Phase I · Foundations', 'Where the power <b>starts.</b>', 'One Source powering every substation, with power going out and value coming back on every line.');
const oe2 = () => figSlide(1, 'Figure 2 · Phase II · Planning', 'What our enterprise <b>is built on.</b>', 'Not a theory. The Co.LLab™ runs on it: every circle wired to every other, every substation run by a part of our enterprise.');
const oe3 = () => figSlide(2, 'Figure 3 · Phase III · Operating', 'Enterprises plug in, <b>and start collaborating.</b>', 'Plug in and you become a Conductor, wired straight into enterprises across every sector.');
const oe4 = () => figSlide(3, 'Figure 4 · Phase IV · Preservation', 'Conductors wired together: <b>the Grid.</b>', 'Every new Conductor passes the model on, and makes the whole Grid stronger.');

// 03 The economic effect: why The Co.LLab™ was built
const effect = () => slide(`${k('The economic effect')}<h2>Creating value is half the work. <b>Capturing it is the other half.</b></h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${card('Knowledge + IP', 'Shared IP', 'Every participant can license it and put it to work.')}${card('Governance', 'One playbook', 'Everyone builds from The IV Phases™.')}${card('Network', 'Cross-sector', 'Enterprises, nonprofits, creators and communities, side by side.')}${card('Returns', 'Reinvested', 'Returns fund what comes next.')}</div><div class="chain">${['Human Potential', 'Intelligence', 'Infrastructure', 'Enterprise Value', 'Legacy'].map((c) => `<span>${c}</span>`).join('<i>→</i>')}</div>`);
const CUR = [['Investment', 'Enterprises and Capital → The Source', 'Powers the system. Every other Current runs on it.'], ['Licensing', 'The Source → Enterprises', 'The IV Phases™ and the IP, licensed to keep.'], ['Living IP', 'Enterprises → Knowledge + IP', 'Use and insight make the IP stronger.'], ['Infrastructure', 'The Source → Creators', 'Creators keep authorship of their IP.'], ['Creative', 'Creators → Communities', 'Quality work, products and community projects.'], ['Sponsorship', 'Enterprises → Creators and People', 'Community seats for outside creators and leaders.'], ['Impact', 'Founders → Nonprofits', 'Giving, built into the system.']];
const currents = () => slide(`${k('How the power keeps flowing')}<h2>Value moves <b>on Currents.</b></h2><div class="cur">${CUR.map(([c, d, w]) => `<div class="panel"><b>${c} Current</b><small>${d}</small><span>${w}</span></div>`).join('')}<div class="panel hot"><b>Value keeps moving</b><span>to everyone who helps create it.</span></div></div>`);

// 04 Partnership™: the exact levels, prices and what each includes (pages/partnership.html, prices from pricing.json)
const LINES = ['Who you are and what you stand on.', 'Where it’s going and how it connects.', 'In every decision, every day.', 'So it outlasts you.'];
const BEST = ['Owners leading on their own.', 'Leadership teams.', 'The whole company.', 'Companies building beyond their founder.'];
const partner = () => slide(`${k('Partnership™')}<h2 style="font-size:40px;margin-bottom:12px">Four phases. <b>Four levels of partnership.</b></h2><div class="pt4">${P.tiers.map((t, i) => `<div class="panel"><span class="ey" style="white-space:nowrap;font-size:12px">${t.label} · Phase ${['I', 'II', 'III', 'IV'][i]}</span><div class="pr">${t.price}</div><div class="vb">${t.verb}. <span>${LINES[i]}</span></div><ul><li>${i ? `Everything in ${P.tiers[i - 1].label}, plus ` : ''}<b>${t.partnerIp}</b>, licensed to keep</li><li>All IV Phases™, licensed to keep</li><li>${t.term.split(' · ')[0]} of The .LLab Membership™, Library Card™ and Journal™</li><li>${t.term.split(' · ')[1]}</li></ul><div class="bf">Best for: ${BEST[i]}</div></div>`).join('')}</div><p class="fine" style="margin-top:10px">One-time purchase. No subscription. Licensed to keep, for internal enterprise use.</p>`);

// 05 The Co.LLab Founders Organization™: every level, its price and what it includes (pages/founders.html)
const FREE = ['The .LLab Mission &amp; Values Charter™', 'The .LLab Leadership Infrastructure Build Plan™', 'The .LLab Leadership Legacy Profile™', 'Legacy Profile™ + Leadership Alignment Map™', 'Legacy Profile™ + Legacy Infrastructure Map™', 'Legacy Infrastructure Map™ + Leadership Infrastructure Diagnostic™', 'Map™ + Diagnostic™ + Infrastructure Blueprint™', 'The complete IV Phases™ collection', 'All IV Phases™ + every .LLab Creators™ product', 'All IV Phases™ + Creators™ + every Blueprint™ issue', 'All IV Phases™ + Creators™ + every Blueprint™ issue'];
const founders = () => slide(`${k('The Co.LLab Founders Organization™')}<h2 style="font-size:44px;margin-bottom:8px">Become a Founder. <b>Build your legacy.</b></h2><p class="lead" style="font-size:20px;margin:0 0 14px">The ones who build first are remembered first. Your name goes on the Omnidirectional Legacy Wall, and stays there.</p><div class="fl4">${P.founders.map((f, i) => `<div class="panel"><div class="pr">${f.price.replace('–', ' – ')}</div><b>${f.label}</b><span>Free: ${FREE[i]}</span></div>`).join('')}<div class="panel hot"><b>Every level</b><span>Infrastructure Roadmap™ · credited in full toward a Partnership™ · supports a charity partner</span></div></div><p class="fine">A standalone BUILD offering. Built to invest back out: scholarships, angel investment and charitable donations. No ownership stake or financial return.</p>`);

// 06 Scalability: a network of enterprises, local to global
const scale = () => slide(`${k('Scalability')}<h2>Nobody builds alone. <b>Local to global.</b></h2><div class="chk"><div class="panel">Every enterprise that plugs in becomes a Conductor</div><div class="panel">Connections grow faster than enterprises</div><div class="panel">One idea powers many enterprises at once</div><div class="panel">Value that holds across geopolitical lines</div><div class="panel">Every .LLab™ page is a future company</div></div>`, 'wing', 4.6);

// 07 Connect: the ecosystem, set up like electricity
const who = (e, h, p, items) => `<div class="panel" style="padding:22px 26px"><span class="ey">${e}</span><b style="display:block;font-size:30px;color:#fff;line-height:1.1;margin:8px 0 8px">${h}</b><span style="display:block;font-size:19px;line-height:1.4;color:#fdf6ec">${p}</span><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">${items.map(([q, t, u]) => `<div style="display:grid;grid-template-columns:.95in 1fr;gap:12px;align-items:center"><img src="${q}" style="width:.95in;background:#fff;padding:4px;border-radius:8px;display:block"/><span style="font-size:16px;font-weight:800;color:#ff602e;line-height:1.2">${t}<br/><span style="color:#fff;font-weight:700">${u}</span></span></div>`).join('')}</div></div>`;
const connect = () => slide(`${k('Connect')}<h2>One ecosystem. <b>Plug into the Grid.</b></h2><p class="lead" style="font-size:21px;margin:-8px 0 16px">The Co.LLab™ is the Source. Every enterprise is a Conductor. Value moves on every Current, and every new Conductor makes the whole Grid stronger.</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">${who('For investors', 'Power the Source.', 'Partnership investment powers the Source through the Investment Current, and every other Current runs on it.', [[qPartner, 'Partnership™', 'Explore the levels'], [qCall, 'Book a call', 'A Partnership conversation']])}${who('For customers', 'Plug into the Grid.', 'License the IP, apply it to what you already do best, and collaborate with enterprises across every sector.', [[qSite, 'Start free', 'wearethellab.com'], [qPartner, 'Partnership™', 'Build your legacy']])}</div><div class="cts" style="margin-top:16px"><div><small>Ashley E. Clasby</small>Economic Enterprise Systems Strategist</div><div><small>Partnerships</small>partnerships@wearethellab.com</div><div><small>General</small>hello@wearethellab.com</div></div>`);

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>The Co.LLab™ — The Pitch</title><style>${baseCss}${css}</style></head><body>${title()}${sec(1, mission)}${sec(2, problem, solution, phases, oe1, oe2, oe3, oe4)}${sec(3, effect, currents)}${sec(4, partner)}${sec(5, founders)}${sec(6, scale)}${sec(7, connect)}</body></html>`;

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
