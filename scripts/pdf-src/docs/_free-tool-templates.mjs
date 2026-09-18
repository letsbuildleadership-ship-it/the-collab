// Shared 3-page content templates for the 16 free Leadership Infrastructure™
// lead-magnet PDFs (content/library/free-tools/*.pdf). Each free tool is one
// of four archetypes — checklist, worksheet, snapshot, starter — that share
// the same page structure (context + diagram → the exercise itself →
// interpretation + next step) so every free resource reads as one
// deliberately designed system instead of 16 one-off documents. Leaf doc
// files in this folder just supply their own text into these functions.
import { licensePageHtml } from './_license.mjs';

const brandFooter = `<p style="margin-top:22px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/products.html">Explore The .LLab™ IV Phases Product Infrastructure</a></p>`;

function upsellCallout({ name, price, copy }) {
  return `<div class="callout"><p class="callout-label">Ready To Go Further?</p><p><strong>${name}</strong> (${price}) ${copy}</p></div>`;
}

function header(pageIndex, title, intro) {
  return `<div class="content-header"><span class="page-index">${pageIndex}</span><h2 class="section-title">${title}</h2>${intro ? `<p class="section-intro">${intro}</p>` : ''}</div>`;
}

/** Checklist archetype: 8 yes/no items, scored by count. */
export function renderChecklistDoc({ headline, intro, contrast, items, bands, commitPrompt, upsell }) {
  return `
${licensePageHtml}
<section class="page">
  ${header('01 · Why This Matters', headline, intro)}
  <div class="comparison-grid">
    <div class="comparison-card"><span class="comparison-label">${contrast[0].label}</span><ul>${contrast[0].items.map((i) => `<li>${i}</li>`).join('')}</ul></div>
    <div class="comparison-card comparison-emphasis"><span class="comparison-label">${contrast[1].label}</span><ul>${contrast[1].items.map((i) => `<li>${i}</li>`).join('')}</ul></div>
  </div>
  <p class="diagram-caption">This checklist is a fast way to tell which side you're actually on.</p>
</section>

<section class="page">
  ${header('02 · The Checklist', 'Check What\'s True Right Now.')}
  <ul class="checklist">
    ${items.map((i) => `<li><span class="checkbox"></span> ${i}</li>`).join('')}
  </ul>
  <div class="activity-box">
    <span class="activity-kicker">Score It</span>
    <p class="activity-prompt">Count your checks: <span class="activity-line" style="display:inline-block; width:1.2in; height:auto; border-bottom:1px dotted var(--hairline-strong);"></span> out of ${items.length}</p>
  </div>
</section>

<section class="page">
  ${header('03 · What It Means', 'Read Your Score.')}
  <div class="comparison-grid" style="grid-template-columns: 1fr 1fr 1fr;">
    ${bands.map((b) => `<div class="comparison-card"><span class="comparison-label">${b.label}</span><p style="font-size:10px; line-height:1.5; margin:0;">${b.copy}</p></div>`).join('')}
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Commit To One</span>
    <p class="activity-prompt">${commitPrompt}</p>
    <div class="activity-line"></div>
  </div>
  ${upsellCallout(upsell)}
  ${brandFooter}
</section>`;
}

/** Worksheet archetype: 4 open-ended prompts, split 2 + 2 across pages. */
export function renderWorksheetDoc({ headline, intro, frameworkLabel, frameworkSteps, prompts, synthesisPrompt, upsell }) {
  const activity = (p) => `<div class="activity-box"><span class="activity-kicker">${p.kicker}</span><p class="activity-prompt">${p.prompt}</p><div class="activity-line"></div></div>`;
  return `
${licensePageHtml}
<section class="page">
  ${header('01 · Name Your Direction', headline, intro)}
  <div class="pathway">
    ${frameworkSteps.map((s, i) => `<div class="pathway-step"><span class="pathway-num">${i + 1}</span><span class="pathway-label">${s.label}</span><p>${s.body}</p></div>${i < frameworkSteps.length - 1 ? '<span class="pathway-arrow">→</span>' : ''}`).join('')}
  </div>
  <p class="diagram-caption">${frameworkLabel}</p>
  ${activity(prompts[0])}
  ${activity(prompts[1])}
</section>

<section class="page">
  ${header('02 · Keep Going', 'Write In Plain Language.')}
  ${activity(prompts[2])}
  ${activity(prompts[3])}
  <p class="quote">"No paragraph should take longer than a minute to write — if it does, you're overthinking, not clarifying."</p>
</section>

<section class="page">
  ${header('03 · Bring It Together', 'One Statement, In Your Own Words.')}
  <div class="activity-box">
    <span class="activity-kicker">Synthesis</span>
    <p class="activity-prompt">${synthesisPrompt}</p>
    <div class="activity-line"></div>
    <div class="activity-line"></div>
  </div>
  ${upsellCallout(upsell)}
  ${brandFooter}
</section>`;
}

