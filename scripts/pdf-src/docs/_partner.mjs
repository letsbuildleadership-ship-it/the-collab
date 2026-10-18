// Shared building blocks for the Omnidirectional Enterprise™ Partnership IP
// (The Legacy Foundations Framework™, The Legacy Infrastructure Plan™,
// The Legacy Operating Systems Manual™, The Legacy Preservation Vault™).
// Every blank line, empty cell, and checkbox becomes a fillable field in
// scripts/generate-pdfs.mjs.

export const lines = (n) => Array.from({ length: n }, () => '<div class="worksheet-line"></div>').join('');

export const field = (label, n = 2) => `
<div class="worksheet-field">
  <p class="field-label">${label}</p>
  ${lines(n)}
</div>`;

export const header = (index, title, strong, intro) => `
<div class="content-header">
  <span class="page-index">${index}</span>
  <h2 class="section-title">${title}<br/><strong>${strong}</strong></h2>
  ${intro ? `<p class="section-intro">${intro}</p>` : ''}
</div>`;

export const box = (kicker, prompt, n = 3) => `
<div class="activity-box">
  <span class="activity-kicker">${kicker}</span>
  <p class="activity-prompt">${prompt}</p>
  ${lines(n)}
</div>`;

export const callout = (label, text) => `
<div class="callout">
  <p class="callout-label">${label}</p>
  <p>${text}</p>
</div>`;

// A table with a header row, fixed first-column labels, and blank cells to fill.
export const grid = (headers, rowLabels, blankRows = 0) => {
  const cols = headers.length;
  const blank = (label) => `<tr><td>${label}</td>${'<td></td>'.repeat(cols - 1)}</tr>`;
  return `
<table class="doc-table">
  <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
  ${rowLabels.map(blank).join('')}
  ${Array.from({ length: blankRows }, () => `<tr>${'<td></td>'.repeat(cols)}</tr>`).join('')}
</table>`;
};

export const checklist = (items) => `
<div style="margin:10px 0 14px;">
  ${items.map((t) => `<p style="margin:0 0 7px; font-size:10.5px;">☐ ${t}</p>`).join('')}
</div>`;

export const signatures = (roles) => `
<div style="display:grid; grid-template-columns:1fr 1fr; gap:22px 0.4in; margin-top:18px;">
  ${roles
    .map(
      (r) => `<div><div class="worksheet-line"></div><p style="font-size:9px; letter-spacing:0.12em; text-transform:uppercase; color:var(--ink-dim); margin:4px 0 0;">${r} · Signature &amp; Date</p></div>`
    )
    .join('')}
</div>`;

export const close = (product) => `
<p style="margin-top:18px;"><strong>Define it. Plan it. Live it. Preserve it.</strong><br/>${product} · The Omnidirectional Enterprise™ Partnership<br/>The Co.LLab: Building Leadership Infrastructure™<br/>Let’s Build Your Legacy Through Omnidirectional Enterprise™.</p>`;

export const partnerCover = (phase, title, subtitle, price) => ({
  eyebrow: `Phase ${phase} — Omnidirectional Enterprise™ Partnership IP`,
  title,
  subtitle,
  phase,
  price,
  footerRight: 'The Co.LLab IP™ · Partner Edition',
});
