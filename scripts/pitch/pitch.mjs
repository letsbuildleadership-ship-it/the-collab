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

const CSS4 = fs.readFileSync(`${assets}/css4.css`,"utf8");
const CSS3 = fs.readFileSync(`${assets}/css3.css`,"utf8");
import { bakeGlow } from './glow.mjs';
const css = `
.g { width: 8.5in; height: 11in; padding: 0.62in 0.62in 0.62in; position: relative; page-break-after: always; overflow: hidden; background: var(--paper); }
.g:last-child { page-break-after: auto; }
.gi { display: flex; flex-direction: column; }
.gi > * { flex: 0 0 auto; }
.gi > .grow { flex: 1 1 0; min-height: 0; }
.ft { position: absolute; left: 0.62in; right: 0.62in; bottom: 0.3in; display: flex; justify-content: space-between; font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-dim); border-top: 1px solid var(--hairline-strong); padding-top: 7px; }
.ft b { color: var(--orange-deep); }
.grid-fill { display: grid; grid-auto-rows: 1fr; align-content: stretch; }
.k { display: flex; align-items: center; gap: 10px; font-size: 10.5px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; color: var(--orange-deep); margin: 0 0 8px; }
.k::before { content: ''; width: 26px; height: 2px; background: var(--orange-deep); }
.t { font-size: 34px; line-height: 1.05; font-weight: 300; color: var(--hunter); margin: 0 0 8px; letter-spacing: -.02em; }
.t b { font-weight: 800; color: var(--orange-deep); }
.lead { font-size: 14.5px; line-height: 1.5; color: var(--ink-dim); margin: 0 0 18px; max-width: 6.6in; }
.hero { background: var(--hunter); color: #fff; border-radius: 10px; padding: 24px 28px; margin: 0 0 16px; position: relative; overflow: hidden; }
.hero::after { content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(255,90,31,.55), transparent 70%); }
.hero p { margin: 0; position: relative; z-index: 1; color: #fff; }
.hero .big { font-size: 24px; line-height: 1.25; font-weight: 300; }
.hero .big b { font-weight: 800; color: #ff9a6e; }
.hero .sm { font-size: 12px; margin-top: 10px; color: #f2dccb !important; letter-spacing: .02em; }
.bubble { background: #fff; border: 1.5px solid var(--hairline-strong); border-radius: 14px; padding: 14px 18px; font-size: 13px; line-height: 1.55; position: relative; margin: 0 0 14px; }
.bubble::before { content: '“'; position: absolute; left: 10px; top: -4px; font-size: 40px; color: var(--orange); line-height: 1; }
.bubble p { margin: 0 0 0 16px; }
.lab { font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-dim); margin: 0 0 6px; }
.row4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 0 0 14px; }
.ph { border-radius: 10px; padding: 14px 12px 12px; color: #fff; position: relative; display: flex; flex-direction: column; }
.ph .q { margin-top: auto; }
.ph:nth-child(1) { background: #cc2a0a; } .ph:nth-child(2) { background: #e8561a; } .ph:nth-child(3) { background: #2d6a47; } .ph:nth-child(4) { background: #0f1d13; }
.ph .n { font-size: 11px; font-weight: 800; letter-spacing: .12em; opacity: .85; }
.ph .v { font-size: 22px; font-weight: 800; line-height: 1.05; margin: 4px 0 6px; }
.ph .nm { font-size: 11px; font-weight: 700; line-height: 1.25; margin-bottom: 8px; }
.ph .q { font-size: 10.5px; line-height: 1.35; font-style: italic; opacity: .95; border-top: 1px solid rgba(255,255,255,.35); padding-top: 7px; }
.banner { background: linear-gradient(90deg, #cc2a0a, #ff7a1f); color: #fff; border-radius: 8px; padding: 12px 18px; font-size: 14px; font-weight: 700; text-align: center; letter-spacing: .01em; }
.map { display: grid; gap: 8px; grid-auto-rows: 1fr; }
.mr { display: grid; grid-template-columns: 2.05in 1fr 1.9in; align-items: stretch; gap: 0; align-items: stretch; background: #fff; border-radius: 8px; border: 1px solid var(--hairline); overflow: hidden; }
.mr > div { padding: 9px 12px; font-size: 12px; line-height: 1.3; display: flex; flex-direction: column; justify-content: center; }
.mr .a { background: var(--hunter); color: #fff; font-weight: 800; }
.mr .a small { font-weight: 400; color: #f2dccb; font-size: 10.5px; }
.mr .b { color: var(--ink-dim); } .mr .b em { color: var(--orange-deep); font-style: normal; font-weight: 800; }
.mr .c { background: rgba(255,90,31,.12); color: var(--orange-deep); font-weight: 800; border-left: 3px solid var(--orange); }
.note { background: var(--paper-soft); border-left: 4px solid var(--orange); border-radius: 4px; padding: 11px 15px; font-size: 12px; line-height: 1.5; margin-top: 12px; }
.note b { color: var(--orange-deep); }
.cards4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 9px; margin-top: 12px; }
.pc { background: #fff; border: 1px solid var(--hairline-strong); border-radius: 10px; padding: 12px 11px; border-top: 5px solid var(--orange); }
.pc:nth-child(2) { border-top-color: #e8561a; } .pc:nth-child(3) { border-top-color: #2d6a47; } .pc:nth-child(4) { border-top-color: var(--hunter); }
.pc .p { font-size: 22px; font-weight: 800; color: var(--hunter); } .pc .tn { font-size: 10px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--orange-deep); }
.pc .h { font-size: 13px; font-weight: 800; margin: 5px 0 3px; color: var(--hunter); } .pc .d { font-size: 10.8px; color: var(--ink-dim); line-height: 1.4; }
.pc .m { font-size: 10.5px; font-weight: 700; margin-top: 7px; padding-top: 6px; border-top: 1px dashed var(--hairline-strong); }
.flow { display: grid; grid-template-columns: repeat(3, 1fr); grid-auto-rows: 1fr; gap: 18px 12px; margin: 10px 0 14px; }
.st { background: #fff; border: 1px solid var(--hairline-strong); border-radius: 12px; padding: 18px 14px 14px; position: relative; }
.st .no { position: absolute; top: -13px; left: 14px; width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, #cc2a0a, #ff7a1f); color: #fff; font-weight: 800; font-size: 15px; display: grid; place-items: center; box-shadow: 0 3px 8px rgba(204,42,10,.35); }
.st h4 { margin: 6px 0 6px; font-size: 16px; line-height: 1.2; color: var(--hunter); } .st p { margin: 0; font-size: 13.5px; line-height: 1.5; color: var(--ink-dim); }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.say, .nev { border-radius: 10px; padding: 14px 16px; font-size: 13.5px; line-height: 1.55; }
.say { background: rgba(45,106,71,.12); border: 1.5px solid #2d6a47; } .nev { background: rgba(204,42,10,.09); border: 1.5px solid var(--orange-deep); }
.say h5, .nev h5 { margin: 0 0 6px; font-size: 11px; letter-spacing: .14em; text-transform: uppercase; } .say h5 { color: #1f5a39; } .nev h5 { color: var(--orange-deep); }
.say span, .nev span { display: inline-block; background: #fff; border-radius: 999px; padding: 2px 10px; margin: 2px 3px 2px 0; font-weight: 700; font-size: 13px; border: 1px solid var(--hairline-strong); }
.dq { display: grid; gap: 9px; grid-auto-rows: 1fr; }
.dc { display: grid; align-items: stretch; grid-template-columns: 1.7in 1fr; border-radius: 10px; overflow: hidden; background: #fff; border: 1px solid var(--hairline-strong); }
.dc .l { padding: 12px 14px; color: #fff; display: flex; flex-direction: column; justify-content: center; } .dc .l b { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; opacity: .9; } .dc .l span { font-size: 16px; font-weight: 800; line-height: 1.15; margin-top: 3px; }
.dc .r { padding: 11px 15px; display: flex; flex-direction: column; justify-content: center; } .dc .gq { font-size: 15px; font-weight: 800; color: var(--hunter); line-height: 1.25; } .dc .ak { font-size: 13.5px; color: var(--ink-dim); margin-top: 6px; line-height: 1.45; } .dc .ak b { color: var(--orange-deep); }
.qa { display: grid; gap: 10px; grid-auto-rows: 1fr; }
.q1 { display: grid; grid-template-columns: 1fr; align-content: center; }
.theysay { justify-self: start; max-width: 5.4in; background: var(--hunter); color: #fff; border-radius: 14px 14px 14px 2px; padding: 9px 16px; font-size: 14.5px; font-weight: 700; }
.yousay { justify-self: end; max-width: 6.3in; background: #fff; border: 1.5px solid var(--orange); border-radius: 14px 14px 2px 14px; padding: 10px 16px; font-size: 13.5px; line-height: 1.5; margin-top: 4px; }
.yousay em { color: var(--orange-deep); font-style: normal; font-weight: 800; }
.rules { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 9px; }
.ru { align-items: center; background: #fff; border: 1px solid var(--hairline-strong); border-left: 5px solid var(--orange-deep); border-radius: 6px; padding: 9px 12px; font-size: 13.5px; line-height: 1.42; display: grid; grid-template-columns: 28px 1fr; gap: 10px; }
.ru .x { width: 24px; height: 24px; border-radius: 50%; background: var(--orange-deep); color: #fff; font-weight: 800; display: grid; place-items: center; font-size: 13px; }
.ru b { color: var(--hunter); display: block; font-size: 14.5px; margin-bottom: 2px; }
.tl { position: relative; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 26px 0 10px; }
.tl::before { content: ''; position: absolute; left: 6%; right: 6%; top: 17px; height: 4px; background: linear-gradient(90deg, #cc2a0a, #ff7a1f); border-radius: 2px; }
.tn { position: relative; text-align: center; }
.tn .dot { width: 38px; height: 38px; border-radius: 50%; background: var(--hunter); color: #fff; border: 4px solid var(--orange); font-weight: 800; font-size: 11px; display: grid; place-items: center; margin: 0 auto 8px; position: relative; z-index: 1; }
.tn .bx { background: #fff; min-height: 1.5in; font-size: 13px !important; border: 1px solid var(--hairline-strong); border-radius: 10px; padding: 10px 10px; font-size: 11.3px; line-height: 1.42; text-align: left; min-height: 1.15in; }
.tn .bx b { display: block; color: var(--orange-deep); font-size: 12px; margin-bottom: 3px; }
.chk { display: grid; gap: 7px; font-size: 14.5px; margin: 6px 0 12px; grid-auto-rows: 1fr; } .chk div { display: grid; grid-template-columns: 22px 1fr; gap: 8px; align-items: center; background: #fff; border: 1px solid var(--hairline); border-radius: 6px; padding: 7px 10px; } .chk i { width: 16px; height: 16px; border: 2px solid var(--orange-deep); border-radius: 3px; display: block; }
.links { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 8px; margin-top: 8px; }
.lk { display: flex !important; flex-direction: column; justify-content: center; background: var(--hunter); color: #fff; border-radius: 8px; padding: 9px 14px; font-size: 13.5px; text-decoration: none; display: block; } .lk b { display: block; color: #ff8a5c; font-size: 15px; } .lk span { color: #f2dccb; font-size: 12px; }
.ladder { display: flex; align-items: stretch; gap: 6px; margin: 6px 0 4px; }
.lc { flex: 1; display: flex; flex-direction: column; }
.lc .lsp { min-height: 0; }
.lbar { border-radius: 6px 6px 0 0; color: #fff; text-align: center; font-weight: 800; font-size: 12.5px; padding-top: 6px; min-height: 0; }
.lt { font-size: 10px; line-height: 1.25; font-weight: 700; color: var(--hunter); text-align: center; padding: 5px 2px 0; min-height: 40px; }
.cardwrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0; } .cardwrap img { width: 100%; border-radius: 6px; box-shadow: 0 6px 16px rgba(15,29,19,.28); }
.ct { display: grid; gap: 7px; } .ct div { display: grid; grid-template-columns: 1.3in 1fr; gap: 10px; background: #fff; border: 1px solid var(--hairline); border-radius: 6px; padding: 9px 12px; font-size: 12.5px; } .ct b { color: var(--orange-deep); text-transform: uppercase; font-size: 10.5px; letter-spacing: .1em; }
`;

