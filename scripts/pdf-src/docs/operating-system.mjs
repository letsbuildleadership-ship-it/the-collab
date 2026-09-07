export const meta = {
  key: 'operating-system',
  outFile: 'operating-system.pdf',
  docTitle: '.LLab Leadership Operating System™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — a .LLab™ Framework',
    title: '.LLab Leadership <strong>Operating System</strong>™',
    subtitle: 'Translate leadership principles into repeatable organizational practices — five subsystems, one operating model.',
    phase: 'III · Internal Operating Systems',
    price: '$750',
    footerRight: 'The .LLab™ IV Phases Product Infrastructure',
  },
};

export const contentHtml = `
<section class="page">
  <p class="kicker">Introduction</p>
  <h1 class="doc-h1">Principles don't run organizations. <strong>Systems do.</strong></h1>
  <p class="lead">Almost every organization can recite its principles: be direct, move fast, put the customer first, disagree and commit. Almost none of them can point to the specific mechanism that makes those principles true on a Tuesday afternoon under deadline pressure. That gap — between what an organization believes and what it actually does — is where this framework lives.</p>

  <p>A Leadership Operating System is the set of repeatable practices that make principles real without requiring a specific person to enforce them by force of personality. It's the difference between "we value transparency" and a specific weekly rhythm that makes withholding information structurally difficult.</p>

  <div class="callout">
    <div class="callout-label">The core idea</div>
    <p>Leadership Infrastructure™ becomes durable when it's built into five interlocking subsystems — Decision-Making, Communication, Accountability, Culture, and Development — rather than left to depend on the judgment and memory of whoever happens to be leading at the time.</p>
  </div>

  <h2 class="doc-h2">Who this is for</h2>
  <p>This framework assumes you've already done foundational work — you know your strengths (Strength Map), you've mapped your alignment gaps (Alignment Map), and ideally you've shipped at least one 30-day build (Build Plan). The Operating System is where those individual efforts stop being isolated wins and start becoming one coherent way the organization runs.</p>

  <h2 class="doc-h2">How this document is organized</h2>
  <p>Each of the five subsystems gets its own page: what it governs, the questions that reveal whether it's real or aspirational, and a short design worksheet. Work through them in any order — most organizations find their weakest subsystem within the first two pages.</p>
</section>

<section class="page">
  <p class="kicker">Subsystem 01</p>
  <h1 class="doc-h1">The <strong>Decision-Making</strong> System.</h1>
  <p class="lead">Governs who decides what, how fast, and with what information — the single biggest driver of organizational speed and trust.</p>

  <h2 class="doc-h2">What good looks like</h2>
  <ul class="doc-list">
    <li>Decision rights are named, not assumed — people know what they can decide alone versus what needs sign-off.</li>
    <li>Reversible decisions move fast; irreversible ones get proportionally more scrutiny.</li>
    <li>Decisions get documented well enough that someone absent from the room can understand the reasoning later.</li>
  </ul>

  <h2 class="doc-h2">Diagnostic questions</h2>
  <table class="doc-table">
    <tr><th>Question</th><th>What it reveals</th></tr>
    <tr><td>Can a mid-level lead name three decisions they're allowed to make without approval?</td><td>Whether decision rights are actually distributed</td></tr>
    <tr><td>How long does a routine decision typically take, from question to answer?</td><td>Whether the system is built for speed or consensus-by-default</td></tr>
    <tr><td>Is there a written record of why the last major decision was made?</td><td>Whether reasoning survives past the meeting it happened in</td></tr>
  </table>

  <div class="worksheet-field">
    <div class="field-label">One decision that currently bottlenecks on a single person — who, and why?</div>
    <div class="worksheet-line"></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Subsystem 02</p>
  <h1 class="doc-h1">The <strong>Communication</strong> System.</h1>
  <p class="lead">Governs how information reaches the people who need it — before it becomes a surprise, a rumor, or a fire.</p>

  <h2 class="doc-h2">What good looks like</h2>
  <ul class="doc-list">
    <li>There's a predictable rhythm for how strategic information moves down and how frontline information moves up.</li>
    <li>Bad news travels at least as fast as good news — often the clearest sign of a healthy system.</li>
    <li>People don't need to be in a specific room, or friends with a specific person, to stay informed.</li>
  </ul>

  <h2 class="doc-h2">Diagnostic questions</h2>
  <table class="doc-table">
    <tr><th>Question</th><th>What it reveals</th></tr>
    <tr><td>How did the last piece of bad news travel — quickly and directly, or slowly and sideways?</td><td>Psychological safety around honest information</td></tr>
    <tr><td>Is there a standing rhythm (weekly, monthly) for strategic updates, or does it happen ad hoc?</td><td>Whether communication is designed or improvised</td></tr>
  </table>

  <div class="worksheet-field">
    <div class="field-label">Where does information currently get stuck, and between whom?</div>
    <div class="worksheet-line"></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Subsystem 03</p>
  <h1 class="doc-h1">The <strong>Accountability</strong> System.</h1>
  <p class="lead">Governs what happens after a commitment is made — the difference between goals that get tracked and goals that get remembered only in retrospect.</p>

  <h2 class="doc-h2">What good looks like</h2>
  <ul class="doc-list">
    <li>Commitments are specific enough to be checkable — not "improve retention" but a number, an owner, a date.</li>
    <li>There's a recurring moment where commitments actually get reviewed, not just made.</li>
    <li>Missed commitments produce a conversation, not silence — and not punishment severe enough that people stop making honest commitments at all.</li>
  </ul>

  <table class="doc-table">
    <tr><th>Question</th><th>What it reveals</th></tr>
    <tr><td>Can you name what was committed to in the last planning cycle, without checking notes?</td><td>Whether commitments are memorable and specific</td></tr>
    <tr><td>What happened the last time someone missed a commitment?</td><td>Whether accountability is honest or either absent or punitive</td></tr>
  </table>

  <div class="worksheet-field">
    <div class="field-label">Where does accountability currently rely on you personally remembering to follow up?</div>
    <div class="worksheet-line"></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Subsystem 04</p>
  <h1 class="doc-h1">The <strong>Culture</strong> System.</h1>
  <p class="lead">Governs what people do when no one senior is watching — the truest test of whether stated values are real.</p>

  <h2 class="doc-h2">What good looks like</h2>
  <ul class="doc-list">
    <li>New hires learn the real norms within weeks, through deliberate onboarding — not by trial and error over months.</li>
    <li>There are visible rituals (how meetings run, how disagreement is voiced, how wins get recognized) that reinforce the stated values in ordinary moments, not just crises.</li>
    <li>Culture survives a change in leadership, because it's built into practice rather than personality.</li>
  </ul>

  <table class="doc-table">
    <tr><th>Question</th><th>What it reveals</th></tr>
    <tr><td>What's one thing a new hire learns in month two that surprises them?</td><td>The gap between stated and lived culture</td></tr>
    <tr><td>Would this culture survive if you left for a year?</td><td>Whether culture is infrastructure or personality</td></tr>
  </table>

  <div class="worksheet-field">
    <div class="field-label">Which stated value is least visible in a normal Tuesday?</div>
    <div class="worksheet-line"></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Subsystem 05</p>
  <h1 class="doc-h1">The <strong>Development</strong> System.</h1>
  <p class="lead">Governs how the organization grows its own next generation of leaders — the subsystem most often skipped, and most costly to skip.</p>

  <h2 class="doc-h2">What good looks like</h2>
  <ul class="doc-list">
    <li>There's a known, repeatable path from individual contributor to leader — not a single mentor's personal patronage.</li>
    <li>People are given real decision-making practice before they're given the title, not after.</li>
    <li>The organization can name who's ready for more responsibility today, without a scramble.</li>
  </ul>

  <table class="doc-table">
    <tr><th>Question</th><th>What it reveals</th></tr>
    <tr><td>If a key leader left tomorrow, who's ready to step in — and how do you know?</td><td>Real succession depth versus assumed depth</td></tr>
    <tr><td>How did the current leadership team actually develop into their roles?</td><td>Whether development is systemic or accidental</td></tr>
  </table>

  <div class="worksheet-field">
    <div class="field-label">Who is your organization's development system currently depending on, informally?</div>
    <div class="worksheet-line"></div>
  </div>
</section>

<section class="page">
  <p class="kicker">Implementation</p>
  <h1 class="doc-h1">Building the <strong>Operating System.</strong></h1>
  <p class="lead">You will not rebuild all five subsystems at once — and you shouldn't try. Sequence matters more than speed.</p>

  <div class="step-row">
    <span class="step-number">1</span>
    <div class="step-body">
      <h3 class="doc-h3">Rank the five subsystems by risk</h3>
      <p>Which one, if it stayed broken another year, would cost you the most — in trust, in speed, or in people leaving? Start there, not with whichever feels easiest.</p>
    </div>
  </div>
  <div class="step-row">
    <span class="step-number">2</span>
    <div class="step-body">
      <h3 class="doc-h3">Design one mechanism, not a full rebuild</h3>
      <p>A single new decision rule. One recurring communication rhythm. One accountability review meeting. Small, specific, and real — this is exactly the scope the <strong>Leadership Infrastructure Build Plan™</strong> is designed for.</p>
    </div>
  </div>
  <div class="step-row">
    <span class="step-number">3</span>
    <div class="step-body">
      <h3 class="doc-h3">Review quarterly, across all five</h3>
      <p>An operating system isn't installed once. Put a recurring quarter-end review on the calendar that walks through all five subsystems and asks, honestly, which one has quietly started to erode.</p>
    </div>
  </div>

  <div class="quote">A principle you have to keep repeating isn't infrastructure yet. A system you never have to explain — because it's just how things work here — is.</div>

  <h2 class="doc-h2">Where this fits</h2>
  <p>The Operating System is the center of Phase III. Once it's running, Phase IV — Preservation — is where you determine what of it needs to be captured, embedded, and transferred so it survives beyond you: start with the <strong>.LLab Legacy Infrastructure Map™</strong>, or go straight to the comprehensive <strong>.LLab Leadership Infrastructure Diagnostic™</strong> to assess where you stand across all four phases at once.</p>
</section>
`;
