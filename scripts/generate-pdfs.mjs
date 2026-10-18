// Renders every content/library/*.pdf from the branded HTML templates in
// scripts/pdf-src/. Run with: node scripts/generate-pdfs.mjs [key ...]
// (pass one or more doc keys to render a subset while iterating).
// Every write-in line, blank cell, checkbox and score dot is turned into a
// fillable form field (see pdf-src/fillable.mjs) so customers can type
// straight into the PDF.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { renderCover, wrapDocument } from './pdf-src/render.mjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { MARKER_PREFIX, addFormFields, takeMarkerRects } from './pdf-src/fillable.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'content', 'library');

const ALL_DOCS = [
  'strength-map',
  'alignment-map',
  'build-plan',
  'legacy-profile',
  'operating-system',
  'legacy-map',
  'diagnostic',
  'blueprint',
  'legacy-architecture',
  'founders-organization',
  'membership-handbook',
  'library-card-welcome',
  'journal-vol-1',
  'infrastructure-roadmap',
  'creator-quick-start',
  'creator-diagnostic',
  'creator-practical-tool',
  'creator-product-preview',
  'creator-pathway-guide',
  'creator-identity-map',
  'creator-alignment-map',
  'creator-venture-build-plan',
  'creator-operating-system',
  'creative-estate-mapping',
  'creator-legacy-architecture',
  'creator-website-blueprint',
  'creator-website-glossary',
  'leadership-foundations-checklist',
  'clarity-direction-worksheet',
  'foundation-strength-snapshot',
  'one-strength-starter',
  'mission-to-action-worksheet',
  'accountability-gaps-checklist',
  'alignment-quick-check',
  '30-day-infrastructure-starter',
  'culture-practice-audit',
  'leadership-influence-worksheet',
  'operating-rhythm-checklist',
  'systems-health-snapshot',
  'legacy-starter-worksheet',
  'knowledge-transfer-checklist',
  'continuity-quick-check',
  'legacy-infrastructure-snapshot',
  'legacy-foundations-framework',
  'legacy-infrastructure-plan',
  'legacy-operating-systems-manual',
  'legacy-preservation-vault',
];

// Runs inside the rendered page. Finds every place a customer is meant to
// write or tick — write-in lines, blank underlines, empty table cells,
// checkboxes (styled boxes and ☐ glyphs) and score dots — drops an invisible
// marker link into each one (see MARKER_PREFIX in fillable.mjs), and returns
// what kind of field each marker should become.
function tagFillableBlanks(markerPrefix) {
  const targets = [];
  const mark = (el, spec) => {
    const id = String(targets.length);
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    const a = document.createElement('a');
    a.href = markerPrefix + id;
    a.style.cssText = 'position:absolute; left:0; right:0; bottom:0; height:max(100%, 2px); display:block;';
    el.appendChild(a);
    targets.push({ id, ...spec });
    return id;
  };
  const isBlank = (el) => el.textContent.replace(/ /g, ' ').trim() === '' && !el.querySelector('img, svg');

  // Write-in lines: the shared classes plus inline-styled blank underlines.
  const lines = new Set(document.querySelectorAll('.worksheet-line, .activity-line'));
  document.querySelectorAll('span, div').forEach((el) => {
    if (lines.has(el) || !isBlank(el) || el.children.length) return;
    const cs = getComputedStyle(el);
    if (cs.borderBottomStyle !== 'none' && parseFloat(cs.borderBottomWidth) > 0
      && cs.borderTopStyle === 'none' && el.getBoundingClientRect().width >= 40) lines.add(el);
  });

  // ☐ glyphs in body text: wrap each in a span so it can carry a marker.
  const glyphs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeValue.includes('☐')) glyphs.push(node);
  }
  const boxes = [...document.querySelectorAll('.checkbox')];
  glyphs.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(☐)/).forEach((part) => {
      if (part !== '☐') { if (part) frag.appendChild(document.createTextNode(part)); return; }
      const span = document.createElement('span');
      span.textContent = part;
      frag.appendChild(span);
      boxes.push(span);
    });
    node.replaceWith(frag);
  });

  lines.forEach((el) => {
    if (el.getBoundingClientRect().width > 0) mark(el, { type: 'text', line: true });
  });
  document.querySelectorAll('table td').forEach((td) => {
    if (isBlank(td)) mark(td, { type: 'text', cell: true });
  });
  boxes.forEach((el) => mark(el, { type: 'checkbox', glyph: !el.classList.contains('checkbox') }));
  document.querySelectorAll('.scale-dots, [data-score-dots]').forEach((row, group) => {
    [...row.children].forEach((dot) => {
      mark(dot, { type: 'radio', group, value: dot.textContent.trim() });
    });
  });
  return targets;
}

