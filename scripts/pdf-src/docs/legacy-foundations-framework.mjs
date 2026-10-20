import { licensePageHtml } from './_license.mjs';
import { header, field, box, callout, grid, checklist, signatures, close, partnerCover, lines } from './_partner.mjs';

export const meta = {
  key: 'legacy-foundations-framework',
  outFile: 'legacy-foundations-framework.pdf',
  docTitle: 'The .LLab Legacy Foundations Framework™',
  cover: partnerCover(
    'I · Foundations',
    'The Legacy <strong>Foundations</strong> Framework™',
    'Define your legacy. The complete framework for naming what your company stands on, what it will never compromise, and what it should be remembered for.',
    '$750'
  ),
};

export const contentHtml = `
${licensePageHtml}

<section class="page">
  ${header('00 · How To Use This Framework', 'Every Legacy Starts', 'With A Foundation.', 'Most companies never write down what they stand on. It lives in the founder and a few key people, and when they step back, it fades. This framework puts it on paper, in six parts, so it can be built on.')}
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">01</span><span class="pathway-label">Founding Vision</span><p>Why the company exists.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">02</span><span class="pathway-label">Values</span><p>What it will and won't do.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">03</span><span class="pathway-label">Leadership Identity</span><p>Who leads, and how.</p></div>
  </div>
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">04</span><span class="pathway-label">Strengths</span><p>What it can carry.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">05</span><span class="pathway-label">Legacy Definition</span><p>What it should be remembered for.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">06</span><span class="pathway-label">Foundations Record</span><p>Signed and displayed.</p></div>
  </div>
  ${callout('Who Completes It', 'The founder or owner leads. Bring in the people who carry the company day to day. Complete it in one working session or across four weeks; it should be revisited every year.')}
</section>

<section class="page">
  ${header('01 · Founding Vision', 'Why Does This', 'Company Exist?', 'Write the reason in plain language a new hire would understand on their first day.')}
  ${field('The problem we were founded to solve', 3)}
  ${field('Who we exist to serve', 2)}
  ${field('What would be missing from the world if we were gone', 3)}
  ${box('Founding Vision Statement', 'In one or two sentences: we exist to…', 3)}
</section>

<section class="page">
  ${header('02 · Core Values & Non-Negotiables', 'What We Will Do.', 'What We Never Will.', 'Values are only real when they cost something. Name each value, what it looks like in practice, and the line it never crosses.')}
  ${grid(['Core Value', 'What It Looks Like Here', 'The Line We Never Cross'], ['1.', '2.', '3.', '4.', '5.'])}
  ${box('Non-Negotiables', 'Decisions we will refuse to make, even if they would make us money:', 4)}
</section>

<section class="page">
  ${header('03 · Leadership Identity', 'Who Leads,', 'And What They Stand On.', 'A legacy reflects the people who built it. Capture the leadership that shaped the company so it can be recognized and carried on.')}
  ${field('The founder’s leadership in three words', 1)}
  ${field('The leadership principles that built this company', 3)}
  ${field('How decisions get made when it matters most', 2)}
  ${field('What every future leader here must understand', 3)}
</section>

<section class="page">
  ${header('04 · Strengths Assessment', 'What Can This Company', 'Carry?', 'Score each area 0 (not yet) to 3 (fully in place). Strengths are what the legacy stands on; gaps are where it is exposed.')}
  ${grid(['Area', 'Score (0–3)', 'Evidence', 'Exposure If It Fails'], ['Vision is written and shared', 'Values guide real decisions', 'Leadership extends beyond the founder', 'Key knowledge is documented', 'Customers know what we stand for', 'Team could explain our purpose', 'Finances support the mission'])}
  ${box('Our Strongest Foundation', 'The one strength everything else can be built on:', 2)}
  ${box('Our Greatest Exposure', 'The one gap that would put the legacy at risk:', 2)}
</section>

<section class="page">
  ${header('05 · Legacy Definition', 'What Should This Company', 'Be Remembered For?', 'Write from the future. Twenty-five years from now, after today’s leaders have stepped back.')}
  ${field('What our people will say about working here', 2)}
  ${field('What our customers will say we gave them', 2)}
  ${field('What our community will say we built', 2)}
  ${box('Legacy Statement', 'This company will be remembered for…', 3)}
</section>

<section class="page">
  ${header('06 · The Foundations Record', 'The Legacy', 'Foundations Record.', 'Bring the framework into one page. Sign it, display it, and review it every year.')}
  <div class="activity-box">
    <span class="activity-kicker">Company</span>${lines(1)}
    <span class="activity-kicker" style="margin-top:10px;">Founding Vision</span>${lines(1)}
    <span class="activity-kicker" style="margin-top:10px;">Core Values</span>${lines(1)}
    <span class="activity-kicker" style="margin-top:10px;">Non-Negotiables</span>${lines(1)}
    <span class="activity-kicker" style="margin-top:10px;">Legacy Statement</span>${lines(1)}
  </div>
  ${signatures(['Founder / Owner', 'Leadership', 'Leadership', 'Witness'])}
  ${checklist(['Printed and displayed', 'Shared with every team member', 'Annual review date set'])}
  ${callout('Next · Phase II', 'The .LLab Legacy Infrastructure Plan™ turns these foundations into decisions, priorities, and ownership your leadership team can manage.')}
  ${close('The .LLab Legacy Foundations Framework™')}
</section>
`;
