// Brings the designed (non-template) PDFs — The Blueprint™ issues — in line
// with every other Co.LLab IP™ product: the website logo in the corner of
// every page, "Page n of N" numbering, and the shared glossary and
// appendices (fillable revision record) at the back. Sources are the
// untouched originals in scripts/pdf-src/static/, so this is safe to re-run.
//   node scripts/align-static-pdfs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { backmatterHtml } from './pdf-src/docs/_backmatter.mjs';
import { MARKER_PREFIX, addFormFields, takeMarkerRects } from './pdf-src/fillable.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'scripts/pdf-src/static');
const outDir = path.join(root, 'content/library');
const css = fs.readFileSync(path.join(root, 'scripts/pdf-src/base.css'), 'utf8');
const logoPng = fs.readFileSync(path.join(root, 'assets/img/logo-mark.png'));
const pricing = JSON.parse(fs.readFileSync(path.join(root, 'content/pricing.json'), 'utf8'));
const titleFor = (file) => (pricing.blueprint_series.find((b) => b.pdf_file === file) || {}).name || file;

const browser = await chromium.launch();
try {
  for (const file of fs.readdirSync(srcDir).filter((f) => f.endsWith('.pdf'))) {
    // Back matter, rendered with invisible markers in every blank table cell.
    const page = await browser.newPage();
    await page.setContent(`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${backmatterHtml(titleFor(file))}</body></html>`);
    await page.evaluate((prefix) => {
      document.querySelectorAll('td').forEach((td, i) => {
        if (td.textContent.trim()) return;
        td.style.position = 'relative';
        const a = document.createElement('a');
        a.href = prefix + i;
        a.style.cssText = 'position:absolute;inset:0;display:block;';
        td.appendChild(a);
      });
    }, MARKER_PREFIX);
    const back = await PDFDocument.load(await page.pdf({ printBackground: true, preferCSSPageSize: true }));
    await page.close();
    const rects = [...takeMarkerRects(back).values()];

    const pdf = await PDFDocument.load(fs.readFileSync(path.join(srcDir, file)));
    const offset = pdf.getPageCount();
    for (const p of await pdf.copyPages(back, back.getPageIndices())) pdf.addPage(p);

    const logo = await pdf.embedPng(logoPng);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    pages.forEach((pg, i) => {
      if (i === 0) return;
      const { width, height } = pg.getSize();
      const h = 14;
      const w = (logo.width / logo.height) * h;
      pg.drawImage(logo, { x: width - 22 - w, y: height - 18 - h, width: w, height: h });
      const label = `PAGE ${i + 1} OF ${pages.length}`;
      pg.drawText(label, { x: width - 22 - font.widthOfTextAtSize(label, 6.4), y: 12, size: 6.4, font, color: rgb(0.55, 0.55, 0.55) });
    });

    const specs = rects.map((r) => ({ type: 'text', page: r.page + offset, x: r.x + 2, y: r.y + 2, w: r.w - 4, h: r.h - 4, fontSize: 9 }));
    const { bytes } = await addFormFields(pdf, specs);
    fs.writeFileSync(path.join(outDir, file), bytes);
    console.log(`✓ ${file} (${pages.length} pages, +${specs.length} fields)`);
  }
} finally {
  await browser.close();
}