/** Snapshot archetype: four 1-5 self-scored dimensions. */
export function renderSnapshotDoc({ headline, intro, dimensions, bands, reflectPrompt, upsell }) {
  return `
${licensePageHtml}
<section class="page">
  ${header('01 · Four Dimensions', headline, intro)}
  <div class="matrix-2x2">
    ${dimensions.map((d, i) => `<div class="matrix-cell${i % 2 === 1 ? ' matrix-highlight' : ''}"><span class="matrix-label">${d.label}</span><p>${d.body}</p></div>`).join('')}
  </div>
  <p class="diagram-caption">Score each honestly as it functions today — not as it's designed to function.</p>
</section>

<section class="page">
  ${header('02 · Score Yourself', 'Circle One Number Per Dimension.')}
  <div class="scale-grid">
    ${dimensions.map((d) => `<div class="scale-row"><span class="scale-label">${d.label}</span><div class="scale-dots">${[1, 2, 3, 4, 5].map((n) => `<span class="scale-dot">${n}</span>`).join('')}</div><div class="scale-caption"><span>Not True</span><span>Fully True</span></div></div>`).join('')}
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Total It Up</span>
    <p class="activity-prompt">Add your four scores: <span style="display:inline-block; width:1in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span> out of 20</p>
  </div>
</section>

<section class="page">
  ${header('03 · Read The Result', 'What Your Score Means.')}
  <div class="comparison-grid" style="grid-template-columns: 1fr 1fr 1fr;">
    ${bands.map((b) => `<div class="comparison-card"><span class="comparison-label">${b.label}</span><p style="font-size:10px; line-height:1.5; margin:0;">${b.copy}</p></div>`).join('')}
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Reflect</span>
    <p class="activity-prompt">${reflectPrompt}</p>
    <div class="activity-line"></div>
  </div>
  ${upsellCallout(upsell)}
  ${brandFooter}
</section>`;
}

/** Starter archetype: 3-4 numbered steps building one small system. */
export function renderStarterDoc({ headline, intro, steps, closingPrompt, upsell }) {
  const half = Math.ceil(steps.length / 2);
  const page2Steps = steps.slice(0, half);
  const page3Steps = steps.slice(half);
  const stepBox = (s, i) => `<div class="activity-box"><span class="activity-kicker">Step ${i + 1} · ${s.label}</span><p class="activity-prompt">${s.body}</p><div class="activity-line"></div></div>`;
  return `
${licensePageHtml}
<section class="page">
  ${header('01 · Start With One', headline, intro)}
  <div class="pathway">
    ${steps.map((s, i) => `<div class="pathway-step"><span class="pathway-num">${i + 1}</span><span class="pathway-label">${s.label}</span><p>${s.short}</p></div>${i < steps.length - 1 ? '<span class="pathway-arrow">→</span>' : ''}`).join('')}
  </div>
  <p class="diagram-caption">Resist the urge to do all of it at once — one system, built completely, beats four started.</p>
</section>

<section class="page">
  ${header('02 · Build It', 'One Step At A Time.')}
  ${page2Steps.map(stepBox).join('')}
</section>

<section class="page">
  ${header('03 · Finish The Set', 'One Step At A Time.')}
  ${page3Steps.map((s, i) => stepBox(s, i + half)).join('')}
  <div class="activity-box">
    <span class="activity-kicker">Commit</span>
    <p class="activity-prompt">${closingPrompt}</p>
    <div class="activity-line"></div>
  </div>
  ${upsellCallout(upsell)}
  ${brandFooter}
</section>`;
}