const css2 = `
:root { --deep: #cc2a0a; --green: #2d6a47; }
.tw h3, .tw p, .tw .i { color: #fff; } .tw p { font-weight: 600; font-size: 16px; } .tw:nth-child(2) { background: #cf4a10; }
.cards4 .pc .tn { font-size: 11px; } .cards4 .pc .p { font-size: 30px; } .cards4 .pc .h { font-size: 17px; } .cards4 .pc .d { font-size: 14px; line-height: 1.45; } .cards4 .pc .m { font-size: 14px; }
.pbox .it { font-size: 17px; padding: 10px 14px; } .pbox .nm { font-size: 14px; }
.sp b { font-size: 19px; } .sp span { font-size: 15.5px; }
.mvv div { font-size: 14.5px; }
.cv { background: var(--hunter); color: #fff; position: relative; padding: 0; }
.cv .ph-photo { position: absolute; left: 0; right: 0; bottom: 0; height: 5.3in; background-size: cover; background-position: center 40%; }
.cv .ph-photo::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, var(--hunter) 0%, rgba(15,29,19,.35) 55%, rgba(15,29,19,.1) 100%); }
.cv .top { position: absolute; left: .75in; right: .75in; top: .7in; z-index: 2; }
.cv .top .k { color: var(--gold); } .cv h1 { font-size: 54px; line-height: 1.04; font-weight: 300; letter-spacing: -.025em; margin: 18px 0 18px; max-width: 6.4in; } .cv h1 b { font-weight: 800; color: var(--gold); }
.cv .sub { font-size: 17.5px; line-height: 1.5; color: #f2dccb; max-width: 5.8in; }
.cv .bot { position: absolute; left: .75in; right: .75in; bottom: .6in; z-index: 2; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; } .cv .bot span { color: var(--gold); display: block; margin-top: 3px; } .cv .logo { display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 800; letter-spacing: .04em; text-transform: none; } .cv .logo img { height: 28px; }
.qrow { display: grid; grid-template-columns: 2.6in 1fr; border-radius: 14px; overflow: hidden; background: #fff; border: 1px solid var(--hairline-strong); }
.qrow .im { background-size: cover; background-position: center; position: relative; } .qrow .im::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, rgba(15,29,19,.15), rgba(15,29,19,.55)); }
.qrow .im .pp { position: absolute; left: 14px; bottom: 12px; z-index: 2; color: #fff; font-weight: 800; } .qrow .im .pp small { display: block; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: #ffb08c; } .qrow .im .pp b { font-size: 17px; line-height: 1.1; display: block; margin-top: 2px; }
.qrow .tx { padding: 14px 20px; display: flex; align-items: center; font-size: 22px; line-height: 1.22; font-weight: 800; color: var(--hunter); }
.defq { font-size: 30px; line-height: 1.2; font-weight: 300; color: var(--hunter); margin: 4px 0 16px; } .defq b { color: var(--deep); font-weight: 800; }
.arw { display: grid; gap: 9px; grid-auto-rows: 1fr; } .arw .a { display: grid; grid-template-columns: 1.7in 1fr; border-radius: 10px; overflow: hidden; color: #fff; } .arw .a div:first-child { padding: 12px 16px; font-size: 24px; font-weight: 800; display: flex; align-items: center; white-space: nowrap; } .arw .a div:last-child { padding: 12px 16px; background: rgba(255,255,255,.12); font-size: 14.5px; font-weight: 600; display: flex; flex-direction: column; justify-content: center; } .arw .a i { font-style: normal; font-size: 10.5px; letter-spacing: .14em; text-transform: uppercase; color: #ffd2bd; font-weight: 800; }
.mvv { display: grid; gap: 10px; margin-top: 14px; } .mvv div { background: var(--paper2); border-left: 4px solid var(--orange); padding: 11px 16px; font-size: 13.5px; line-height: 1.5; border-radius: 4px; } .mvv b { display: block; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--deep); margin-bottom: 3px; }
.oew { display: flex; justify-content: center; align-items: center; } .oew svg { width: 5.3in; height: 5.3in; }
.p2 { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: 1fr; gap: 12px; }
.pbox { border-radius: 14px; padding: 16px 18px; color: #fff; display: flex; flex-direction: column; } .pbox .n { font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; opacity: .85; } .pbox .v { font-size: 30px; font-weight: 800; margin: 3px 0 0; } .pbox .nm { font-size: 13px; font-weight: 700; margin-bottom: 12px; opacity: .95; } .pbox .it { background: rgba(255,255,255,.17); border-radius: 8px; padding: 8px 12px; font-size: 15px; font-weight: 700; margin-bottom: 7px; }
.stps { display: grid; gap: 10px; grid-auto-rows: 1fr; } .sp { display: grid; grid-template-columns: 50px 1fr; gap: 14px; align-items: center; background: #fff; border: 1px solid var(--hairline-strong); border-radius: 12px; padding: 12px 16px; } .sp .no { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, var(--deep), var(--gold)); color: #fff; font-weight: 800; font-size: 20px; display: grid; place-items: center; } .sp b { display: block; color: var(--hunter); } .sp span { color: var(--dim); line-height: 1.4; }
.rep { background: var(--hunter); border-radius: 14px; padding: 18px 20px; color: #fff; position: relative; } .rep .stamp { position: absolute; top: -12px; right: 18px; background: var(--gold); color: var(--hunter); font-size: 10.5px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; padding: 5px 11px; border-radius: 999px; } .rep .rt { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--gold); margin: 8px 0 6px; } .rep .ln { height: 8px; border-radius: 4px; background: rgba(255,255,255,.22); margin: 5px 0; } .rep .bars { display: grid; gap: 6px; margin: 8px 0; } .rep .bars div { height: 12px; border-radius: 6px; }
.qb { display: flex; align-items: center; gap: 16px; background: #fff; border: 1px solid var(--hairline-strong); border-radius: 12px; padding: 12px 16px; } .qb img { width: 1.1in; height: 1.1in; border-radius: 6px; } .qb b { display: block; font-size: 17px; color: var(--hunter); } .qb span { font-size: 13px; color: var(--dim); line-height: 1.4; }
.three2 { display: grid; gap: 12px; grid-auto-rows: 1fr; } .tw { display: grid; grid-template-columns: 1fr 1.25in; gap: 16px; align-items: center; border-radius: 14px; padding: 16px 22px; color: #fff; } .tw:nth-child(1) { background: var(--green); } .tw:nth-child(2) { background: #e8561a; } .tw:nth-child(3) { background: var(--deep); } .tw .i { font-size: 11px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; opacity: .9; } .tw h3 { font-size: 28px; line-height: 1.05; margin: 4px 0 6px; } .tw p { font-size: 15px; line-height: 1.45; } .tw img { width: 1.25in; height: 1.25in; border-radius: 8px; background: #fff; }
.cardp { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-content: center; } .cardp img { width: 100%; border-radius: 8px; box-shadow: 0 10px 26px rgba(15,29,19,.3); }
.words2 { font-size: 30px; line-height: 1.15; font-weight: 300; color: var(--hunter); margin: 0 0 14px; } .words2 b { font-weight: 800; color: var(--deep); }
`;

