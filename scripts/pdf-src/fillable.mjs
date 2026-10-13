// Turns a flat PDF into a fillable one: lays real AcroForm fields (text
// boxes, checkboxes, radio groups) over the write-in lines, blank cells and
// tick boxes that are already drawn on the page, so customers can click a
// line and type instead of printing the document.
//
// Field geometry is in PDF points with a top-left origin (the way pdfplumber
// measures, and how markerFields() reports it), and is flipped to PDF's
// bottom-left origin here.
import {
  PDFDocument, PDFName, PDFString, PDFHexString, PDFArray, PDFDict,
  StandardFonts, rgb, drawEllipse,
} from 'pdf-lib';

const INK = rgb(0.086, 0.141, 0.102); // --ink #16241a
const ORANGE = rgb(0.8, 0.165, 0.039); // --orange-deep #cc2a0a

// Chrome prints every <a href> as a Link annotation whose rectangle is the
// anchor's box in the *printed* layout, which is the only reliable way to
// learn where an element landed after page fragmentation. generate-pdfs.mjs
// drops an invisible anchor with this URL prefix into every blank; this file
// reads those rectangles back and removes the anchors.
export const MARKER_PREFIX = 'https://fillable.invalid/';

/**
 * Finds the marker links Chrome printed, removes them from the pages, and
 * returns their rectangles keyed by marker id (top-left origin, points).
 * @param {PDFDocument} pdf
 * @returns {Map<string, { page: number, x: number, y: number, w: number, h: number }>}
 */
export function takeMarkerRects(pdf) {
  const rects = new Map();
  pdf.getPages().forEach((page, pageIndex) => {
    const annots = page.node.Annots();
    if (!annots) return;
    const pageHeight = page.getHeight();
    for (let i = annots.size() - 1; i >= 0; i -= 1) {
      const annot = annots.lookup(i, PDFDict);
      const action = annot.lookupMaybe(PDFName.of('A'), PDFDict);
      const uri = action?.lookupMaybe(PDFName.of('URI'), PDFString, PDFHexString)?.decodeText();
      if (!uri?.startsWith(MARKER_PREFIX)) continue;
      annots.remove(i);
      const id = uri.slice(MARKER_PREFIX.length);
      if (rects.has(id)) continue; // element split across pages: keep its first piece
      const [x1, y1, x2, y2] = annot.lookup(PDFName.of('Rect'), PDFArray).asArray().map((n) => n.asNumber());
      rects.set(id, {
        page: pageIndex,
        x: Math.min(x1, x2),
        y: pageHeight - Math.max(y1, y2),
        w: Math.abs(x2 - x1),
        h: Math.abs(y2 - y1),
      });
    }
  });
  return rects;
}

// Fields keep the printed design (lines, dots, boxes) visible: no background,
// no border, only the typed text / tick / ring is drawn.
function stripChrome(field) {
  for (const widget of field.acroField.getWidgets()) {
    const mk = widget.dict.lookupMaybe(PDFName.of('MK'), PDFDict);
    mk?.delete(PDFName.of('BG'));
    mk?.delete(PDFName.of('BC'));
    widget.getOrCreateBorderStyle().setWidth(0);
  }
}

// Selected score dot: an orange ring around the printed number, so the
// number stays readable. Unselected: nothing drawn.
const ringAppearance = (field, widget) => {
  const { width, height } = widget.getRectangle();
  const r = Math.min(width, height) / 2;
  const ring = drawEllipse({
    x: width / 2, y: height / 2, xScale: r - 0.6, yScale: r - 0.6,
    borderColor: ORANGE, borderWidth: 1.1,
  });
  return { normal: { on: ring, off: [] }, down: { on: ring, off: [] } };
};

/**
 * @param {Uint8Array | PDFDocument} input
 * @param {Array<{
 *   type: 'text' | 'checkbox' | 'radio',
 *   page: number, x: number, y: number, w: number, h: number,
 *   multiline?: boolean, fontSize?: number,
 *   options?: Array<{ value: string, page: number, x: number, y: number, w: number, h: number }>,
 * }>} fields
 * @returns {Promise<{ bytes: Uint8Array, count: number }>}
 */
export async function addFormFields(input, fields) {
  const pdf = input instanceof PDFDocument ? input : await PDFDocument.load(input);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();
  const counters = {};
  const nextName = (prefix, pageIndex) => {
    const key = `${prefix}.p${pageIndex + 1}`;
    counters[key] = (counters[key] || 0) + 1;
    return `${key}.${counters[key]}`;
  };
  const box = (r) => ({
    x: r.x, y: pages[r.page].getHeight() - r.y - r.h, width: r.w, height: r.h,
    borderWidth: 0, textColor: INK,
  });

  let count = 0;
  for (const f of fields) {
    if (f.type === 'text') {
      const field = form.createTextField(nextName('text', f.page));
      if (f.multiline) field.enableMultiline();
      field.addToPage(pages[f.page], { ...box(f), font });
      field.setFontSize(f.fontSize ?? 10);
      stripChrome(field);
    } else if (f.type === 'checkbox') {
      const field = form.createCheckBox(nextName('check', f.page));
      field.addToPage(pages[f.page], box(f));
      stripChrome(field);
      field.updateAppearances();
    } else if (f.type === 'radio') {
      const field = form.createRadioGroup(nextName('score', f.page));
      for (const opt of f.options) field.addOptionToPage(opt.value, pages[opt.page], box(opt));
      stripChrome(field);
      field.updateAppearances(ringAppearance);
    } else {
      continue;
    }
    count += 1;
  }

  form.updateFieldAppearances(font);

  return { bytes: await pdf.save(), count };
}

/** True when the PDF already carries form fields (keeps reruns idempotent). */
export async function hasFormFields(pdfBytes) {
  const pdf = await PDFDocument.load(pdfBytes);
  return pdf.getForm().getFields().length > 0;
}
