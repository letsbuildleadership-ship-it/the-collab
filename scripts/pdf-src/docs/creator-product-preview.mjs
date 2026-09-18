import { licensePageHtml } from './_license.mjs';

export const meta = {
  key: 'creator-product-preview',
  outFile: 'creator-product-preview.pdf',
  docTitle: 'The Creator Operating System™ — Preview',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Product Preview',
    title: 'The Creator Operating System<strong>™</strong> — Preview',
    subtitle: 'Module 1 of the full product, so you can see exactly what it builds.',
    phase: 'III · Internal Operating Systems',
    price: 'Free preview · Full product $300',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const sysCell = (label, body) => `<div class="matrix-cell"><span class="matrix-label">${label}</span><p>${body}</p></div>`;

export const contentHtml = `
${licensePageHtml}

<section class="page">
  <div class="content-header">
    <span class="page-index">01 · Six Systems, One Preview</span>
    <h2 class="section-title">Six Repeatable Systems.<br/><strong>This Preview Is Module 1, In Full.</strong></h2>
    <p class="section-intro">The complete Creator Operating System™ builds six repeatable systems for running a creative venture without every decision depending on you.</p>
  </div>
  <div class="matrix-2x2" style="grid-template-columns: repeat(3,1fr); grid-template-rows: repeat(2,1fr); min-height:1.9in;">
    ${sysCell('1 · Weekly Rhythm', 'The fixed shape your week takes, whatever is on fire.')}
    ${sysCell('2 · Offer System', 'How you price and package what you sell.')}
    ${sysCell('3 · Audience System', 'A repeatable path from stranger to buyer.')}
    ${sysCell('4 · Delivery System', 'How work actually gets delivered, without scrambling.')}
    ${sysCell('5 · Decision System', 'How you decide under uncertainty.')}
    ${sysCell('6 · Review System', 'A simple monthly check that keeps it all honest.')}
  </div>
  <p class="diagram-caption">This free preview covers System 1 — the Weekly Operating Rhythm — start to finish.</p>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">02 · Module 1</span>
    <h2 class="section-title">The Weekly<br/><strong>Operating Rhythm.</strong></h2>
    <p class="section-intro">Most creative ventures run on adrenaline and deadlines instead of rhythm. This is the infrastructure that keeps creating, selling, and preserving happening every week — without deciding from scratch each time.</p>
  </div>
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">1</span><span class="pathway-label">Make</span><p>Producing the actual work</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">2</span><span class="pathway-label">Reach</span><p>Getting it in front of people</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">3</span><span class="pathway-label">Run</span><p>Admin, finances, follow-up</p></div>
  </div>
  <p class="diagram-caption">Most creators default almost entirely to Make, or get pulled entirely into Run.</p>

  <div class="activity-box">
    <span class="activity-kicker">Step 1 · Name Your Three Weekly Modes</span>
    <p class="activity-prompt">This week, how many hours actually went to each?</p>
    <p style="font-size:11px; margin:0;">Make: <span style="display:inline-block; width:0.9in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span> &nbsp; Reach: <span style="display:inline-block; width:0.9in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span> &nbsp; Run: <span style="display:inline-block; width:0.9in; border-bottom:1px dotted var(--hairline-strong);">&nbsp;</span></p>
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Step 2 · Block The Rhythm, Not Just The Tasks</span>
    <p class="activity-prompt">Assign each day (or half-day) a mode instead of scheduling individual tasks. Example: Mon/Tue = Make, Wed = Reach, Thu = Make, Fri = Run. Write your own:</p>
    <div class="activity-line"></div>
  </div>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">03 · Protect It</span>
    <h2 class="section-title">One Block,<br/><strong>Protected No Matter What.</strong></h2>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">Step 3 · Protect One Non-Negotiable Block</span>
    <p class="activity-prompt">Pick the mode most likely to get cancelled when things get busy — usually Reach, sometimes Run. Name the specific block you will protect no matter what.</p>
    <div class="activity-line"></div>
  </div>

  <div class="callout">
    <p class="callout-label">What The Full Product Adds</p>
    <p>The complete Creator Operating System™ takes this same treatment through five more systems — pricing and packaging offers, building a repeatable path from stranger to buyer, delivering work without last-minute scrambling, deciding under uncertainty, and a simple monthly review that keeps all of it honest.</p>
  </div>

  <p style="margin-top:18px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Get the full Creator Operating System™</a></p>
</section>
`;
