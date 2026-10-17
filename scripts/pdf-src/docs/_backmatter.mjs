// Scholarly back matter added to every Co.LLab IP™ product by
// render.mjs: a glossary of Co.LLab™ terms and appendices (the IV Phases™
// reference model, citation, and a fillable revision record).

const term = (t, d) => `<p style="margin:0 0 9px; font-size:10px; line-height:1.5;"><strong>${t}</strong> — ${d}</p>`;

const GLOSSARY = [
  ['Co.LLab IP™', 'The proprietary frameworks, tools, models, and materials of The Co.LLab™, owned by Ashley E. Clasby and licensed, never sold, to users.'],
  ['Foundations (Phase I)', 'The phase that defines what an organization stands on: vision, values, identity, and strengths.'],
  ['Infrastructure', 'The structures, systems, and practices that let an organization perform consistently, independent of any one person.'],
  ['Infrastructure Planning & Management (Phase II)', 'The phase that decides what to build and how it connects: priorities, decision rights, and ownership.'],
  ['Internal Operating Systems (Phase III)', 'The phase that builds repeatable rhythms, standards, and practices into daily operations.'],
  ['Leadership Infrastructure™', 'Leadership made structural: captured, documented, and embedded so it outlasts the individuals who hold it.'],
  ['Legacy', 'What an organization builds that continues after its founders and leaders step away.'],
  ['License', 'A limited right to use Co.LLab IP™ for internal purposes. A license grants use, not ownership.'],
  ['Non-Negotiable', 'A commitment an organization will not trade away, regardless of financial or competitive pressure.'],
  ['Omnidirectional Enterprise™', 'An ecosystem without hierarchy, in which value moves between companies, people, creators, and communities in every direction.'],
  ['Preservation (Phase IV)', 'The phase that ensures knowledge, culture, and intent survive leadership transitions.'],
  ['Stakeholder', 'Any person or group the organization serves or depends on: employees, customers, community, partners, and future leaders.'],
  ['Stewardship', 'The shared responsibility to protect and advance an organization’s founding intent.'],
  ['Succession', 'The planned transfer of roles, authority, and knowledge from one leader to the next.'],
  ['The IV Phases™', 'The four-phase Co.LLab™ model: Foundations, Infrastructure Planning & Management, Internal Operating Systems, and Preservation.'],
  ['Working Copy', 'A user’s completed or annotated copy of a Co.LLab IP™ product, made for authorized internal use.'],
];

export function backmatterHtml(docTitle) {
  const title = String(docTitle).replace(/<[^>]+>/g, '');
  return `
<section class="page">
  <div class="content-header">
    <span class="page-index">Glossary</span>
    <h2 class="section-title">Glossary Of <strong>Terms.</strong></h2>
    <p class="section-intro">Definitions of the terms used across The Co.LLab IP™, in alphabetical order.</p>
  </div>
  ${GLOSSARY.map(([t, d]) => term(t, d)).join('')}
</section>

<section class="page">
  <div class="content-header">
    <span class="page-index">Appendix A</span>
    <h2 class="section-title">The IV Phases™ <strong>Reference Model.</strong></h2>
  </div>
  <table class="doc-table">
    <tr><th>Phase</th><th>Purpose</th><th>Guiding Question</th></tr>
    <tr><td><strong>I · Foundations</strong></td><td>Define what the organization stands on.</td><td>What should never be lost as we grow?</td></tr>
    <tr><td><strong>II · Infrastructure Planning &amp; Management</strong></td><td>Decide what to build and how it connects.</td><td>What depends on a person that should belong to the organization?</td></tr>
    <tr><td><strong>III · Internal Operating Systems</strong></td><td>Build the systems that make it run.</td><td>How do we make what matters part of how we operate?</td></tr>
    <tr><td><strong>IV · Preservation</strong></td><td>Make it last beyond any one person.</td><td>What must exist for what we built to continue?</td></tr>
  </table>

  <div class="content-header" style="margin-top:26px;">
    <span class="page-index">Appendix B</span>
    <h2 class="section-title">Citation <strong>&amp; Edition.</strong></h2>
  </div>
  <p style="font-size:10px; line-height:1.55;"><strong>Suggested citation:</strong> Clasby, A. E. (2026). <em>${title}</em>. The Co.LLab: Building Leadership Infrastructure™.</p>
  <p style="font-size:10px; line-height:1.55;"><strong>Edition:</strong> First edition, 2026. © 2026 The Co.LLab™ Building Leadership Infrastructure™. All rights reserved. Licensed for internal use under The Co.LLab IP™ License &amp; Terms of Use.</p>

  <div class="content-header" style="margin-top:26px;">
    <span class="page-index">Appendix C</span>
    <h2 class="section-title">Revision <strong>Record.</strong></h2>
    <p class="section-intro">Record each review or update of your working copy.</p>
  </div>
  <table class="doc-table">
    <tr><th>Date</th><th>What Changed</th><th>Reviewed By</th></tr>
    ${'<tr><td></td><td></td><td></td></tr>'.repeat(5)}
  </table>
</section>`;
}
