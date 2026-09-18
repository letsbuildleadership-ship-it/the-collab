import { licensePageHtml } from './_license.mjs';

export const meta = {
  key: 'creator-practical-tool',
  outFile: 'creator-practical-tool.pdf',
  docTitle: 'The Body of Work Inventory™',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Practical Tool',
    title: 'The Body of Work <strong>Inventory</strong>™',
    subtitle: "Catalogue what you've actually made — the first step toward Body of Work Architecture.",
    phase: 'IV · Preservation (starts here, useful anywhere)',
    price: 'Free',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

export const contentHtml = `
${licensePageHtml}

<section class="page">
  <div class="content-header">
    <span class="page-index">01 · Why Inventory It</span>
    <h2 class="section-title">You Remember Your Best Work.<br/><strong>You Don't Have A Record Of It.</strong></h2>
    <p class="section-intro">Most creators can name their best work off the top of their head. Almost none have a complete, written record of everything they've made — which means almost none can see the actual shape of their body of work, or protect it.</p>
  </div>

  <div class="comparison-grid">
    <div class="comparison-card"><span class="comparison-label">What You Remember</span><ul><li>Your favorites, and whatever's recent</li><li>Scattered across drives, platforms, DMs</li><li>Ownership status: assumed, not checked</li></ul></div>
    <div class="comparison-card comparison-emphasis"><span class="comparison-label">What's Actually Recorded</span><ul><li>Every piece, not just the favorites</li><li>One place, one format, one record</li><li>Ownership and backups confirmed per piece</li></ul></div>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">For Each Piece, You'll Record</span>
    <p class="activity-prompt" style="margin-bottom:0;">Title or name · Date or period made · Format (what it actually is) · Where it lives today · Who it was for or has seen it · Whether you hold clear rights to it · Whether it's backed up somewhere else · Whether someone else could find and understand it without you explaining it.</p>
  </div>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">02 · Build The Inventory</span>
    <h2 class="section-title">One Row Per Piece.<br/><strong>Work Backward From Recent.</strong></h2>
    <p class="section-intro">A project, a piece, a release, a client engagement — whatever "a unit of work" means in your practice. Most creators find this easiest done in one sitting.</p>
  </div>
  <table class="doc-table">
    <tr><th style="width:6%;">#</th><th>Title / What It Is</th><th style="width:16%;">When</th><th style="width:15%;">Rights? Y/N</th><th style="width:17%;">Backed Up? Y/N</th></tr>
    <tr><td>1</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>2</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>3</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>4</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>5</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
    <tr><td>6</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
  </table>
  <p class="diagram-caption">Repeat for every piece of work worth recording — this page is reusable for as many rows as you need.</p>
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">03 · Read The Pattern</span>
    <h2 class="section-title">Once It's Started,<br/><strong>Ask Three Questions.</strong></h2>
  </div>

  <div class="activity-box">
    <span class="activity-kicker">Question 1</span>
    <p class="activity-prompt">What pattern shows up across the body of work — a theme, a method, a recurring subject?</p>
    <div class="activity-line"></div>
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Question 2</span>
    <p class="activity-prompt">What percentage of it is preserved somewhere durable, not just on one platform or one drive?</p>
    <div class="activity-line"></div>
  </div>
  <div class="activity-box">
    <span class="activity-kicker">Question 3</span>
    <p class="activity-prompt">If you stepped away for a year, what part of this body of work would be hardest for someone else to find or make sense of?</p>
    <div class="activity-line"></div>
  </div>

  <div class="callout">
    <p class="callout-label">Next Step</p>
    <p>A complete inventory is the raw material for real Preservation-phase infrastructure. When you're ready to turn it into an actual estate and succession plan, see <strong>Creative Estate Mapping™</strong> ($200).</p>
  </div>

  <p style="margin-top:18px;"><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong><br/>The Co.LLab: Building Leadership Infrastructure™<br/><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
