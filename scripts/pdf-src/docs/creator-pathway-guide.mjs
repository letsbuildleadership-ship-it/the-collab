import { licensePageHtml } from './_license.mjs';

export const meta = {
  key: 'creator-pathway-guide',
  outFile: 'creator-pathway-guide.pdf',
  docTitle: '.LLab Creator Infrastructure Pathway Guide™',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Pathway Guide',
    title: '.LLab Creator Infrastructure <strong>Pathway Guide</strong>™',
    subtitle: 'The full map — Foundations to Preservation — and which product fits where you are right now.',
    phase: 'All Four Phases',
    price: 'Free',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const phaseCard = (numeral, title, arc, body, free, paid) => `
<div class="activity-box">
  <span class="activity-kicker">Phase ${numeral} · ${title} — ${arc}</span>
  <p class="activity-prompt">${body}</p>
  ${free ? `<p style="font-size:9.5px; margin:0 0 4px; color:var(--ink-dim);"><strong>Free:</strong> ${free}</p>` : ''}
  <p style="font-size:9.5px; margin:0;"><strong>Paid:</strong> ${paid}</p>
</div>`;

export const contentHtml = `
${licensePageHtml}

<section class="page">
  <div class="content-header">
    <span class="page-index">01 · The Journey</span>
    <h2 class="section-title">The Whole Map,<br/><strong>In One Place.</strong></h2>
    <p class="section-intro">How Creator Infrastructure™ is organized, and exactly which product to reach for at each stage.</p>
  </div>
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">1</span><span class="pathway-label">Create</span><p>Creation → Venture</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">2</span><span class="pathway-label">Build</span><p>Venture → Enterprise</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">3</span><span class="pathway-label">Operate</span><p>Enterprise runs itself</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">4</span><span class="pathway-label">Preserve</span><p>Enterprise → Legacy</p></div>
  </div>
  ${phaseCard('I', 'Foundations', 'Idea → Identity', 'Understanding what you\'re actually creating and who you are as its architect, before touching a business model.', '.LLab Creator Quick Start Guide™, .LLab Creator Infrastructure Diagnostic™', '<strong>Creator Identity Map™</strong> — $20')}
  ${phaseCard('II', 'Infrastructure Planning & Management', 'Identity → Venture', 'Determining what systems a creative identity needs to become a venture, and how the pieces connect.', null, '<strong>Creator Alignment Map™</strong> — $50 &nbsp;|&nbsp; <strong>Creator Venture Build Plan™</strong> — $100')}
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">02 · Operate &amp; Preserve</span>
    <h2 class="section-title">The Second Half<br/><strong>Of The Map.</strong></h2>
  </div>
  ${phaseCard('III', 'Internal Operating Systems', 'Venture → Enterprise', 'The repeatable systems, offers, and operations that let the venture run and grow without every decision depending on you.', 'The Creator Operating System™ — Preview (Module 1)', '<strong>The Creator Operating System™</strong> — $300')}
  ${phaseCard('IV', 'Preservation', 'Enterprise → Legacy', 'What gets documented, transferred, and sustained so the work outlives any one project — or its creator.', 'The Body of Work Inventory™', '<strong>Creative Estate Mapping™</strong> — $200 &nbsp;|&nbsp; <strong>Creator Legacy Infrastructure Architecture™</strong> — $750')}

  <div class="matrix-2x2" style="min-height:0;">
    <div class="matrix-cell" style="padding:12px 14px;"><span class="matrix-label">Crown</span><p>Authority, identity</p></div>
    <div class="matrix-cell matrix-highlight" style="padding:12px 14px;"><span class="matrix-label">Scepter</span><p>Structure</p></div>
    <div class="matrix-cell matrix-highlight" style="padding:12px 14px;"><span class="matrix-label">Signet</span><p>Proven capability</p></div>
    <div class="matrix-cell" style="padding:12px 14px;"><span class="matrix-label">Heirloom</span><p>Legacy</p></div>
  </div>
  <p class="diagram-caption">TRIARCH™ — the same keystone behind .LLab Membership™ and Legacy Library™, applied here to creative infrastructure.</p>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">03 · Where To Go Next</span>
    <h2 class="section-title">Not Sure<br/><strong>Where To Start?</strong></h2>
  </div>

  <div class="callout">
    <p class="callout-label">Take The Diagnostic</p>
    <p>Take the free <strong>.LLab Creator Infrastructure Diagnostic™</strong> — it scores you across all four phases and points to the exact product to start with.</p>
  </div>

  <div class="callout">
    <p class="callout-label">When To Go To Membership</p>
    <p>If you find yourself wanting more than one product on this ladder, <strong>.LLab Membership™</strong> unlocks the entire Creator Infrastructure™ catalog — plus the full Leadership Infrastructure™ catalog, the Legacy Library™, and the community — for one ongoing price.</p>
  </div>

  <p style="margin-top:18px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
