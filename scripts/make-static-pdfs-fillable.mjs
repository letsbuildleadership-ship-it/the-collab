// Adds fillable form fields to the library PDFs that have no HTML source in
// scripts/pdf-src (the Blueprint™ series), by detecting their drawn write-in
// lines (scripts/detect-write-lines.py, needs `pip install pdfplumber`).
// PDFs that already have fields are skipped, so this is safe to rerun.
// Run with: node scripts/make-static-pdfs-fillable.mjs [file.pdf ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { addFormFields, hasFormFields } from './pdf-src/fillable.mjs';

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
  if (!fields.length) {
    console.log(`- ${file} has no write-in lines, left as is`);
    continue;
  }
  const { bytes: out, count } = await addFormFields(bytes, fields);
  fs.writeFileSync(pdfPath, out);
  console.log(`✓ ${file} (${count} fillable fields)`);
}
