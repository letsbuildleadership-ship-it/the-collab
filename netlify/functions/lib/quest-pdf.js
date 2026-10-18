// Renders a finished quest as the member's own PDF report. Built on demand
// from the saved answers + outcome, so the portal always has the full report.
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const INK = rgb(0.086, 0.141, 0.102);
const ORANGE = rgb(0.8, 0.165, 0.039);
const MUTED = rgb(0.32, 0.36, 0.33);
const W = 612;
const H = 792;
const M = 54;

async function buildQuestPdf({ quest, record, result }) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ok = new Set(font.getCharacterSet());
  const safe = (s) => String(s || '').replace(/→/g, '->').replace(/[\r\n\t]+/g, ' ').split('').map((c) => (ok.has(c.codePointAt(0)) ? c : '?')).join('');

  let page;
  let y;
  const newPage = () => {
    page = pdf.addPage([W, H]);
    page.drawRectangle({ x: 0, y: H - 46, width: W, height: 46, color: INK });
    page.drawText(safe('The Co.LLab™  ·  Building Leadership Infrastructure™'), { x: M, y: H - 29, size: 9.5, font: bold, color: rgb(1, 1, 1) });
    y = H - 46 - 34;
  };
  newPage();

  const wrap = (text, f, size, width) => {
    const out = [];
    let line = '';
    for (const word of safe(text).split(' ')) {
      const test = line ? `${line} ${word}` : word;
      if (f.widthOfTextAtSize(test, size) > width && line) { out.push(line); line = word; } else line = test;
    }
    if (line) out.push(line);
    return out;
  };
  const need = (h) => { if (y - h < M + 30) newPage(); };
  const para = (text, { f = font, size = 10.5, color = INK, indent = 0, gap = 6 } = {}) => {
    for (const line of wrap(text, f, size, W - 2 * M - indent)) {
      need(size + 4);
      page.drawText(line, { x: M + indent, y, size, font: f, color });
      y -= size + 4;
    }
    y -= gap;
  };
  const heading = (text) => {
    need(40);
    y -= 8;
    page.drawRectangle({ x: M, y: y - 3, width: 22, height: 2.5, color: ORANGE });
    y -= 18;
    para(text.toUpperCase(), { f: bold, size: 10, color: ORANGE, gap: 4 });
  };

  para(quest.phase || 'The IV Phases', { f: bold, size: 9.5, color: ORANGE, gap: 14 });
  para(`${quest.title} — Your Completed Quest`, { f: bold, size: 20, gap: 8 });
  const who = record.name || record.email;
  const when = new Date(result.completedAt).toISOString().slice(0, 10);
  para(`Completed by ${who} on ${when}`, { size: 10, color: MUTED, gap: 12 });

  heading('Your result');
  if (result.outcome.score !== null && result.outcome.max) {
    para(`${result.outcome.score} of ${result.outcome.max}${result.outcome.bandLabel ? `  (${result.outcome.bandLabel})` : ''}`, { f: bold, size: 16, gap: 4 });
  }
  para(result.outcome.summary);

  if (result.outcome.legacyRead) {
    heading('Your Legacy Read');
    para(result.outcome.legacyRead);
    for (const ph of result.outcome.phaseMap || []) {
      para(`${ph.name}: ${ph.total ? `${ph.answered} of ${ph.total} answered, ` : ''}${ph.strengths} strong, ${ph.gaps} to build, ${ph.mentions} mention${ph.mentions === 1 ? '' : 's'} in your words`, { size: 9.5, color: MUTED, gap: 2 });
    }
    y -= 6;
  }

  heading('Your answers');
  let lastSection = null;
  for (const node of quest.nodes) {
    const a = result.answers[node.id];
    if (a === undefined) continue;
    if (node.section && node.section !== lastSection) { lastSection = node.section; para(node.section, { f: bold, size: 10.5, color: ORANGE, gap: 3 }); }
    const shown = typeof a === 'boolean' ? (a ? 'Yes' : 'Not yet') : Array.isArray(a) ? (a.length ? a.join(', ') : 'None yet') : String(a);
    para(node.label ? `${node.label}: ${node.prompt}` : node.prompt, { f: bold, size: 10, gap: 1 });
    para(shown, { indent: 12, gap: result.notes && result.notes[node.id] ? 2 : 6 });
    if (result.notes && result.notes[node.id]) para(`Your note: ${result.notes[node.id]}`, { indent: 12, size: 9.5, color: MUTED, gap: 6 });
  }
  if (result.answers[quest.closing.id]) {
    para(quest.closing.prompt, { f: bold, size: 10, gap: 1 });
    para(result.answers[quest.closing.id], { indent: 12, gap: 6 });
  }

  heading(quest.archetype === 'worksheet' || quest.archetype === 'starter' ? 'Where you are strongest' : "What's working");
  for (const s of result.outcome.strengths) {
    para(s.label, { f: bold, size: 10, gap: 1 });
    if (s.evidence) para(s.evidence, { indent: 12, size: 9.5, color: ORANGE, gap: 1 });
    para(s.text, { indent: 12, gap: 6 });
  }

  heading("How we'd build from here, together");
  for (const s of result.outcome.improvements) {
    para(s.label, { f: bold, size: 10, gap: 1 });
    if (s.evidence) para(s.evidence, { indent: 12, size: 9.5, color: ORANGE, gap: 1 });
    para(s.text, { indent: 12, gap: 6 });
  }

  if (result.outcome.nextMove) {
    heading('A next move');
    para(result.outcome.nextMove);
  }

  need(40);
  y -= 6;
  para('Build the infrastructure. Strengthen the practice. Create the legacy.', { f: bold, size: 9.5, color: MUTED, gap: 2 });
  para('© The Co.LLab™ Building Leadership Infrastructure™. For your personal or organizational use under The Co.LLab IP™ License.', { size: 8.5, color: MUTED });

  return Buffer.from(await pdf.save());
}

module.exports = { buildQuestPdf };
