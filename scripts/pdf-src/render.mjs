import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { licensePageHtml } from './docs/_license.mjs';
import { backmatterHtml } from './docs/_backmatter.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseCss = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');
// The same logo mark the website header uses (assets/img/logo-mark.png).
const logoSrc = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'img', 'logo-mark.png')).toString('base64')}`;

export function renderCover({ eyebrow, title, subtitle, phase, price, footerRight }) {
  return `
  <section class="cover">
    <div class="cover-inner">
      <div class="cover-brand"><img src="${logoSrc}" alt="The Co.LLab™" class="cover-logo" /><span class="cover-brand-text"><span class="cover-brand-name">The Co<span class="dot">.</span>LLab™</span><span class="cover-brand-tagline">Building Leadership Infrastructure™</span></span></div>
      <p class="cover-eyebrow">${eyebrow}</p>
      <h1 class="cover-title">${title}</h1>
      <p class="cover-subtitle">${subtitle}</p>
      <div class="cover-meta">
        ${phase ? `<div>Phase<strong>${phase}</strong></div>` : ''}
        ${price ? `<div>List Price<strong>${/^\$/.test(price) ? `${price} USD` : price}</strong></div>` : ''}
      </div>
      <div class="cover-footer">
        <span>The Co.LLab: Building Leadership Infrastructure™<br/>Let’s build your legacy through Omnidirectional Enterprise™</span>
        <span>${footerRight || ''}</span>
      </div>
    </div>
  </section>`;
}

// Every product carries The Co.LLab IP™ license and the website logo on
// every page. Products that don't include the license themselves get the
// standard license page right after the cover.
const brandHtml = () => `<div class="page-brand"><img src="${logoSrc}" alt="The Co.LLab™" /><span>The Co<span class="dot">.</span>LLab™</span></div>`;

export function wrapDocument({ docTitle, coverHtml, contentHtml }) {
  if (!/intellectual property license/i.test(contentHtml)) contentHtml = `${licensePageHtml}\n${contentHtml}`;
  contentHtml = `${contentHtml}\n${backmatterHtml(docTitle)}`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${docTitle}</title>
<style>${baseCss}</style>
</head>
<body>
${brandHtml()}
${coverHtml}
${contentHtml}
</body>
</html>`;
}
