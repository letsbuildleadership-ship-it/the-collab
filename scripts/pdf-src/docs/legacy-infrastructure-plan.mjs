import { licensePageHtml } from './_license.mjs';
import { header, field, box, callout, grid, checklist, close, partnerCover } from './_partner.mjs';

export const meta = {
  key: 'legacy-infrastructure-plan',
  outFile: 'legacy-infrastructure-plan.pdf',
  docTitle: 'The .LLab Legacy Infrastructure Plan™',
  cover: partnerCover(
    'II · Infrastructure Planning & Management',
    'The Legacy <strong>Infrastructure</strong> Plan™',
    'Plan it. How your leadership team plans and manages what the company stands on: decision rights, priorities, ownership, and how it all connects.',
    '$1,500'
  ),
};

export const contentHtml = `
${licensePageHtml}

<section class="page">
  ${header('00 · How To Use This Plan', 'A Legacy Needs', 'A Plan To Carry It.', 'The .LLab Legacy Foundations Framework™ defined what the company stands on. This plan decides who carries it, how decisions are made, and what gets built next.')}
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">01</span><span class="pathway-label">Legacy Priorities</span><p>What matters most now.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">02</span><span class="pathway-label">Decision Rights</span><p>Who decides what.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">03</span><span class="pathway-label">Ownership Map</span><p>Who carries each area.</p></div>
  </div>
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">04</span><span class="pathway-label">Dependency Map</span><p>What rests on one person.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">05</span><span class="pathway-label">Connections</span><p>How it fits together.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">06</span><span class="pathway-label">12-Month Plan</span><p>What gets built, when.</p></div>
  </div>
  ${callout('Who Completes It', 'The leadership team, together. Bring the completed Legacy Foundations Framework™ to the table.')}
</section>

<section class="page">
  ${header('01 · Legacy Priorities', 'What Matters', 'Most Right Now?', 'Rank the three priorities that most protect and advance the legacy this year.')}
  ${grid(['Rank', 'Priority', 'Why It Protects The Legacy', 'Measure Of Success'], ['1', '2', '3'])}
  ${box('What We Will Stop Doing', 'To make room for these priorities, we will stop…', 3)}
</section>

<section class="page">
  ${header('02 · Decision Rights', 'Who Decides', 'What?', 'Unclear decisions route back to the founder. Clear decision rights let the legacy run without one person in every room.')}
  ${grid(['Decision Type', 'Decides', 'Consulted', 'Informed', 'Guided By (Value)'], ['Hiring & firing', 'Pricing', 'New products or services', 'Major spending', 'Partnerships', 'Brand & reputation', 'Culture & conduct'])}
</section>

<section class="page">
  ${header('03 · Ownership Map', 'Who Carries', 'Each Area?', 'Every area of the business needs one owner, and a second person who could step in.')}
  ${grid(['Area', 'Owner', 'Backup', 'Documented? (Y/N)'], ['Leadership & vision', 'Operations', 'Finance', 'Sales & customers', 'People & culture', 'Product or service quality', 'Community & partners'])}
</section>

<section class="page">
  ${header('04 · Dependency Map', 'What Rests On', 'One Person?', 'List what would stall if one person were gone for 30 days. These are the places the legacy is most exposed.')}
  ${grid(['What Depends On One Person', 'Who', 'Risk (Low / Med / High)', 'Plan To Transfer It'], [], 6)}
</section>

<section class="page">
  ${header('05 · Connections', 'How Does It', 'All Connect?', 'Infrastructure is connection. Map how each priority links to your values, your people, and the people you serve.')}
  ${grid(['Priority', 'Value It Serves', 'Team That Carries It', 'Who It Serves'], ['1', '2', '3'])}
  ${box('Where Things Break Down', 'The handoff, meeting, or system where our values most often get lost:', 3)}
</section>

<section class="page">
  ${header('06 · 12-Month Legacy Plan', 'What Gets Built,', 'And When.', 'Turn the plan into quarters. Review it at every quarter’s end.')}
  ${grid(['Quarter', 'What We Build', 'Owner', 'Done When'], ['Q1', 'Q2', 'Q3', 'Q4'])}
  ${checklist(['Plan shared with the leadership team', 'Owners confirmed', 'Quarterly review dates set', 'Field notes ready for the Partnership cohort'])}
  ${callout('Next · Phase III', 'The .LLab Legacy Operating Systems Manual™ builds this plan into how the whole company runs, department by department.')}
  ${close('The .LLab Legacy Infrastructure Plan™')}
</section>
`;