let pn = 1;
const TOTAL = 17;
const SECTIONS = ["The model", "The idea", "The ecosystem", "Partnership", "What you license", "Start free", "The ladder", "Every page", ".LLab Collaborating Companies", "What’s next", "Your next step"];
const K = (name) => `${String(SECTIONS.indexOf(name) + 1).padStart(2, '0')} · ${name}`;
const foot = () => { pn += 1; const n = pn; const pad = (x) => String(x).padStart(2, '0'); return `<div class="ft"><span><a class="fl" href="${SITE}">The Co.LLab™</a></span><span><a class="fl" href="#p${n - 1}">‹ Back</a> &nbsp;&nbsp; <a class="fl" href="#p${n >= TOTAL ? 1 : n + 1}">${n >= TOTAL ? 'Start ›' : 'Next ›'}</a> &nbsp;&nbsp; ${pad(n)}</span></div>`; };
const pg = (kicker, title, inner, dark = false) => `<section class="g" id="p${pn + 1}" ${dark ? 'style="background:var(--hunter);color:#fff"' : ''}><div class="gi"><p class="k">${kicker}</p><h2 class="t" ${dark ? 'style="color:#fff"' : ''}>${title}</h2>${inner}</div>${foot()}</section>`;
const brand = `<div class="page-brand"><a href="${SITE}" style="display:flex;align-items:center;gap:8px;color:inherit;text-decoration:none"><img src="${logo}" alt="The Co.LLab™" /><span>The Co<span class="dot">.</span>LLab™</span></a></div>`;

