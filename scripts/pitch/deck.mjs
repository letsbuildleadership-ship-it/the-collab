import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '../..');
const require = createRequire(import.meta.url);
import { P } from './data.mjs';
const { chromium } = require('playwright');
const assets = path.join(here, 'assets');
const { renderCover } = await import(pathToFileURL(`${repo}/scripts/pdf-src/render.mjs`).href);
const baseCss = fs.readFileSync(`${repo}/scripts/pdf-src/base.css`, 'utf8');
const logo = `data:image/png;base64,${fs.readFileSync(`${repo}/assets/img/logo-mark.png`).toString('base64')}`;
const front = `data:image/png;base64,${fs.readFileSync(`${assets}/card-front.png`).toString('base64')}`;
const ph = (n) => `data:image/jpeg;base64,${fs.readFileSync(`${assets}/ph-${n}.jpg`).toString('base64')}`;
const QR = require('qrcode');
const SITE = 'https://wearethellab.netlify.app';
const qr = async (url) => QR.toDataURL(url, { margin: 1, width: 360, color: { dark: '#0f1d13', light: '#ffffff' } });
const qJoin = await qr(`${SITE}/pages/login.html`); const qProducts = await qr(`${SITE}/pages/products.html`); const qPartner = await qr(`${SITE}/pages/partnership.html`); const qCollab = await qr(`${SITE}/pages/collaborating-companies.html`); const qCard = await qr(`${SITE}/card/`);
const back = `data:image/png;base64,${fs.readFileSync(`${assets}/card-back.png`).toString('base64')}`;
import { bakeGlow } from './glow.mjs';
const EVENT = 'Building Leadership Infrastructure™';
const css = `
@page { size: 13.3333in 7.5in; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #0f1d13; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #f6ead9; }
a { color: inherit; text-decoration: none; }
.s { width: 13.3333in; height: 7.5in; position: relative; overflow: hidden; page-break-after: always; padding: .7in .85in .9in; background-color: #0f1d13; background-image: linear-gradient(rgba(255,106,46,.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,106,46,.10) 1px, transparent 1px); background-size: 64px 64px; display: flex; flex-direction: column; }
.s:last-child { page-break-after: auto; }
.brand { position: absolute; top: .42in; right: .6in; display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 800; color: #fff; } .brand img { height: 28px; }
.ft { position: absolute; left: .85in; right: .85in; bottom: .35in; display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,96,46,.9); border-top: 1px solid rgba(255,96,46,.35); padding-top: 10px; } .ft b { color: #fff; }
.k { display: flex; align-items: center; gap: 14px; font-size: 20px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; color: #fff; margin-bottom: 18px; } .k::before { content: ''; width: 46px; height: 2px; background: #ff602e; }
h1, h2 { color: #ff602e; font-weight: 200; letter-spacing: -.03em; line-height: 1.02; } h1 b, h2 b { font-weight: 800; color: #ff3a14; }
h2 { font-size: 78px; max-width: 11.2in; margin-bottom: 26px; }
.body { font-size: 32px; line-height: 1.4; color: #f6ead9; max-width: 10in; }
.panel { background: rgba(23,48,29,.94); border: 1px solid rgba(255,96,46,.42); border-radius: 18px; }
.grow { flex: 1; min-height: 0; }
.row { display: grid; gap: 18px; }
.cover-photo { position: absolute; right: 0; top: 0; bottom: 0; width: 5.6in; background-size: cover; background-position: center; } .cover-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, #0f1d13 0%, rgba(15,29,19,.5) 45%, rgba(15,29,19,.1) 100%); }
.cover h1 { font-size: 84px; margin: .3in 0 20px; max-width: 9in; position: relative; } .cover .body { position: relative; max-width: 7.4in; font-size: 26px; }
.tag { position: absolute; left: .85in; bottom: .5in; background: #0f1d13; border: 1px solid rgba(255,96,46,.42); border-radius: 14px; padding: 14px 22px; font-size: 20px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #fff; z-index: 3; } .tag span { display: block; color: #ff602e; margin-top: 4px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; } .two .panel { padding: 34px 38px; font-size: 40px; line-height: 1.3; font-weight: 700; color: #fff; } .two .panel small { display: block; font-size: 18px; letter-spacing: .18em; text-transform: uppercase; color: #ff9a6e; margin-bottom: 12px; }
.q4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; } .qc { position: relative; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,96,46,.42); background-size: cover; background-position: center; display: flex; flex-direction: column; justify-content: flex-end; padding: 26px 24px; } .qc::before { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(15,29,19,.05) 20%, rgba(15,29,19,.93) 70%); } .qc > * { position: relative; } .qc small { font-size: 18px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: #ff9a6e; } .qc b { display: block; font-size: 20px; color: #fff; margin: 4px 0 12px; } .qc div { font-size: 31px; line-height: 1.18; font-weight: 700; color: #fff; }
.steps4 { display: grid; gap: 16px; } .st4 { display: grid; grid-template-columns: 3.4in 1fr; align-items: center; } .st4 .a { font-size: 56px; font-weight: 200; color: #ff602e; padding: 14px 34px; } .st4 .b { font-size: 26px; font-weight: 700; color: #fff; padding: 14px 30px; border-left: 1px solid rgba(255,96,46,.42); } .st4 .b i { display: block; font-style: normal; font-size: 17px; letter-spacing: .18em; text-transform: uppercase; color: #ff9a6e; margin-bottom: 4px; }
.def { font-size: 40px; line-height: 1.22; font-weight: 200; color: #ff602e; margin-bottom: 20px; max-width: 11.4in; } .def b { font-weight: 800; color: #ff3a14; }
.wheelrow { display: grid; grid-template-columns: 6.2in 1fr; gap: .5in; align-items: center; } .wheelrow svg { width: 6.1in; height: 5in; } .wheelrow p { font-size: 32px; line-height: 1.4; }.wheelrow p + p { margin-top: 18px; color: #ff9a6e; font-weight: 700; }
.cols4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; } .col { padding: 26px 24px; display: flex; flex-direction: column; } .col small { font-size: 17px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #fff; } .col .v { font-size: 46px; font-weight: 200; color: #ff602e; margin: 4px 0 2px; } .col .nm { font-size: 18px; font-weight: 700; color: #f6ead9; margin-bottom: 16px; } .col .it { font-size: 22px; font-weight: 700; color: #fff; background: rgba(255,96,46,.14); border: 1px solid rgba(255,96,46,.42); border-radius: 999px; padding: 8px 18px; margin-bottom: 10px; align-self: flex-start; }
.try { display: grid; grid-template-columns: 1fr 4.3in; gap: .6in; align-items: center; } .step { display: grid; grid-template-columns: 70px 1fr; gap: 22px; align-items: center; padding: 20px 26px; margin-bottom: 16px; } .step .no { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ff2e12, #ff7a1f); color: #0f1d13; font-weight: 800; font-size: 30px; display: grid; place-items: center; } .step b { font-size: 30px; color: #fff; display: block; } .step span { font-size: 22px; color: #f6ead9; }
.qrbig { padding: 26px; text-align: center; } .qrbig img { width: 3.3in; height: 3.3in; background: #fff; padding: 10px; border-radius: 14px; } .qrbig b { display: block; font-size: 30px; color: #fff; margin-top: 14px; } .qrbig span { font-size: 20px; color: #ff9a6e; font-weight: 700; }
.tiers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; } .tier { padding: 26px 24px; border-top: 4px solid #ff602e; display: flex; flex-direction: column; } .tier small { font-size: 18px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #ff9a6e; } .tier .p { font-size: 56px; font-weight: 800; color: #fff; margin: 6px 0; line-height: 1; } .tier .h { font-size: 28px; font-weight: 300; color: #ff602e; margin-bottom: 14px; } .tier .m { font-size: 22px; font-weight: 700; color: #fff; margin-top: auto; padding-top: 12px; border-top: 1px dashed rgba(255,96,46,.42); }
.entry { margin-top: 22px; font-size: 24px; color: #f6ead9; padding: 16px 26px; } .entry b { color: #ff9a6e; }
.legal { margin-top: 14px; font-size: 18px; font-style: italic; color: #ecdcc8; }
.pts { display: grid; gap: 16px; } .pt { padding: 24px 30px; font-size: 28px; line-height: 1.35; } .pt b { display: block; font-size: 32px; color: #fff; margin-bottom: 4px; }
.trio { display: grid; grid-template-columns: repeat(3, 1fr); gap: 22px; } .opt { padding: 26px 26px; display: grid; grid-template-columns: 1fr 1.7in; gap: 16px; align-items: center; } .opt small { font-size: 17px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; color: #ff9a6e; } .opt h3 { font-size: 32px; font-weight: 300; color: #ff602e; margin: 6px 0 8px; line-height: 1.05; } .opt p { font-size: 20px; line-height: 1.35; } .opt img { width: 1.7in; height: 1.7in; background: #fff; padding: 7px; border-radius: 12px; }
.cg { display: grid; grid-template-columns: 4.2in 1fr; gap: .6in; align-items: center; } .cg .imgs img { width: 100%; border-radius: 10px; margin-bottom: 18px; display: block; } .who h3 { font-size: 64px; font-weight: 200; color: #ff602e; line-height: 1.05; } .who h3 b { font-weight: 800; color: #ff3a14; } .who .r { font-size: 24px; font-weight: 700; color: #fff; margin: 14px 0 4px; } .who p { font-size: 22px; color: #f6ead9; } .who .rows { display: grid; gap: 12px; margin-top: 22px; } .who .rows div { padding: 14px 22px; font-size: 26px; font-weight: 700; color: #fff; } .who .rows small { display: block; font-size: 15px; letter-spacing: .18em; text-transform: uppercase; color: #ff9a6e; }

.s p, .s div, .s span, .s a, .s b, .s small, .s i { color: inherit; }
.s p { color: #f6ead9; } .s h3 { color: #ff602e; }
.s > * { min-width: 0; } .s .panel, .s .panel > * { min-width: 0; }
.center { justify-content: center; } .center h2 { font-size: 96px; max-width: 11.6in; } .center .body { font-size: 38px; }
h2 { font-size: 56px; }
.cover .k, .cover h1, .cover .body { position: relative; z-index: 2; } .cover .k { max-width: 7.2in; font-size: 17px; }
.st4 .a { font-size: 44px; padding: 10px 30px; } .st4 .b { font-size: 24px; padding: 10px 26px; }
.def { font-size: 32px; margin-bottom: 14px; }
.qc div { font-size: 24px; } .qc b { font-size: 17px; } .qc { padding: 22px 20px; }
.tier small { font-size: 14px; letter-spacing: .1em; } .tier .p { font-size: 46px; } .tier .h { font-size: 24px; } .tier .m { font-size: 20px; }
.qrbig img { width: 2.7in; height: 2.7in; } .qrbig b { font-size: 26px; } .qrbig { padding: 20px; }
.step b { font-size: 28px; } .step { padding: 16px 22px; margin-bottom: 12px; }
.pt { font-size: 24px; padding: 18px 26px; } .pt b { font-size: 28px; }
.trio { gap: 18px; } .opt { padding: 24px; display: block; } .opt img { display: block; margin-top: 14px; } .pills { display: flex; gap: 18px; margin-top: 16px; } .pills a { flex: 1; text-align: center; padding: 14px 10px; border-radius: 999px; background: linear-gradient(90deg,#ff2e12,#ff7a1f); color: #0f1d13 !important; font-size: 20px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; } .opt img { width: 1.3in; height: 1.3in; justify-self: start; } .opt h3 { font-size: 30px; } .opt p { font-size: 22px; }
.wheelrow p { font-size: 30px; }
.col .it { font-size: 16px; line-height: 1.15; padding: 7px 14px; border-radius: 14px; margin-bottom: 7px; } .col .v { font-size: 38px; } .col .nm { margin-bottom: 10px; } .col { padding: 20px 18px; }
.vgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; } .vcard { padding: 24px 22px; display: flex; flex-direction: column; gap: 12px; } .vcard h3 { font-size: 30px; font-weight: 300; color: #ff602e; line-height: 1.08; letter-spacing: -.01em; } .vcard p { font-size: 21px; line-height: 1.35; color: #f6ead9; } .chip { align-self: flex-start; font-size: 14px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #0f1d13 !important; background: linear-gradient(90deg,#ff2e12,#ff7a1f); border-radius: 999px; padding: 5px 14px; }
.vsplit { display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px; } .vstack { display: grid; gap: 16px; align-content: start; } .vcard .spaces { display: flex; flex-wrap: wrap; gap: 8px; } .vcard .spaces span { font-size: 17px; font-weight: 700; color: #fff; background: rgba(255,96,46,.14); border: 1px solid rgba(255,96,46,.42); border-radius: 999px; padding: 6px 14px; }
.vstack .vcard { padding: 14px 20px; gap: 6px; } .vstack .vcard h3 { font-size: 24px; } .vstack .vcard p { font-size: 18px; } .vstack .chip { font-size: 12px; padding: 3px 12px; } .vsplit { align-items: start; } .chip.dev { background: transparent; color: #fff !important; border: 1px solid #ff602e; } .chip.vis { background: transparent; color: #ff9a6e !important; border: 1px dashed #ff9a6e; } .vfine { margin-top: 10px; font-size: 15px; font-style: italic; color: #ecdcc8; }
.azgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; } .azcol { display: grid; gap: 9px; } .azc { padding: 8px 18px; } .azc .top { display: flex; align-items: center; justify-content: space-between; gap: 12px; } .azc h3 { font-size: 21px; font-weight: 400; color: #ff602e; line-height: 1.1; } .azc .chip { font-size: 11px; padding: 3px 10px; white-space: nowrap; letter-spacing: .1em; } .azc p { font-size: 15.5px; line-height: 1.25; color: #f6ead9; margin-top: 3px; }
`;
let n = 0;
const ft = () => { n += 1; return `<div class="ft"><span><b>The Co.LLab™</b> · ${EVENT}</span><span>${String(n).padStart(2, '0')}</span></div>`; };
const slide = (inner, cls = '') => `<section class="s ${cls}"><div class="brand"><img src="${logo}"/><span>The Co.LLab™</span></div>${inner}${ft()}</section>`;

