import { licensePageHtml } from './_license.mjs';
import { header, field, box, callout, grid, checklist, signatures, close, partnerCover } from './_partner.mjs';

export const meta = {
  key: 'legacy-preservation-vault',
  outFile: 'legacy-preservation-vault.pdf',
  docTitle: 'The .LLab Legacy Preservation Vault™',
  cover: partnerCover(
    'IV · Preservation',
    'The Legacy <strong>Preservation</strong> Vault™',
    'Preserve your legacy. The Omnidirectional Legacy Plan™, the Succession Map™, and the Steward’s Guide™: how the founder’s vision is upheld across generations.',
    '$5,000'
  ),
};

export const contentHtml = `
${licensePageHtml}

<section class="page">
  ${header('00 · Inside The Vault', 'A Legacy Held By One Person Can Be Lost.', 'A Legacy Held By All It Serves Endures.', 'The founder’s vision is upheld across generations when it is written into how the company is governed, owned, and rewarded, and when everyone it serves has a stake in keeping it.')}
  <table class="doc-table">
    <tr><th>Inside</th><th>What It Does</th></tr>
    <tr><td><strong>The Omnidirectional Legacy Plan™</strong></td><td>Six articles that tie the vision to governance, economics, and ownership.</td></tr>
    <tr><td><strong>The Succession Map™</strong></td><td>Who takes over what, and when.</td></tr>
    <tr><td><strong>The Steward’s Guide™</strong></td><td>The handbook for whoever guards the vision next.</td></tr>
  </table>
  ${callout('Make It Binding', 'Complete the Plan, then have your attorney incorporate the articles into your operating agreement or bylaws. The Co.LLab™ provides the framework; your counsel makes it legally binding.')}
</section>

<section class="page">
  ${header('The Omnidirectional Legacy Plan™ · Article I', 'Statement Of', 'Founder’s Intent.', 'Written to be incorporated into the company’s governing documents.')}
  ${field('The purpose of the company, as intended by its founder', 3)}
  ${field('The values that shall govern its conduct', 3)}
  ${field('The commitments that shall not be changed without the approval set out in Article VI', 3)}
</section>

<section class="page">
  ${header('Article II', 'Stakeholder', 'Register.', 'Name everyone the legacy serves, in every direction. Each has a stake in upholding it.')}
  ${grid(['Stakeholder', 'What The Legacy Gives Them', 'What They Give The Legacy'], ['Employees', 'Customers', 'Community', 'Partners', 'Creators & suppliers', 'Future leaders'])}
</section>

<section class="page">
  ${header('Article III', 'Stewardship And', 'Governance Structure.', 'Stewardship is shared, not inherited by one person. Define who guards the vision and how they are chosen.')}
  ${grid(['Stewardship Seat', 'Held By', 'How Appointed', 'Term'], ['Legacy council chair', 'Leadership seat', 'Employee seat', 'Community seat', 'Independent seat'])}
  ${field('Authority of the stewards (what they can approve, review, or stop)', 3)}
</section>

<section class="page">
  ${header('Article IV', 'Value Distribution', 'Framework.', 'People uphold what they share in. Define how value returns to each stakeholder.')}
  ${grid(['Value Flow', 'Commitment', 'Measure'], ['Reinvestment in the mission', 'Rewards tied to living the values', 'Community commitment', 'Partner and supplier commitment', 'Reserve for continuity'])}
  ${field('Profit priorities, in order', 3)}
</section>

<section class="page">
  ${header('Article V', 'Ownership Transfer And', 'Succession Provisions.', 'The vision must travel with every sale, transfer, and leadership change.')}
  ${field('Conditions any new owner or controlling party must accept', 3)}
  ${field('Provisions that protect the Founder’s Intent in a sale or merger', 3)}
  ${field('Who holds authority if the founder is unable to serve', 2)}
</section>

<section class="page">
  ${header('Article VI', 'Annual Legacy Review And', 'Amendment Procedure.', 'The plan adapts without being quietly abandoned.')}
  ${grid(['Review Item', 'Owner', 'Month'], ['Annual legacy review with stewards', 'Stakeholder Register update', 'Value Distribution report', 'Succession Map update'])}
  ${field('Approval required to amend Articles I–V', 2)}
  ${signatures(['Founder / Owner', 'Legacy Council Chair', 'Leadership', 'Counsel (Reviewed)'])}
</section>

<section class="page">
  ${header('The Succession Map™', 'Who Takes Over What,', 'And When.', 'Plan for planned transitions and unplanned ones.')}
  ${grid(['Role Or Responsibility', 'Current Holder', 'Successor', 'Ready By', 'Knowledge To Transfer'], ['Founder / CEO', 'Operations lead', 'Finance lead', 'Key client relationships', 'Culture & values steward'], 2)}
  ${checklist(['Emergency successor named for every critical role', 'Knowledge transfer scheduled', 'Successors have read the Founder’s Intent'])}
</section>

<section class="page">
  ${header('The Steward’s Guide™', 'For Whoever', 'Guards The Vision Next.', 'Written by the founder, for every steward who follows.')}
  ${box('What This Company Is For', 'In my own words:', 2)}
  ${box('What I Would Want You To Protect Above All', 'If you remember one thing:', 2)}
  ${box('What I Would Want You To Change', 'Where the company should grow beyond me:', 2)}
  ${field('Signed by the founder', 1)}
  ${callout('Omnidirectional Enterprise™', 'Your legacy now moves in every direction: through your people, your customers, your community, and the partners who build alongside you.')}
  ${close('The .LLab Legacy Preservation Vault™')}
</section>
`;
