// Shared builder for the Phase I · Foundations IP: each doc is plain data (steps -> items)
// rendered into the same markup the existing IP use (write-in lines, ☐ lists, 1-5 score dots),
// so the fillable-PDF pass and the paid-quest parser treat them like every other IP.
import { licenseHtml } from './_license.mjs';

const LINE = '<span class="worksheet-line" style="display:inline-block; width:100%;"></span>';
const lines = (n = 1) => Array.from({ length: n }, () => `<p><strong>${LINE}</strong></p>`).join('');
const DOTS = '<span class="score-dots" data-score-dots>' + [1, 2, 3, 4, 5].map((n) => `<span class="score-dot">${n}</span>`).join('') + '</span>';

function item(it) {
  if (typeof it === 'string') return `<p><strong>${it}</strong></p>${lines(1)}`;
  if (it.note) return `<p>${it.note}</p>`;
  if (it.q) return `<p><strong>${it.q}</strong></p>${lines(it.lines || 1)}`;
  if (it.pick) return `<p><strong>${it.pick}</strong></p><p>Choose ${it.n}:</p><p>${it.options.map((o) => `☐ ${o}`).join('<br/>')}<br/>☐ Other: ${LINE}</p>`;
  if (it.fill) return it.fill.map((f) => `<p><strong>${f} ${LINE}.</strong></p>`).join('');
  if (it.scale) {
    return `<ol class="doc-list">${it.scale.map((s) => `<li>${s}${DOTS}</li>`).join('')}</ol>`;
  }
  throw new Error('unknown item');
}

export function foundationsDoc({ title, tagline, intro, steps, principle, closing }) {
  const respond = steps.some((s) => s.items.some((i) => i.scale))
    ? '<p><strong>HOW TO RESPOND</strong></p><p>For each statement, select the response that best reflects your organization <strong>today</strong>.</p><p><strong>1 — Rarely true</strong><br/><strong>2 — Sometimes true</strong><br/><strong>3 — Generally true</strong><br/><strong>4 — Consistently true</strong><br/><strong>5 — Strongly embedded</strong></p>'
    : '';
  const body = steps.map((s, i) => {
    const head = s.part ? s.part : `STEP ${i + 1} — ${s.title}`;
    return `<p><strong>${head}</strong></p>${s.intro ? `<p>${s.intro}</p>` : ''}${s.items.map(item).join('')}`;
  }).join('');
  return `
<section class="page">
${licenseHtml}
<p><strong>${title.toUpperCase()}</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p><strong>${tagline}</strong></p>
<p>${intro}</p>
${respond}
${body}
<p><strong>THE CO.LLAB PRINCIPLE</strong></p>
<p><strong>${principle}</strong></p>
<p>${closing}</p>
<p><strong>Build the infrastructure. Strengthen the organization. Create the legacy.</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p><a href="https://wearethellab.netlify.app">Explore The Co.LLab</a></p>
</section>
`;
}

export const cover = (extra) => ({
  eyebrow: 'Phase I · Foundations — .LLab™ IP',
  phase: 'I · Foundations',
  footerRight: 'The .LLab™ IV Phases Product Infrastructure',
  ...extra,
});
