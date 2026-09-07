import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseCss = fs.readFileSync(path.join(__dirname, 'base.css'), 'utf8');

export function renderCover({ eyebrow, title, subtitle, phase, price, footerRight }) {
  return `
  <section class="cover">
    <div class="cover-inner">
      <div class="cover-brand"><span>CO<span class="dot">.</span>LLAB</span><span style="font-weight:400; opacity:0.6;">™</span></div>
      <p class="cover-eyebrow">${eyebrow}</p>
      <h1 class="cover-title">${title}</h1>
      <p class="cover-subtitle">${subtitle}</p>
      <div class="cover-meta">
        ${phase ? `<div>Phase<strong>${phase}</strong></div>` : ''}
        ${price ? `<div>Investment<strong>${price}</strong></div>` : ''}
      </div>
      <div class="cover-footer">
        <span>The Co.LLab: Building Leadership Infrastructure™</span>
        <span>${footerRight || ''}</span>
      </div>
    </div>
  </section>`;
}

export function wrapDocument({ docTitle, coverHtml, contentHtml }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${docTitle}</title>
<style>${baseCss}</style>
</head>
<body>
${coverHtml}
${contentHtml}
</body>
</html>`;
}
