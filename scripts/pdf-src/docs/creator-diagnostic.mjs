import { licensePageHtml } from './_license.mjs';

export const meta = {
  key: 'creator-diagnostic',
  outFile: 'creator-diagnostic.pdf',
  docTitle: '.LLab Creator Infrastructure Diagnostic™ (Free Edition)',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Diagnostic',
    title: '.LLab Creator Infrastructure <strong>Diagnostic</strong>™',
    subtitle: 'A short self-assessment across all four phases — free edition.',
    phase: 'All Four Phases',
    price: 'Free',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const diagItem = (text) => `
<div style="display:flex; align-items:center; justify-content:space-between; gap:14px; margin-bottom:9px; padding-bottom:9px; border-bottom:1px solid var(--hairline);">
  <p style="font-size:9.8px; margin:0; color:var(--ink); flex:1;">${text}</p>
  <div style="display:flex; gap:5px; flex:0 0 auto;">${[0, 1, 2, 3].map((n) => `<span style="width:16px;height:16px;border-radius:50%;border:1.2px solid var(--hairline-strong); display:flex; align-items:center; justify-content:center; font-size:7.5px; color:var(--ink-dim);">${n}</span>`).join('')}</div>
</div>`;

const phasePanel = (numeral, title, arc, items) => `
<div class="activity-box">
  <span class="activity-kicker">Phase ${numeral} · ${title} — ${arc}</span>
  ${items.map(diagItem).join('')}
  <p style="font-size:9px; margin:8px 0 0; color:var(--ink-dim);"><strong>Phase ${numeral} subtotal:</strong> <span style="display:inline-block; width:0.8in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span> / ${items.length * 3}</p>
</div>`;

export const contentHtml = `
${licensePageHtml}

<section class="page">
  <div class="content-header">
    <span class="page-index">01 · Score Phases I &amp; II</span>
    <h2 class="section-title">A Directional Score.<br/><strong>Not A Test You Can Fail.</strong></h2>
    <p class="section-intro">Score each statement 0 (not true yet) to 3 (fully true). This free edition gives you a directional read across all four phases of Creator Infrastructure™ — score honestly.</p>
  </div>
  ${phasePanel('I', 'Foundations', 'Idea → Identity', [
    'I can describe what I make in one clear sentence, without hedging.',
    'I know who my work is actually for.',
    'I could explain my creative identity to a stranger in under a minute.',
  ])}
  ${phasePanel('II', 'Infrastructure Planning & Management', 'Identity → Venture', [
    'I have a defined offer — something specific a person can buy or commission.',
    'I know roughly what it costs me (time, materials, effort) to deliver that offer.',
    'I have a plan, not just a hope, for how people find my work.',
  ])}
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">02 · Score Phases III &amp; IV</span>
    <h2 class="section-title">Keep Scoring.<br/><strong>Honestly.</strong></h2>
  </div>
  ${phasePanel('III', 'Internal Operating Systems', 'Venture → Enterprise', [
    'At least one part of my practice runs on a repeatable process, not improvisation.',
    'I could hand off one task in my practice to someone else with written instructions.',
    "I track what's working and what isn't, in some form.",
  ])}
  ${phasePanel('IV', 'Preservation', 'Enterprise → Legacy', [
    "I have a record of the work I've made — titles, dates, where it lives.",
    'I know who would need to know what, if I stepped away for six months.',
    'I have thought, even briefly, about what happens to this body of work long-term.',
  ])}
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">03 · Your Results</span>
    <h2 class="section-title">Whichever Phase Scored Lowest<br/><strong>Is Where To Start.</strong></h2>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">Total It Up</span>
    <p class="activity-prompt">Total score: <span style="display:inline-block; width:1in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span> / 36</p>
  </div>

  <table class="doc-table">
    <tr><th>If This Phase Scored Lowest</th><th>Match It To</th></tr>
    <tr><td>Foundations</td><td><strong>Creator Identity Map™</strong> — $20</td></tr>
    <tr><td>Infrastructure Planning &amp; Management</td><td><strong>Creator Alignment Map™</strong> ($50) or <strong>Creator Venture Build Plan™</strong> ($100)</td></tr>
    <tr><td>Internal Operating Systems</td><td><strong>The Creator Operating System™</strong> — $300</td></tr>
    <tr><td>Preservation</td><td><strong>Creative Estate Mapping™</strong> ($200) or <strong>Creator Legacy Infrastructure Architecture™</strong> ($750)</td></tr>
  </table>

  <div class="callout">
    <p class="callout-label">Already Strong Across All Four?</p>
    <p>If you want it all unlocked at once, <strong>.LLab Membership™</strong> includes the full Creator Infrastructure™ ladder — plus everything else in The .LLab™ ecosystem.</p>
  </div>

  <p style="margin-top:18px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
