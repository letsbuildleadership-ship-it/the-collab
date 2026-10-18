// Renders the free "Website Glossary" infographic (words and definitions only)
// to content/library/creator-website-glossary.pdf. Run: node scripts/build-glossary-infographic.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { GLOSSARY_GROUPS, GLOSSARY_COUNT } from './pdf-src/docs/_website-glossary.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = `data:image/png;base64,${fs.readFileSync(path.join(root, 'assets', 'img', 'logo-mark.png')).toString('base64')}`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const groups = GLOSSARY_GROUPS.map((g, i) => `
<section class="grp">
  <h2><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(g.name)}</h2>
  <div class="grid">${g.terms.map(([t, d]) => `<div class="card"><span class="tag">${esc(t)}</span><p>${esc(d)}</p></div>`).join('')}</div>
</section>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@page { margin: 0; }
*{box-sizing:border-box}
body{margin:0;width:11in;background:#0f1d13;color:#fff;font-family:'Inter',system-ui,-apple-system,'Segoe UI',Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.wrap{padding:.7in .65in .5in}
.top{display:flex;align-items:center;gap:14px}
.top img{height:44px}.top b{font-size:15px;letter-spacing:.02em}.top small{display:block;font-size:10px;letter-spacing:.08em;color:#ffd9c4;font-weight:700}
.eyebrow{margin:.5in 0 0;color:#ff4a3a;font-weight:800;font-size:12px;letter-spacing:.2em;text-transform:uppercase}
h1{margin:12px 0 0;font-size:84px;line-height:.95;font-weight:800;letter-spacing:-.02em;text-transform:uppercase}
h1 span{color:#ff4a3a;text-shadow:0 0 30px rgba(255,46,18,.7)}
.sub{margin:16px 0 0;max-width:6.4in;font-size:19px;font-weight:600;line-height:1.4}
.free{display:inline-block;margin-top:18px;padding:6px 14px;border:1.5px solid #ff6a2e;border-radius:999px;background:rgba(255,46,18,.18);box-shadow:0 0 16px rgba(255,96,46,.6);font-weight:800;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
.grp{margin-top:.38in}
.grp h2{margin:0 0 10px;font-size:17px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;display:flex;align-items:center;gap:12px;border-bottom:2px solid #ff4a3a;padding-bottom:8px;box-shadow:0 8px 14px -12px rgba(255,46,18,.9)}
.grp h2 .n{background:linear-gradient(90deg,#ff2e12,#ff6a2e);color:#000;padding:3px 9px;border-radius:6px;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.card{break-inside:avoid;background:rgba(255,255,255,.06);border:1px solid rgba(255,106,46,.28);border-left:4px solid #ff4a3a;padding:10px 12px}
.tag{display:inline-block;padding:3px 9px;border-radius:6px;background:linear-gradient(90deg,#ff2e12,#ff6a2e);color:#000;font-weight:800;font-size:12.5px;box-shadow:0 0 14px rgba(255,96,46,.7)}
.card p{margin:7px 0 0;font-size:12.5px;line-height:1.4;color:#ffd9c4;font-weight:500}
.foot{margin-top:.4in;padding-top:14px;border-top:1px solid rgba(255,106,46,.35);display:flex;justify-content:space-between;gap:30px;font-size:11px;line-height:1.5;color:#ffd9c4}
.foot a{color:#fff;font-weight:700}
.cta{margin-top:.3in;padding:16px 20px;border:1.5px solid #ff6a2e;border-radius:10px;background:rgba(255,46,18,.14);box-shadow:0 0 20px rgba(255,96,46,.5);font-size:14px;font-weight:600}
.cta a{color:#fff;font-weight:800}
</style></head><body><div class="wrap">
<div class="top"><img src="${logo}" alt=""><span><b>The Co.LLab™</b><small>Building Leadership Infrastructure™</small></span></div>
<p class="eyebrow">.LLab Creator Infrastructure™ · Free resource</p>
<h1>The website <span>glossary.</span></h1>
<p class="sub">${GLOSSARY_COUNT} words, in plain English. The terms behind a luxury-style, ad-style website, in six groups.</p>
<span class="free">Free · no account needed</span>
${groups}
<div class="cta">Want the manual that puts these words to work? <a href="https://wearethellab.netlify.app/pages/creator.html#products">Creator Website Blueprint™</a> shows how to build and run a site with Composio, GitHub, Netlify, Claude and ChatGPT, with an iPhone edition and a computer edition.</div>
<div class="foot"><span>© 2026 The Co.LLab™ Building Leadership Infrastructure™. All rights reserved. Free for your personal reference. Terms: <a href="https://wearethellab.netlify.app/pages/ip-license.html">The Co.LLab IP™ license</a>.</span><span>wearethellab.netlify.app</span></div>
</div></body></html>`;

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1056, height: 1400 } });
await page.setContent(html, { waitUntil: 'load' });
const heightPx = await page.evaluate(() => document.documentElement.scrollHeight);
const out = path.join(root, 'content', 'library', 'creator-website-glossary.pdf');
await page.pdf({ path: out, width: '11in', height: `${Math.ceil(heightPx / 96) + 0.2}in`, printBackground: true, pageRanges: '1' });
await browser.close();
console.log('✓ creator-website-glossary.pdf', (heightPx / 96).toFixed(1) + 'in tall');