const cover = `<section class="g cv" id="p1" style="padding:0"><div class="ph-photo" style="background-image:url(${ph('scaffolding')})"></div>
<div class="top"><p class="k">Leadership Infrastructure™ · A pitch</p><h1>Every company starts<br/>with a vision.<br/><b>Most lose it.</b></h1><p class="sub">The Co.LLab™ is the infrastructure that defines, builds and passes it on, licensed as IP.</p></div>
<div class="bot"><div class="logo"><img src="${logo}"/>The Co.LLab™</div><div style="text-align:right"><a href="${SITE}" style="color:inherit;text-decoration:none">Let’s Build Your Legacy<span>Through Omnidirectional Enterprise™</span></a></div></div></section>`;

const qrow = (img, p, nm, q) => `<div class="qrow"><div class="im" style="background-image:url(${ph(img)})"><div class="pp"><small>${p}</small><b>${nm}</b></div></div><div class="tx">${q}</div></div>`;
const p1 = () => pg(K('The model'), 'Can you answer these <b>four questions?</b>', `
<p class="lead">They are the four questions of The IV Phases™ of Leadership Infrastructure™. A company that can answer all four has a vision that does not depend on one person.</p>
<div class="dq grow" style="grid-auto-rows:1fr">
${qrow('lake', 'Phase I', 'Foundations', 'What should never be lost as we grow?')}
${qrow('road', 'Phase II', 'Infrastructure Planning &amp; Management', 'What depends on a person that should belong to the organization?')}
${qrow('old-faithful', 'Phase III', 'Internal Operating Systems', 'How do we make what matters part of how we operate?')}
${qrow('arch', 'Phase IV', 'Preservation', 'What must exist for what we built to continue?')}
</div>`);