// Turns the marker rectangles Chrome printed into form-field specs.
function toFieldSpecs(targets, rects) {
  const fields = [];
  const groups = new Map();
  for (const t of targets) {
    const r = rects.get(t.id);
    if (!r) continue;
    if (t.type === 'text' && t.line) {
      // Lines are drawn as a bottom border; give short ones (inline blanks)
      // enough height to type into by growing upward from the line.
      const h = Math.max(r.h, 14);
      fields.push({ type: 'text', page: r.page, x: r.x, y: r.y + r.h - h, w: r.w, h, fontSize: 10 });
    } else if (t.type === 'text') {
      fields.push({ type: 'text', ...r, fontSize: 9, multiline: r.h > 30 });
    } else if (t.type === 'checkbox' && t.glyph) {
      // The glyph's inline box is taller than the drawn square; center a
      // square on it.
      const size = Math.min(r.w, r.h) * 0.85;
      fields.push({ type: 'checkbox', page: r.page, x: r.x + (r.w - size) / 2, y: r.y + (r.h - size) / 2, w: size, h: size });
    } else if (t.type === 'checkbox') {
      fields.push({ type: 'checkbox', ...r });
    } else if (t.type === 'radio') {
      if (!groups.has(t.group)) {
        const group = { type: 'radio', page: r.page, options: [] };
        groups.set(t.group, group);
        fields.push(group);
      }
      groups.get(t.group).options.push({ value: t.value, ...r });
    }
  }
  return fields;
}

async function main() {
  const requested = process.argv.slice(2);
  const keys = requested.length ? requested : ALL_DOCS;

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  });

  try {
    for (const key of keys) {
      const mod = await import(`./pdf-src/docs/${key}.mjs`);
      const { meta, contentHtml } = mod;
      const coverHtml = renderCover(meta.cover);
      const html = wrapDocument({ docTitle: meta.docTitle, coverHtml, contentHtml });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate((title) => {
        const pages = document.querySelectorAll('.page');
        pages.forEach((el, i) => {
          const footer = document.createElement('div');
          footer.className = 'auto-footer';
          footer.innerHTML = `<span>The Co.LLab™ — ${title}</span><span></span>`;
          el.appendChild(footer);
        });
      }, meta.docTitle.replace(/<[^>]+>/g, ''));
      const targets = await page.evaluate(tagFillableBlanks, MARKER_PREFIX);
      const outPath = path.join(outDir, meta.outFile);
      const flat = await page.pdf({ printBackground: true, preferCSSPageSize: true });
      await page.close();

      // Page numbers on every printed page after the cover ("Page n of N").
      const numbered = await PDFDocument.load(flat);
      const font = await numbered.embedFont(StandardFonts.Helvetica);
      const all = numbered.getPages();
      all.forEach((pg, i) => {
        if (i === 0) return;
        const label = `PAGE ${i + 1} OF ${all.length}`;
        const size = 6.4;
        pg.drawText(label, { x: pg.getWidth() - 68.4 - font.widthOfTextAtSize(label, size), y: 32, size, font, color: rgb(0.275, 0.345, 0.29) });
      });
      const stamped = await numbered.save();
      let bytes = stamped;
      let count = 0;
      if (targets.length) {
        const pdf = await PDFDocument.load(stamped);
        ({ bytes, count } = await addFormFields(pdf, toFieldSpecs(targets, takeMarkerRects(pdf))));
      }
      fs.writeFileSync(outPath, bytes);

      console.log(`✓ ${meta.outFile} (${count} fillable fields)`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
