import { licensePageHtml } from './_license.mjs';

export const meta = {
  key: 'creator-quick-start',
  outFile: 'creator-quick-start.pdf',
  docTitle: '.LLab Creator Quick Start Guide™',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Quick Start',
    title: '.LLab Creator Quick Start <strong>Guide</strong>™',
    subtitle: 'Five infrastructure moves you can make this week, whatever you\'re creating.',
    phase: 'All Four Phases',
    price: 'Free',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

export const contentHtml = `
${licensePageHtml}

<section class="page">
  <div class="content-header">
    <span class="page-index">01 · The Four Moves</span>
    <h2 class="section-title">You don't need a business plan.<br/><strong>You need five moves.</strong></h2>
    <p class="section-intro">One small, concrete move for each phase of Creator Infrastructure™ — plus a fifth that ties them together. Do them in order, or start wherever your creative practice needs it most.</p>
  </div>

  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">1</span><span class="pathway-label">Foundations</span><p>Idea → Identity</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">2</span><span class="pathway-label">Infra. Planning</span><p>Identity → Venture</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">3</span><span class="pathway-label">Operating Systems</span><p>Venture → Enterprise</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">4</span><span class="pathway-label">Preservation</span><p>Enterprise → Legacy</p></div>
  </div>
  <p class="diagram-caption">The same four-phase movement underneath every .LLab™ infrastructure line.</p>

  <div class="activity-box">
    <span class="activity-kicker">Move 1 · Foundations</span>
    <p class="activity-prompt">Name what you're actually making — not your medium, your body of work. In one sentence, what's the thread that connects everything you've made so far?</p>
    <div class="activity-line"></div>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">Move 2 · Infrastructure Planning</span>
    <p class="activity-prompt">Write down who it's for. Not "everyone" — who is the specific person your work already reaches, or should?</p>
    <div class="activity-line"></div>
  </div>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">02 · Build The System</span>
    <h2 class="section-title">Pick one system.<br/><strong>Start the record.</strong></h2>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">Move 3 · Internal Operating Systems</span>
    <p class="activity-prompt">Choose one thing you currently do from scratch every time — posting, pricing, onboarding a client, shipping a piece — and write the three steps you'd need to make it repeatable.</p>
    <div class="activity-line"></div>
    <div class="activity-line"></div>
    <div class="activity-line"></div>
  </div>

  <p class="quote">"Infrastructure isn't the plan — it's the part that still runs when you're not thinking about it."</p>

  <div class="activity-box">
    <span class="activity-kicker">Move 4 · Preservation</span>
    <p class="activity-prompt">Start your Body of Work Record. List the last five things you made — the first row of your Body of Work Inventory™ (see the free Practical Tool for the full version).</p>
    <table class="doc-table">
      <tr><th style="width:8%;">#</th><th>What I Made</th><th style="width:28%;">When</th></tr>
      <tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>3</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>4</td><td>&nbsp;</td><td>&nbsp;</td></tr>
      <tr><td>5</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    </table>
  </div>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">03 · Choose Your Next Move</span>
    <h2 class="section-title">Which phase is <strong>thinnest</strong> right now?</h2>
    <p class="section-intro">Not necessarily where you feel most behind — where the infrastructure is actually missing. That's where to spend your next dollar and hour.</p>
  </div>

  <ul class="checklist">
    <li><span class="checkbox"></span> Foundations — identity isn't named or written down anywhere</li>
    <li><span class="checkbox"></span> Infrastructure Planning — the offer or audience isn't clear yet</li>
    <li><span class="checkbox"></span> Internal Operating Systems — everything is rebuilt from scratch each time</li>
    <li><span class="checkbox"></span> Preservation — nothing is recorded, archived, or set up to outlast you</li>
  </ul>

  <div class="activity-box">
    <span class="activity-kicker">Move 5 · Synthesis</span>
    <p class="activity-prompt">My thinnest phase right now is:</p>
    <div class="activity-line"></div>
  </div>

  <div class="callout">
    <p class="callout-label">What's Next</p>
    <p>Take the free <strong>.LLab Creator Infrastructure Diagnostic™</strong> for a fuller picture across all four phases, or go straight to the product that matches your thinnest phase in the Creator Infrastructure™ product ladder.</p>
  </div>

  <p style="margin-top:24px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