const s1 = `<section class="s cover"><div class="cover-photo" style="background-image:url(${ph('scaffolding')})"></div><div class="brand"><img src="${logo}"/><span>The Co.LLab™</span></div>
<p class="k" style="margin-top:.3in">Leadership Infrastructure™ · The pitch</p>
<h1>Every company starts<br/>with a vision.<br/><b>Most lose it.</b></h1>
<p class="body">The Co.LLab™ builds the infrastructure that defines, builds and passes on a company’s vision, licensed as IP.</p>
<a class="tag" href="${SITE}">Let’s Build Your Legacy<span>Through Omnidirectional Enterprise™</span></a></section>`; n += 0;

const s2 = slide(`<p class="k">The case</p><h2 style="font-size:56px">Generating value and capturing value <b>are different processes.</b></h2><div class="two grow" style="align-items:stretch"><div class="panel" style="font-size:25px;font-weight:500"><small>The problem</small>The global economy faces a structural coordination problem: capital, labor, intellectual property, technology, and decision-making authority operate through institutions and markets whose incentives do not always align with productive contribution.</div><div class="panel" style="font-size:25px;font-weight:500"><small>The solution</small>The Co.LLab™ develops proprietary products, intellectual property, and leadership infrastructure organized around the Omnidirectional Enterprise™ operating model.</div></div>`);
const s3 = slide(`<p class="k">Why it matters now</p><h2>Technology scales <b>what you have built.</b></h2>
<div class="two grow" style="align-items:stretch;margin-top:10px"><div class="panel"><small>A defined vision</small>Travels with the company, and everything you add to it.</div><div class="panel"><small>An undefined one</small>Leaves with the person who carried it.</div></div>`);
const qc = (p, nm, q, img) => `<div class="qc" style="background-image:url(${ph(img)})"><small>${p}</small><b>${nm}</b><div>${q}</div></div>`;
const s4 = slide(`<p class="k">The IV Phases™</p><h2 style="font-size:64px">Can you answer these <b>four questions?</b></h2><div class="q4 grow">
${qc('Phase I', 'Foundations', 'What should never be lost as we grow?', 'lake')}${qc('Phase II', 'Infrastructure Planning &amp; Management', 'What depends on a person that should belong to the organization?', 'road')}${qc('Phase III', 'Internal Operating Systems', 'How do we make what matters part of how we operate?', 'old-faithful')}${qc('Phase IV', 'Preservation', 'What must exist for what we built to continue?', 'arch')}</div>`);
const st = (a, i, b) => `<div class="st4 panel"><div class="a">${a}</div><div class="b"><i>${i}</i>${b}</div></div>`;
const s5 = slide(`<p class="k">Leadership Infrastructure™</p><h2 style="font-size:64px">Leadership, made <b>structural.</b></h2><p class="def">Captured, documented and embedded, so it <b>outlasts the individuals who hold it.</b></p><div class="steps4 grow" style="align-content:stretch">
${st('Define it.', 'Phase I', 'Foundations')}${st('Plan it.', 'Phase II', 'Infrastructure Planning &amp; Management')}${st('Live it.', 'Phase III', 'Internal Operating Systems')}${st('Pass it on.', 'Phase IV', 'Preservation')}</div>`);
const nodes = ['Businesses', 'Nonprofits', 'Communities', 'People', 'Technology', 'Capital', 'Knowledge + IP', 'Creators'];
const cx = 250, cy = 250, R = 190; const pts = nodes.map((name, i) => { const a = (-90 + i * 45) * Math.PI / 180; return { name, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
const svg = `<svg viewBox="-30 0 560 500" xmlns="http://www.w3.org/2000/svg"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ff602e" stroke-width="1.5" stroke-dasharray="4 6" opacity=".6"/>${pts.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#ff602e" stroke-width="2" opacity=".7"/>`).join('')}<circle cx="${cx}" cy="${cy}" r="76" fill="#0f1d13" stroke="#ff602e" stroke-width="2"/><text x="${cx}" y="${cy - 8}" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">The Co.LLab™</text><text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#ff9a6e" font-size="15" font-weight="800">Omnidirectional</text><text x="${cx}" y="${cy + 31}" text-anchor="middle" fill="#ff9a6e" font-size="15" font-weight="800">Enterprise™</text>${pts.map((p) => `<g><rect x="${(p.x - 72).toFixed(1)}" y="${(p.y - 20).toFixed(1)}" width="144" height="40" rx="20" fill="#17301d" stroke="#ff602e" stroke-width="1.5"/><text x="${p.x.toFixed(1)}" y="${(p.y + 6).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="17" font-weight="800">${p.name}</text></g>`).join('')}</svg>`;
const s6 = slide(`<p class="k">The ecosystem</p><h2 style="font-size:64px;margin-bottom:6px">Not a funnel. <b>A coordinated system.</b></h2><div class="wheelrow grow">${svg}<div><p>Value moves in every direction between people, ideas, products, organizations and community.</p><p>Built on ethics: how we treat people is part of the infrastructure.</p></div></div>`);
const col = (a, v, nm, items) => `<div class="col panel"><small>${a}</small><div class="v">${v}</div><div class="nm">${nm}</div>${items.map((i) => `<div class="it">${i}</div>`).join('')}</div>`;
const s7 = slide(`<p class="k">What you license</p><h2 style="font-size:64px">Infrastructure planning IP. <b>One for every step.</b></h2><div class="cols4 grow">
${col('Phase I', 'Define it', 'Foundations', [P.phaseLines[0]])}${col('Phase II', 'Plan it', 'Infrastructure Planning &amp; Management', [P.phaseLines[1]])}${col('Phase III', 'Live it', 'Internal Operating Systems', [P.phaseLines[2]])}${col('Phase IV', 'Pass it on', 'Preservation', [P.phaseLines[3]])}</div><p class="legal">Every product is in the catalog, by phase. Licensed to keep. A license grants use, not ownership.</p>`);
const stp = (no, b, s) => `<div class="step panel"><div class="no">${no}</div><div><b>${b}</b><span>${s}</span></div></div>`;
const s8 = slide(`<p class="k">Start now</p><h2 style="font-size:64px">Experience the method <b>before you invest.</b></h2><div class="try grow"><div>${stp(1, 'Use the free tools', 'Open to everyone. No account needed.')}${stp(2, 'Join free, work a quest', 'A guided quest on any free tool, with your Infrastructure Snapshot™.')}${stp(3, 'Membership goes deeper', 'The full Infrastructure Analysis™, your outcomes, and the paid IP.')}</div><a class="qrbig panel" href="${SITE}/pages/login.html"><img src="${qJoin}"/><b>Scan to join free</b><span>wearethellab.netlify.app</span></a></div>`);
const tier = (tn, p, h, m) => `<div class="tier panel"><small>${tn}</small><div class="p">${p}</div><div class="h">${h}</div><div class="m">${m}</div></div>`;
const s9 = slide(`<p class="k">Partnership</p><h2 style="font-size:64px">Four levels. <b>One legacy.</b></h2><div class="tiers grow">
${P.tiers.map((t) => tier(t.label, t.price, t.line, t.term)).join('')}</div>
<div class="entry panel"><b>Start free.</b> <b>.LLab Library Card™</b> ${P.libMo} · <b>The .LLab Journal™</b> ${P.journalYr} · <b>.LLab Membership™</b> ${P.memMo}, with the Infrastructure Analysis™</div>
<p class="legal">IV Phases™ IP ${P.range}. One-time purchase. No subscription and no automatic charges. A license for internal business use. Results depend on how each business applies it.</p>`);
const s10 = slide(`<p class="k">.LLab Collaborating Companies</p><h2 style="font-size:64px">Companies that <b>collaborate with us.</b></h2><div class="pts grow" style="align-content:center">
<div class="pt panel"><b>Who collaborates</b>Companies that license any .LLab™ product or hold a Membership.</div><div class="pt panel"><b>What is shown</b>Only what each company writes, so companies work with each other directly.</div><div class="pt panel"><b>How it stays true</b>The Co.LLab™ reads each page, and each change to it, before it appears.</div></div>`);
const opt = (i, h, p, q, u) => `<div class="opt panel"><small>${i}</small><h3>${h}</h3><p>${p}</p><img src="${q}"/></div>`;
const vcard = (name, st, line, extra = '') => `<div class="vcard panel"><span class="chip">${st}</span><h3>${name}</h3><p>${line}</p>${extra}</div>`;
const azv = [["Co.LLab+™", "In development", "The e-commerce side of The Co.LLab™, where members list their website, highlight a product or service, and advertise."], ["The Intelligence Paradox Trilogy™", "Coming soon", "Three ideas. One paradox. Dropping soon. Under .LLab R.A.T.™, in The .LLab Legacy Library™ and The .LLab Journal™."], [".LLab Atelier™", "In development", "Where infrastructure meets craft and space. Wearable workwear and accessories · Homes · Office spaces · Creative studio spaces"], [".LLab AV Productions™", "In development", "All things sound and video, for the occasions that bring people together and the people who create them. Includes home office integrations."], [".LLab Communications™", "In development", "The original technology. Tools that bring people into the same room, not just onto a screen."], [".LLab Edu™", "In development", "Sponsored learning and mentorship for partners, and future educational courses."], ["Renewable Energy Ecosystem™", "Vision", "Power that sustains community. Renewable energy so communities can sustain their culture for generations."]];
const azc = ([n, st, l]) => `<div class="azc panel"><div class="top"><h3>${n}</h3><span class="chip ${st === 'In development' ? 'dev' : st === 'Vision' ? 'vis' : ''}">${st}</span></div><p>${l}</p></div>`;
const s10a = slide(`<p class="k">What’s next · A to Z</p><h2 style="font-size:48px;margin-bottom:10px">Every venture, <b>one foundation.</b></h2><div class="azgrid grow"><div class="azcol">${azv.slice(0, 4).map(azc).join('')}</div><div class="azcol">${azv.slice(4).map(azc).join('')}</div></div><p class="vfine">Each grows from The IV Phases™ and the Omnidirectional Enterprise™. In development and not currently offered for sale or lease. Nothing here is an offer of securities or a solicitation of investment.</p>`);
const s11 = slide(`<p class="k">Your next step</p><h2 style="font-size:64px">Build the infrastructure. <b>Create the legacy.</b></h2><div class="trio grow" style="align-content:start">
${opt('Starting free', 'Enter the Ecosystem', 'Join free to work a quest on any free tool.', qJoin, SITE + '/pages/login.html')}${opt('Licensed to keep', 'Own Your Framework', 'The IP for the phase that matters now.', qProducts, SITE + '/pages/products.html')}${opt('Full partnership', 'Build the Legacy', 'Define, plan, live and preserve it, with seats for your team.', qPartner, SITE + '/pages/partnership.html')}</div><div class="pills"><a href="${SITE}/pages/login.html">Enter the Ecosystem ›</a><a href="${SITE}/pages/products.html">Own Your Framework ›</a><a href="${SITE}/pages/partnership.html">Build the Legacy ›</a></div>`);
const s12 = slide(`<p class="k">Let’s talk</p><div class="cg grow"><div class="imgs"><a href="${SITE}/card/"><img src="${front}"/></a><a href="${SITE}/card/"><img src="${back}"/></a></div><div class="who"><h3>Ashley E. <b>Clasby</b></h3><div class="r">Omnidirectional Enterprise™ Founder &amp; Strategist</div><p>The Co.LLab™: Building Leadership Infrastructure</p><div class="rows"><div class="panel"><small>Website</small><a href="${SITE}">wearethellab.netlify.app</a></div><div class="panel"><small>Email</small><a href="mailto:letsbuildleadership@gmail.com">letsbuildleadership@gmail.com</a></div></div></div></div>`);
const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>The Co.LLab™ — The Pitch</title><style>${baseCss}${css}</style></head><body>${s1}${s2}${s4}${s5}${s6}${s7}${s8}${s9}${s10}${s10a}${s11}${s12}</body></html>`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const over = await page.evaluate(() => [...document.querySelectorAll('.s')].map((s, i) => [i + 1, [...s.children].filter((c) => !c.classList.contains('ft') && !c.classList.contains('brand') && c.getBoundingClientRect().bottom > s.getBoundingClientRect().bottom - 60).length ? 'low' : 0]).filter((x) => x[1]).map((x) => x[0]));
await page.evaluate(() => {
  const from = [255, 26, 26], to = [255, 106, 46];
  document.querySelectorAll('h1 b, h2 b, .t b, .defq b, .words2 b').forEach((b) => {
    const text = b.textContent; const chars = [...text]; const n = Math.max(chars.length - 1, 1);
    b.textContent = '';
    chars.forEach((ch, i) => {
      const t = i / n; const c = from.map((v, k) => Math.round(v + (to[k] - v) * t));
      const s = document.createElement('span'); s.textContent = ch; s.style.color = `rgb(${c.join(',')})`; b.appendChild(s);
    });
  });
});
await bakeGlow(browser, page, { sectionSel: '.s', titleSel: 'h1 b, h2 b', w: 1280, h: 720 });
await page.pdf({ path: `${repo}/assets/pitch/The-CoLLab-Pitch-Deck.pdf`, printBackground: true, preferCSSPageSize: true, outline: true });
console.log('crowded', JSON.stringify(over));
await browser.close();