const arw = (bg, a, i, b) => `<div class="a" style="background:${bg}"><div>${a}</div><div><i>${i}</i>${b}</div></div>`;
const p2 = () => pg(K('The idea'), 'Leadership, made <b>structural.</b>', `
<p class="defq">Leadership captured, documented, and embedded so it <b>outlasts the individuals who hold it.</b></p>
<div class="arw grow">
${arw('#cc2a0a', 'Define it.', 'Phase I', 'Foundations')}
${arw('#e8561a', 'Plan it.', 'Phase II', 'Infrastructure Planning &amp; Management')}
${arw('#2d6a47', 'Live it.', 'Phase III', 'Internal Operating Systems')}
${arw('#0f1d13', 'Pass it on.', 'Phase IV', 'Preservation')}
</div>
<div class="mvv"><div><b>Our mission</b>To build leadership infrastructure that empowers people and organizations to transform human potential into performance, sustainable enterprise value, and lasting legacy.</div><div><b>Our vision</b>A world where infrastructure is built around human potential, rather than people being forced to conform to infrastructure that was never designed for them.</div></div>`);

const nodes = ['Businesses', 'Nonprofits', 'Communities', 'People', 'Products &amp; Services', 'Technology', 'Capital', 'Knowledge + IP', 'Creators'];
const cx = 250, cy = 250, R = 218;
const pts = nodes.map((name, i) => { const a = (-90 + i * (360 / nodes.length)) * Math.PI / 180; return { name, x: cx + R * Math.cos(a), y: cy + R * Math.sin(a) }; });
const svg = `<svg viewBox="-50 -20 600 540" xmlns="http://www.w3.org/2000/svg">
<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#ff602e" stroke-width="1.5" stroke-dasharray="4 6" opacity=".6"/>
${pts.map((p) => `<line x1="${cx}" y1="${cy}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="#ff7a1f" stroke-width="2.2" opacity=".75"/>`).join('')}
${pts.map((p, i) => { const q = pts[(i + 1) % pts.length]; return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${q.x.toFixed(1)}" y2="${q.y.toFixed(1)}" stroke="#ff602e" stroke-width="1" opacity=".35"/>`; }).join('')}
<circle cx="${cx}" cy="${cy}" r="74" fill="#0f1d13" stroke="#ff602e" stroke-width="2"/>
<text x="${cx}" y="${cy - 10}" text-anchor="middle" fill="#fff" font-size="20" font-weight="800">The Co.LLab™</text>
<text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="#ff9a6e" font-size="15" font-weight="800">Omnidirectional</text>
<text x="${cx}" y="${cy + 26}" text-anchor="middle" fill="#ff9a6e" font-size="15" font-weight="800">Enterprise™</text>
${pts.map((p) => `<g><rect x="${(p.x - 67).toFixed(1)}" y="${(p.y - 18).toFixed(1)}" width="134" height="36" rx="20" fill="#17301d" stroke="#ff602e" stroke-width="1.5"/><text x="${p.x.toFixed(1)}" y="${(p.y + 6).toFixed(1)}" text-anchor="middle" fill="#fff" font-size="14" font-weight="800">${p.name}</text></g>`).join('')}</svg>`;
const p3 = () => pg(K('The ecosystem'), 'Not a funnel. <b>A coordinated system.</b>', `
<p class="lead">Value moves in every direction between people, ideas, products, organizations and community, with many ways in, all connected to Leadership Infrastructure™.</p>
<div class="oew grow">${svg}</div>
<div class="hero" style="margin:12px 0 0"><p class="big" style="font-size:20px">It links <b>contribution, ownership and return.</b> Built on ethics: how we treat people is part of the infrastructure.</p></div>`);

const pb = (bg, n, v, nm, items) => `<div class="pbox" style="background:${bg}"><div class="n">${n}</div><div class="v">${v}</div><div class="nm">${nm}</div>${items.map((i) => `<div class="it">${i}</div>`).join('')}</div>`;
const p4 = () => pg(K('What you license'), 'Infrastructure planning IP. <b>One for every step.</b>', `
<p class="lead">Every product is in the catalog, by phase. Licensed to keep. A license grants use, not ownership.</p>
<div class="p2 grow">
${pb('#cc2a0a', 'Phase I', 'Define it', 'Foundations', [P.phaseLines[0]])}
${pb('#e8561a', 'Phase II', 'Plan it', 'Infrastructure Planning &amp; Management', [P.phaseLines[1]])}
${pb('#2d6a47', 'Phase III', 'Live it', 'Internal Operating Systems', [P.phaseLines[2]])}
${pb('#0f1d13', 'Phase IV', 'Pass it on', 'Preservation', [P.phaseLines[3]])}
</div>
<div class="note" style="margin-top:6px;font-size:13px"><b>Creator™ line.</b> The same infrastructure for creative ventures. Creators keep ownership of their own work; The Co.LLab™ builds the infrastructure around it.</div>`);

const p5 = () => pg(K('Start free'), 'See the method <b>before you pay.</b>', `
<p class="lead">The free tools are open to everyone. A free account gives you a guided quest and your Infrastructure Snapshot™ on each.</p>
<div class="stps grow">
<div class="sp"><div class="no">1</div><div><b>Use the free tools</b><span>Open to everyone, no account needed.</span></div></div>
<div class="sp"><div class="no">2</div><div><b>Join free, work a quest</b><span>Work a guided quest on any free tool, step by step through The IV Phases™. Progress saves as you go.</span></div></div>
<div class="sp"><div class="no">3</div><div><b>Membership goes deeper</b><span>The Infrastructure Snapshot™ is free. Membership runs the full Infrastructure Analysis™ and opens the paid IP.</span></div></div>
</div>
<div class="rep" style="margin:16px 0 12px"><div class="stamp">Your report</div><div class="rt">Your Legacy Read</div><div class="ln"></div><div class="ln" style="width:80%"></div><div class="bars"><div style="background:#ff5a1f;width:82%"></div><div style="background:#ff7a1f;width:64%"></div><div style="background:#4fae7b;width:48%"></div><div style="background:#fff;width:30%"></div></div><div class="rt">What’s working · How we’d build from here, together · Beyond your own walls</div></div>
<div class="qb"><img src="${qJoin}"/><div><b>Join free</b><span>wearethellab.netlify.app<br/>Scan to open the member portal.</span></div></div>`);

const tl = (t) => `<b>${t.label}</b> · ${t.verb}: ${t.bestFor.charAt(0).toLowerCase()}${t.bestFor.slice(1)}`;
const lb = (h, pr, t) => `<div class="lr"><div class="lrb" style="width:${h}%">${pr}</div><div class="lrt">${t}</div></div>`;
const p6 = () => pg(K('The ladder'), 'From a free door to a <b>lifetime Partnership.</b>', `
<p class="lead">Every Partnership already includes the .LLab™, so the free door leads straight to the paid one.</p>
<div class="grow" style="margin-top:4px">
${lb(30, 'Free', 'Free tools · Infrastructure Snapshot™ with a free account')}
${lb(34, P.libMo, '.LLab Library Card™')}
${lb(40, P.journalYr, 'The .LLab Journal™')}
${lb(46, P.memMo, '.LLab Membership™ + Infrastructure Analysis™')}
${lb(46, P.range, 'IV Phases™ products')}
${lb(58, P.tiers[0].price, tl(P.tiers[0]))}
${lb(68, P.tiers[1].price, tl(P.tiers[1]))}
${lb(80, P.tiers[2].price, tl(P.tiers[2]))}
${lb(96, P.tiers[3].price, `<b>${P.tiers[3].label}</b> · ${P.tiers[3].verb}: ${P.tiers[3].econ.charAt(0).toLowerCase()}${P.tiers[3].econ.slice(1, -1)}`)}
</div>
<div class="note" style="margin-top:10px"><b>Partnership™ is the whole ladder in one purchase.</b> Every IV Phases™ product, plus Membership, Library Card and Journal for the term, and a partner-only product. Seats for ${P.tiers.map((t) => t.seats).join(', ')}. Internal-use license; results depend on how you apply it.</div>`);

const T = P.tiers;
const tc = (tn, pr, term, hl, items) => `<div class="tc"><div class="hd"><span class="tn2">${tn}</span><span class="pill">${term}</span></div><div class="pr">${pr}</div><div class="hl">${hl}</div><ul>${items.map((i) => `<li><span>${i}</span></li>`).join('')}</ul></div>`;
const rel = (t) => `New Co.LLab™ releases, yours to keep, for ${t}`;
const mem = (t) => `<b>.LLab Membership™, .LLab Library Card™ and The .LLab Journal™</b> for ${t}`;
const all9 = '<b>Every IV Phases™ product</b>, licensed to keep';
const p7 = () => pg(K('Partnership'), 'Four levels. <b>One legacy.</b>', `
<p class="lead" style="margin-bottom:10px">One purchase, with seats for your team. Each level includes everything in the level before it.</p>
<div class="stps grow" style="gap:10px">
${tc(T[0].label, T[0].price, T[0].term, T[0].line, [`<b>${T[0].partnerIp}</b>, partner-only, licensed to keep`, all9, '.LLab Infrastructure Roadmap™, a bonus product', mem(T[0].termShort), rel(T[0].termShort)])}
${tc(T[1].label, T[1].price, T[1].term, T[1].line, [`Everything in ${T[0].label}, plus <b>${T[1].partnerIp}</b>, partner-only, licensed to keep`, all9, mem(T[1].termShort), rel(T[1].termShort), `${T[1].seats} individual access seats`])}
</div>`);
const p7a = () => pg(K('Partnership'), 'Four levels. <b>One legacy.</b>', `
<div class="stps grow" style="gap:10px">
${tc(T[2].label, T[2].price, T[2].term, T[2].line, [`Everything in ${T[1].label}, plus <b>${T[2].partnerIp}</b>, partner-only, licensed to keep`, all9, mem(T[2].termShort), rel(T[2].termShort), `${T[2].seats} individual access seats`])}
${tc(T[3].label, T[3].price, T[3].term, T[3].line, [`Everything in ${T[2].label}, plus <b>${T[3].partnerIp}</b>, partner-only, licensed to keep`, all9, mem('life, never expiring'), rel('life'), `${T[3].seats} individual access seats`, `Recognition in your account as an ${T[3].label} Partner™`])}
</div>`);
const p7b = () => pg(K('Partnership'), 'Included in <b>every level.</b>', `
<div class="stps grow">
<div class="sp"><div class="no">1</div><div><b>Every IV Phases™ IP</b><span>Every IV Phases™ product, licensed to keep.</span></div></div>
<div class="sp"><div class="no">2</div><div><b>A partner-only framework</b><span>One for your level, found nowhere else.</span></div></div>
<div class="sp"><div class="no">3</div><div><b>.LLab Membership™, .LLab Library Card™ and The .LLab Journal™</b><span>For the term, with every new release while you are a member.</span></div></div>
</div>
<div class="note" style="margin-top:12px"><b>One-time purchase.</b> No subscription and no automatic charges. A license for internal business use. Results depend on how each business applies it.</div>
<div class="qb" style="margin-top:12px"><img src="${qPartner}"/><div><b>See Partnerships</b><span>Scan to open the Partnership page.</span></div></div>`);

const p8 = () => pg(K('.LLab Collaborating Companies'), 'Companies we <b>collaborate with.</b>', `
<p class="lead">Companies that license Co.LLab™ IP, or hold a Membership, collaborate through the Omnidirectional Enterprise™.</p>
<div class="stps grow">
<div class="sp"><div class="no">1</div><div><b>Who collaborates</b><span>Companies that license any .LLab™ product or hold a Membership. Anyone can browse.</span></div></div>
<div class="sp"><div class="no">2</div><div><b>What is shown</b><span>Only what each company writes: what it does, what it offers, and how to reach it. Companies work with each other directly.</span></div></div>
<div class="sp"><div class="no">3</div><div><b>How it stays true</b><span>The Co.LLab™ reads each company’s page, and each change to it, before it appears.</span></div></div>
</div>
<div class="qb" style="margin-top:14px"><img src="${qCollab}"/><div><b>See the companies</b><span>Scan to open .LLab Collaborating Companies.</span></div></div>`);

const tw = (i, h, p, q) => `<div class="tw"><div><div class="i">${i}</div><h3>${h}</h3><p>${p}</p></div><img src="${q}"/></div>`;
const SITEP = `${SITE}/pages`;
const vc = (nm, st, line, href, sub = '') => `<div class="vc" data-href="${href}"><div class="hd"><span class="nm">${nm}</span><span class="pill">${st}</span></div><p>${line}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
// Every page of the site, as the site describes it, in the order the revenue flows: Partnership first, then
// the .LLab products, then everything that follows. Names and descriptions are read from the pages themselves.
const decode = (t) => t.replace(/&amp;/g, '&');
const siteRow = (file) => {
  const h = fs.readFileSync(`${repo}/pages/${file}.html`, 'utf8');
  const title = decode(/<title>([^<]*)<\/title>/.exec(h)[1]);
  const name = title.split(/ [—|] /)[0].trim();
  const desc = decode(/name="description" content="([^"]*)"/.exec(h)[1]);
  return [name, /In Development/.test(title) ? 'In development' : '', desc, `${file}.html`, ''];
};
const SITE_ORDER = ['partnership', 'products', 'all-products', 'creator', 'library', 'legacy-library', 'journal', 'think', 'impact', 'technology', 'atelier', 'community', 'collaborating-companies', 'founders', 'about'];
const siteRows = SITE_ORDER.map(siteRow);
const rowsHtml = (rows) => `<div class="az grow">${rows.map(([nm, st, line, href, sub]) => `<div class="r" data-href="${SITE}/pages/${href}"><span class="nm">${nm}</span><span class="pill ${st === 'In development' ? 'dev' : st === 'Vision' ? 'vis' : ''}">${st}</span><p>${line}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`).join('')}</div>`;
const PAGE_TITLES = ['Every page, <b>in order.</b>', 'Every page, <b>continued.</b>', 'Every page, <b>and about us.</b>'];
const pagesPg = (i) => () => pg(K('Every page'), PAGE_TITLES[i], `
<p class="lead" style="margin-bottom:10px">${i === 0 ? 'The revenue flows down this list: Partnership first, then the .LLab products, then everything that grows from them. Tap any row to open the page.' : 'Each page is described here as it is on the website. Tap any row to open it.'}</p>
${rowsHtml(siteRows.slice(i * 5, i * 5 + 5))}`);
const pagesA = pagesPg(0), pagesB = pagesPg(1), pagesC = pagesPg(2);
const azRows = [["Co.LLab+™", "In development", "The e-commerce side of The Co.LLab™, where members list their website, highlight a product or service, and advertise.", "community.html", ""], ["The Intelligence Paradox Trilogy™", "Coming soon", "Three ideas. One paradox. Dropping soon. Under .LLab R.A.T.™, in The .LLab Legacy Library™ and The .LLab Journal™.", "think.html", ""], [".LLab Atelier™", "In development", "Everything a person needs to live a good life.", "atelier.html", "Home · Office · Community spaces · Fashion · Home goods · Furniture"], [".LLab AV Productions™", "In development", "All things sound and video, for the occasions that bring people together and the people who create them. Includes home office integrations.", "technology.html", ""], [".LLab Communications™", "In development", "The original technology. Tools that bring people into the same room, not just onto a screen.", "technology.html", ""], [".LLab Edu™", "In development", "Sponsored learning and mentorship for partners, and future educational courses.", "community.html", ""], ["Renewable Energy Ecosystem™", "Vision", "Power that sustains community. Renewable energy so communities can sustain their culture for generations.", "technology.html", ""]];
const pv1 = () => pg(K('What’s next'), 'What’s next, <b>A to Z.</b>', `
<p class="lead" style="margin-bottom:10px">Every venture grows from the same foundation: The IV Phases™ and the Omnidirectional Enterprise™.</p>
<div class="az grow">${azRows.map(([nm, st, line, href, sub]) => `<div class="r" data-href="${SITE}/pages/${href}"><span class="nm">${nm}</span><span class="pill ${st === 'In development' ? 'dev' : st === 'Vision' ? 'vis' : ''}">${st}</span><p>${line}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`).join('')}</div>
<div class="note" style="margin-top:10px;font-size:12.5px"><b>Not yet offered.</b> These ventures and .LLab Atelier™ Spaces are in development and are not currently offered for sale or lease. Nothing here is an offer of securities or a solicitation of investment.</div>`);
const p9 = () => pg(K('Your next step'), 'Choose your <b>point of entry.</b>', `
<p class="words2">Build the infrastructure. Strengthen the practice. <b>Create the legacy.</b></p>
<div class="three2 grow">
${tw('Starting free', 'Enter the Ecosystem', 'Join free to work a quest on any free tool. Membership gives the full analysis.', qJoin)}
${tw('Licensed to keep', 'Own Your Framework', 'License the IV Phases™ IP for the phase that matters most right now. It is yours to keep.', qProducts)}
${tw('Full partnership', 'Build the Legacy', 'Define, plan, live and preserve your legacy through the Omnidirectional Enterprise™, with seats for your team.', qPartner)}
</div>`);

const cardPage = () => `<section class="g" id="p${pn + 1}"><div class="gi"><p class="k">Let’s talk</p><h2 class="t">Ashley E. <b>Clasby</b></h2>
<p class="lead" style="margin-bottom:10px"><strong>Omnidirectional Enterprise™ Founder &amp; Strategist</strong><br/>The Co.LLab™: Building Leadership Infrastructure</p>
<div class="cardp grow"><a href="${SITE}/card/"><img src="${front}" alt="Business card, front"/></a><a href="${SITE}/card/"><img src="${back}" alt="Business card, back"/></a></div>
<div class="ct" style="margin-top:12px"><div><b>Website</b><a href="${SITE}">wearethellab.netlify.app</a></div><div><b>Email</b><a href="mailto:letsbuildleadership@gmail.com">letsbuildleadership@gmail.com</a></div></div>
<div class="qb" style="margin-top:12px"><img src="${qCard}"/><div><b>Save the digital card</b><span>Scan on your phone, then Share → Add to Home Screen.</span></div></div>
<div class="banner" style="margin-top:12px">Let’s Build Your Legacy Through Omnidirectional Enterprise™.</div></div>${foot()}</section>`;

const _x = 0;
let html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>The Co.LLab™ — The Pitch</title><style>${baseCss}${css}${css2}${CSS3}${CSS4}</style></head><body>${brand}${cover}${p1()}${p2()}${p3()}${p7()}${p7a()}${p7b()}${p4()}${p5()}${p6()}${pagesA()}${pagesB()}${pagesC()}${p8()}${pv1()}${p9()}${cardPage()}</body></html>`;

const L = { join: `${SITE}/pages/login.html`, products: `${SITE}/pages/products.html`, partner: `${SITE}/pages/partnership.html`, collab: `${SITE}/pages/collaborating-companies.html`, think: `${SITE}/pages/think.html`, card: `${SITE}/card/` };
const byQr = new Map([[qJoin, L.join], [qProducts, L.products], [qPartner, L.partner], [qCollab, L.collab], [qCard, L.card]]);
html = html.replace(/<div class="(qb|tw)"([^>]*)>(<img src="(data:[^"]+)"|<div>[\s\S]*?<img src="(data:[^"]+)")/g, (m, c, rest, tail, d1, d2) => { const u = byQr.get(d1 || d2); return u ? m.replace('<div class="' + c + '"', '<div class="' + c + '" data-href="' + u + '"') : m; });
html = html.replace(/<div class="qrow"/g, `<div class="qrow" data-href="${L.think}"`).replace(/<div class="pbox"/g, `<div class="pbox" data-href="${L.products}"`).replace(/<div class="tc"/g, `<div class="tc" data-href="${L.partner}"`).replace(/<div class="banner"/g, `<div class="banner" data-href="${SITE}"`);
const ladderTo = [L.join, L.products, L.products, L.products, L.partner, L.partner, L.partner, L.partner]; let li = 0;
html = html.replace(/<div class="lr">/g, () => `<div class="lr" data-href="${ladderTo[li++] || L.partner}">`);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }).catch(() => chromium.launch());
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
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
await bakeGlow(browser, page, { sectionSel: '.g', titleSel: 'h1 b, h2 b, .t b, .defq b, .words2 b', w: 528, h: 941 });
await page.evaluate(() => { document.querySelectorAll('[data-href]').forEach((el) => { const a = document.createElement('a'); a.href = el.dataset.href; a.style.cssText = 'display:flex;flex-direction:column;min-height:0;color:inherit;text-decoration:none'; el.parentNode.insertBefore(a, el); a.appendChild(el); el.style.flex = '1 1 auto'; }); });
await page.pdf({ outline: true, tagged: true, path: `${repo}/assets/pitch/The-CoLLab-Pitch.pdf`, printBackground: true, preferCSSPageSize: true });
const overflow = await page.evaluate(() => [...document.querySelectorAll('.g')].map((g, i) => [i + 1, (()=>{const gi=g.querySelector('.gi');return gi&&gi.scrollHeight>gi.clientHeight+2?gi.scrollHeight-gi.clientHeight:0})()]).filter((x) => x[1]));
console.log('natural heights', await page.evaluate(() => [...document.querySelectorAll('.g .gi')].map((g) => 0)), 'overflowing pages:', JSON.stringify(overflow), 'zoom', await page.evaluate(() => window.__zoom));
await browser.close();
