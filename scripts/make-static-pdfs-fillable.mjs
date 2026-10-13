// Adds fillable form fields to the library PDFs that have no HTML source in
// scripts/pdf-src (the Blueprint™ series), by detecting their drawn write-in
// lines (scripts/detect-write-lines.py, needs `pip install pdfplumber`).
// PDFs that already have fields are skipped, so this is safe to rerun.
// Run with: node scripts/make-static-pdfs-fillable.mjs [file.pdf ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { addFormFields, hasFormFields } from './pdf-src/fillable.mjs';

// PDFs with no write-in lines of their own get a closing Notes page drawn
// in the Blueprint™ style (cream page, grey lines), so every library PDF
// has somewhere to type.
async function appendNotesPage(bytes) {
  const pdf = await PDFDocument.load(bytes);
  const { width, height } = pdf.getPage(0).getSize();
  const page = pdf.addPage([width, height]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(0.949, 0.9255, 0.8667) });
  page.drawText('YOUR NOTES', { x: 58, y: height - 80, size: 8, font: bold, color: rgb(0.91, 0.27, 0.12) });
  page.drawText('Reflections As You Begin', { x: 58, y: height - 108, size: 20, font: bold, color: rgb(0.04, 0.04, 0.035) });
  page.drawRectangle({ x: 58, y: height - 120, width: 496, height: 1.5, color: rgb(0.04, 0.04, 0.035) });
  page.drawText('What do you want your leadership infrastructure to make possible?', {
    x: 58, y: height - 145, size: 10, font: regular, color: rgb(0.27, 0.27, 0.25),
  });
  const fields = [];
  for (let y = 185; y <= 690; y += 26) {
    page.drawRectangle({ x: 58, y: height - y, width: 496, height: 0.8, color: rgb(0.5412, 0.5412, 0.4706) });
    fields.push({ type: 'text', page: pdf.getPageCount() - 1, x: 58, y: y - 16, w: 496, h: 16, fontSize: 10 });
  }
  return addFormFields(pdf, fields);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(__dirname, '..', 'content', 'library');

const STATIC_PDFS = [
  'blueprint-welcome.pdf',
  'blueprint-phase1.pdf',
  'blueprint-phase2.pdf',
  'blueprint-phase3.pdf',
  'blueprint-phase4.pdf',
  'blueprint-complete.pdf',
];

const files = process.argv.slice(2).length ? process.argv.slice(2) : STATIC_PDFS;
for (const file of files) {
  const pdfPath = path.join(libDir, file);
  const bytes = fs.readFileSync(pdfPath);
  if (await hasFormFields(bytes)) {
    console.log(`- ${file} already fillable, skipped`);
    continue;
  }
  const fields = JSON.parse(execFileSync('python3', [path.join(__dirname, 'detect-write-lines.py'), pdfPath], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }));
  const { bytes: out, count } = fields.length
    ? await addFormFields(bytes, fields)
    : await appendNotesPage(bytes);
  fs.writeFileSync(pdfPath, out);
  console.log(`✓ ${file} (${count} fillable fields)`);
}
