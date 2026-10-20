import { licensePageHtml } from './_license.mjs';
import { header, field, box, callout, grid, checklist, close, partnerCover } from './_partner.mjs';

export const meta = {
  key: 'legacy-operating-systems-manual',
  outFile: 'legacy-operating-systems-manual.pdf',
  docTitle: 'The .LLab Legacy Operating Systems Manual™',
  cover: partnerCover(
    'III · Internal Operating Systems',
    'The Legacy <strong>Operating Systems</strong> Manual™',
    'Live your legacy. How the whole company runs on what it stands on: the rhythms, standards, and practices that keep the legacy alive in every department, every day.',
    '$2,500'
  ),
};

const dept = (name) => `
<section class="page">
  ${header(`Department · ${name}`, `${name}:`, 'Living The Legacy.', 'Complete one page for each department. The department lead owns it.')}
  ${field('How this department serves the Founding Vision', 2)}
  ${grid(['Core Value', 'How We Practice It Here', 'How We Measure It'], ['1.', '2.', '3.'])}
  ${field('Standard operating practices that protect the legacy', 3)}
  ${field('What a new team member here must learn in their first 30 days', 2)}
</section>`;

export const contentHtml = `
${licensePageHtml}

<section class="page">
  ${header('00 · How To Use This Manual', 'A Legacy Lives', 'In How You Operate.', 'The .LLab Legacy Infrastructure Plan™ decided who carries what. This manual builds it into the systems the company runs on, so the legacy shows up in daily work, not just on the wall.')}
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">01</span><span class="pathway-label">Operating Rhythm</span><p>When the company meets and reviews.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">02</span><span class="pathway-label">Decision System</span><p>How decisions are made and recorded.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">03</span><span class="pathway-label">Accountability</span><p>How commitments are kept.</p></div>
  </div>
  <div class="pathway">
    <div class="pathway-step"><span class="pathway-num">04</span><span class="pathway-label">Culture Practices</span><p>How values become habits.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">05</span><span class="pathway-label">Department Systems</span><p>One page per department.</p></div>
    <span class="pathway-arrow">→</span>
    <div class="pathway-step"><span class="pathway-num">06</span><span class="pathway-label">Onboarding</span><p>How new people inherit it.</p></div>
  </div>
  ${callout('Who Completes It', 'Leadership sets sections 01–04. Each department lead completes their own page. Leadership signs off on the whole manual.')}
</section>

<section class="page">
  ${header('01 · Operating Rhythm', 'When The Company', 'Meets And Reviews.', 'A legacy is kept alive by rhythm. Set the meetings that keep everyone aligned.')}
  ${grid(['Rhythm', 'Who Attends', 'Purpose', 'Legacy Question Asked'], ['Weekly', 'Monthly', 'Quarterly', 'Annually'])}
  ${callout('Legacy Question', 'Every meeting ends with one question: “Did what we decided today match who we say we are?”')}
</section>

<section class="page">
  ${header('02 · Decision System', 'How Decisions Are Made', 'And Recorded.', 'Write major decisions down with the value that guided them. Over time, this becomes the company’s memory.')}
  ${grid(['Date', 'Decision', 'Decided By', 'Value That Guided It'], [], 7)}
  ${field('Our standard for a decision that must be written down', 2)}
</section>

<section class="page">
  ${header('03 · Accountability', 'How Commitments', 'Are Kept.', 'Accountability is how the legacy holds when no one is watching.')}
  ${grid(['Commitment', 'Owner', 'Check-In Cadence', 'If It Slips'], [], 6)}
  ${box('Recognition', 'How we recognize people who live the values:', 2)}
</section>

<section class="page">
  ${header('04 · Culture Practices', 'How Values', 'Become Habits.', 'Turn each core value into one practice the whole company repeats.')}
  ${grid(['Core Value', 'Practice', 'How Often', 'Owner'], ['1.', '2.', '3.', '4.', '5.'])}
</section>

${dept('Leadership')}
${dept('Operations')}
${dept('Sales & Customers')}
${dept('People & Culture')}

<section class="page">
  ${header('06 · Onboarding', 'How New People', 'Inherit The Legacy.', 'Every new person should learn what the company stands on before they learn how to do the job.')}
  ${grid(['Week', 'What They Learn', 'Who Teaches It'], ['Week 1', 'Week 2', 'Week 3', 'Week 4'])}
  ${checklist(['Legacy Foundations Record shared on day one', 'Values and practices explained by a leader', 'Department page reviewed with their lead', 'First field note shared after 30 days'])}
  ${callout('Next · Phase IV', 'The .LLab Legacy Preservation Vault™ makes sure all of this outlasts the people who built it.')}
  ${close('The .LLab Legacy Operating Systems Manual™')}
</section>
`;
