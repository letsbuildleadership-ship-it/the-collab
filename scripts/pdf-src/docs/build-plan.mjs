export const meta = {
  key: 'build-plan',
  outFile: 'build-plan.pdf',
  docTitle: 'Leadership Infrastructure Build Plan™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — a .LLab™ Workbook',
    title: 'Leadership Infrastructure <strong>Build Plan</strong>™',
    subtitle: 'Turn one strength or opportunity into a practical 30-day infrastructure build — with a week-by-week rhythm, not a wish list.',
    phase: 'II · Infrastructure Planning & Management',
    price: '$100',
    footerRight: 'The .LLab™ IV Phases Product Infrastructure',
  },
};

export const contentHtml = `
<section class="page">
  <p class="kicker">Before you begin</p>
  <h1 class="doc-h1">One build. <strong>Thirty days.</strong> Start to finish.</h1>
  <p class="lead">Most infrastructure efforts fail from scope, not effort. Someone gets ambitious, tries to fix five things at once, and three months later nothing has actually shipped. This workbook does the opposite: it takes one thing — a strength you've already identified, or a gap you already know matters — and builds a disciplined, four-week path to making it real.</p>

  <div class="callout">
    <div class="callout-label">Before you start</div>
    <p>If you've already completed the <strong>Leadership Infrastructure Strength Map™</strong> or the <strong>Leadership Alignment Map™</strong>, bring that finding here. This workbook assumes you already know <em>what</em> you're building — its job is the <em>how</em>, on a real calendar.</p>
  </div>

  <h2 class="doc-h2">The one rule</h2>
  <p>Pick one build. Not the whole department's operating model — one decision rule, one meeting rhythm, one onboarding step, one accountability loop. Small enough to finish in 30 days, real enough that people notice when it's gone.</p>

  <h2 class="doc-h2">How to use this workbook</h2>
  <p>Fill in the Week 1 worksheet before you do anything else — it forces clarity about what "done" actually looks like. Then use the weekly pages as a running log across the month. This is meant to live on your desk, not in a folder you forget about.</p>
</section>

<section class="page">
  <p class="kicker">The framework</p>
  <h1 class="doc-h1">The <strong>4-Week Build Rhythm.</strong></h1>

  <div class="step-row">
    <span class="step-number">1</span>
    <div class="step-body">
      <h3 class="doc-h3">Week 1 — Define</h3>
      <p>Name exactly what you're building, why it matters, who it affects, and what "done" looks like in one sentence. Most builds fail here — not from lack of effort, but from never actually deciding what finished means.</p>
    </div>
  </div>
  <div class="step-row">
    <span class="step-number">2</span>
    <div class="step-body">
      <h3 class="doc-h3">Week 2 — Design</h3>
      <p>Sketch the actual mechanism: the checklist, the meeting agenda, the decision rule, the onboarding step. Keep it simple enough that someone unfamiliar with your reasoning could follow it without you in the room.</p>
    </div>
  </div>
  <div class="step-row">
    <span class="step-number">3</span>
    <div class="step-body">
      <h3 class="doc-h3">Week 3 — Build</h3>
      <p>Put it into practice, in public, with the people it affects. Not a pilot with a hand-picked group — the real conditions, so you find the real friction now instead of after you've called it finished.</p>
    </div>
  </div>
  <div class="step-row">
    <span class="step-number">4</span>
    <div class="step-body">
      <h3 class="doc-h3">Week 4 — Reinforce</h3>
      <p>Fix what broke in Week 3, then teach it on purpose — write it down, brief the team, build it into onboarding. A build that isn't taught decays back into a habit that depends on you remembering to enforce it.</p>
    </div>
  </div>

  <div class="quote">Infrastructure that takes a year to plan and never ships helps no one. Infrastructure that ships in a month and gets reinforced compounds.</div>
</section>

<section class="page">
  <p class="kicker">Worksheet — Week 1</p>
  <h1 class="doc-h1">Define the <strong>build.</strong></h1>

  <div class="worksheet-field">
    <div class="field-label">What am I building? (one sentence)</div>
    <div class="worksheet-line"></div>
  </div>
  <div class="worksheet-field">
    <div class="field-label">Why does it matter — what breaks if I don't build it?</div>
    <div class="worksheet-line"></div>
    <div class="worksheet-line"></div>
  </div>
  <div class="worksheet-field">
    <div class="field-label">Who is affected, and who needs to know it's coming?</div>
    <div class="worksheet-line"></div>
  </div>
  <div class="worksheet-field">
    <div class="field-label">What does "done" look like, specifically, on day 30?</div>
    <div class="worksheet-line"></div>
    <div class="worksheet-line"></div>
  </div>

  <h2 class="doc-h2">Weekly tracker</h2>
  <table class="doc-table">
    <tr><th>Week</th><th>Focus</th><th>What actually happened</th></tr>
    <tr><td>1 — Define</td><td>Scope, purpose, definition of done</td><td></td></tr>
    <tr><td>2 — Design</td><td>The mechanism itself</td><td></td></tr>
    <tr><td>3 — Build</td><td>Real-world use, real friction</td><td></td></tr>
    <tr><td>4 — Reinforce</td><td>Fix, document, teach</td><td></td></tr>
  </table>
</section>

<section class="page">
  <p class="kicker">Closing</p>
  <h1 class="doc-h1">What happens <strong>after</strong> day 30.</h1>
  <p class="lead">A finished build is a beginning, not a trophy. Two things determine whether it survives past this month.</p>

  <ul class="doc-list">
    <li><strong>Someone other than you has to be able to run it.</strong> If the build only works because you personally remember to do it, it isn't infrastructure yet — go back through Week 4 and finish the teaching step.</li>
    <li><strong>Put a review date on the calendar now.</strong> Thirty, sixty, ninety days out — infrastructure that never gets revisited quietly erodes the same way the original problem did.</li>
  </ul>

  <div class="callout">
    <div class="callout-label">Where this fits</div>
    <p>The Build Plan is Phase II — Infrastructure Planning & Management: it turns a known strength or gap into a shipped, working piece of infrastructure. Once several of these are running, Phase III is where they become a real system — the <strong>.LLab Leadership Operating System™</strong> connects your individual builds into one coherent operating model.</p>
  </div>
</section>
`;
