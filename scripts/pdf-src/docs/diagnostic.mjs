export const meta = {
  key: 'diagnostic',
  outFile: 'diagnostic.pdf',
  docTitle: '.LLab Leadership Infrastructure Diagnostic™',
  cover: {
    eyebrow: 'Phase IV · Preservation — a .LLab™ Assessment',
    title: '.LLab Leadership Infrastructure <strong>Diagnostic</strong>™',
    subtitle: "A comprehensive, scored assessment of your organization's leadership infrastructure across all four phases.",
    phase: 'IV · Preservation',
    price: '$300',
    footerRight: 'The .LLab™ IV Phases Product Infrastructure',
  },
};

function ratingTable(rows) {
  return `<table class="doc-table">
    <tr><th style="width:60%">Statement</th><th style="width:40%">Rate 1 (rarely true) – 5 (always true)</th></tr>
    ${rows.map((r) => `<tr><td>${r}</td><td></td></tr>`).join('\n')}
  </table>`;
}

export const contentHtml = `
<section class="page">
  <p class="kicker">Before you begin</p>
  <h1 class="doc-h1">One score isn't the point. <strong>Four scores</strong> are.</h1>
  <p class="lead">Most organizational assessments produce a single number — a culture score, an engagement score — that tells you something is off without telling you where. This Diagnostic is built differently: it scores your infrastructure separately across all four phases, so you can see exactly which one is holding the others back.</p>

  <div class="callout">
    <div class="callout-label">The core idea</div>
    <p>An organization can be strong in one phase and quietly weak in another — brilliant Foundations, no real Operating Systems; a beautiful Vision, nothing preserved. The Diagnostic exists to find that specific imbalance, not to produce a vague overall grade.</p>
  </div>

  <h2 class="doc-h2">How to use this assessment</h2>
  <p>Rate each statement honestly, from 1 (rarely true) to 5 (always true) — resist the pull to answer as you'd like things to be. Answer for the organization as it actually operates today, not the version in the strategy deck. Total each phase separately using the scoring guide at the end.</p>
  <p>For the most accurate picture, have two or three people in different roles complete this independently before comparing answers — the gaps between their scores are often as informative as the scores themselves.</p>
</section>

<section class="page">
  <p class="kicker">Phase I</p>
  <h1 class="doc-h1"><strong>Foundations.</strong></h1>
  <p class="lead">Understanding the organization, its purpose, and its structure before adding anything new.</p>
  ${ratingTable([
    'We can name our organization\'s core strengths without hesitation, and we can point to evidence, not just opinion.',
    'Our mission and values are things people actually reference when making real decisions, not just words on a wall.',
    'New hires understand who we are and why within their first month, without having to piece it together informally.',
    'We know our biggest infrastructure gaps, and we haven\'t avoided naming them.',
    'Leadership regularly revisits foundational assumptions rather than treating them as settled forever.',
  ])}
</section>

<section class="page">
  <p class="kicker">Phase II</p>
  <h1 class="doc-h1"><strong>Infrastructure Planning &amp; Management.</strong></h1>
  <p class="lead">Determining what infrastructure is needed and how the pieces connect.</p>
  ${ratingTable([
    'Our mission, vision, values, strategy, and culture visibly reinforce each other rather than quietly contradicting each other.',
    'We plan infrastructure deliberately, rather than reacting to whatever broke most recently.',
    'When we build something new, we can point to a clear owner and a clear definition of done.',
    'We\'ve shipped at least one concrete infrastructure build in the last 90 days — not just planned one.',
    'Our strategic priorities are realistic given the infrastructure we actually have in place.',
  ])}
</section>

<section class="page">
  <p class="kicker">Phase III</p>
  <h1 class="doc-h1"><strong>Internal Operating Systems.</strong></h1>
  <p class="lead">The systems, processes, and mechanisms that let the organization function without depending on any one person.</p>
  ${ratingTable([
    'Decision rights are clearly known — people can say what they\'re allowed to decide without asking.',
    'Information (including bad news) moves through the organization quickly and predictably.',
    'Commitments made in planning meetings are reliably followed up on, not quietly forgotten.',
    'Our culture — what people actually do under pressure — matches what we say we value.',
    'We have a real, working path for developing the next generation of leaders, not just informal mentorship.',
  ])}
</section>

<section class="page">
  <p class="kicker">Phase IV</p>
  <h1 class="doc-h1"><strong>Preservation.</strong></h1>
  <p class="lead">Making the infrastructure durable, transferable, and capable of lasting legacy.</p>
  ${ratingTable([
    'Critical knowledge is documented, not locked in one person\'s head.',
    'More than one person could step into any single key role if needed.',
    'Our culture would survive a change in senior leadership, because it\'s built into practice, not personality.',
    'We\'ve identified what needs to be preserved and have an active plan to do it — not just an intention to eventually.',
    'We revisit our preservation plan on a real schedule, not only when a crisis forces us to.',
  ])}
</section>

<section class="page">
  <p class="kicker">Scoring &amp; interpretation</p>
  <h1 class="doc-h1">Read your <strong>four scores.</strong></h1>
  <p class="lead">Add the five ratings in each phase for a score out of 25. Plot all four — the shape of the gap matters more than any single number.</p>

  <table class="doc-table">
    <tr><th>Score range</th><th>What it suggests</th></tr>
    <tr><td>5–10</td><td>This phase is largely undeveloped — foundational work is the priority here before building further up the stack.</td></tr>
    <tr><td>11–17</td><td>Real elements exist, but inconsistently — infrastructure is present but depends too much on specific people remembering to maintain it.</td></tr>
    <tr><td>18–22</td><td>Solid and largely reliable — the focus now is reinforcement and preservation rather than new construction.</td></tr>
    <tr><td>23–25</td><td>Strong and durable — this phase is likely a genuine organizational strength worth studying and replicating elsewhere.</td></tr>
  </table>

  <div class="callout">
    <div class="callout-label">Reading the shape, not just the numbers</div>
    <p>A high Phase I score with a low Phase III score means you understand yourselves well but haven't built the systems to act on it consistently. A high Phase III with a low Phase IV means you're running well today but exposed if key people leave. The lowest phase is where infrastructure work should start — regardless of which phase feels most urgent.</p>
  </div>

  <h2 class="doc-h2">Where this fits</h2>
  <p>The Diagnostic identifies where to focus. The <strong>.LLab Infrastructure Blueprint™</strong> turns that finding into a prioritized, sequenced plan — and the <strong>.LLab Legacy Infrastructure Architecture™</strong> is the comprehensive framework for building it all out, phase by phase.</p>
</section>
`;
