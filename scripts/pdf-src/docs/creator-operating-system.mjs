import { licenseHtml } from './_license.mjs';

export const meta = {
  key: 'creator-operating-system',
  outFile: 'creator-operating-system.pdf',
  docTitle: 'The Creator Operating System™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — a .LLab™ Workbook',
    title: 'The Creator Operating <strong>System</strong>™',
    subtitle: 'Repeatable systems for running the creative venture day-to-day — without every decision depending on you.',
    phase: 'III · Internal Operating Systems',
    price: '$300',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const module_ = (n, title, body) => `<p><strong>MODULE ${n} — ${title.toUpperCase()}</strong></p>${body}`;

export const contentHtml = `
<section class="page">
${licenseHtml}
<p><strong>THE CREATOR OPERATING SYSTEM™</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p>Six systems that let a creative venture run on infrastructure instead of adrenaline. Work through each module in order, or jump to the one that matches your thinnest area from the Creator Infrastructure Diagnostic™.</p>

${module_(1, 'The Weekly Operating Rhythm', `
<p>Assign each day or half-day a mode — Make, Reach, or Run — instead of scheduling individual tasks in isolation.</p>
<p>My weekly rhythm: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>The one block I will protect no matter what: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

${module_(2, 'The Offer System', `
<p>Write down every offer you currently have, its price, and what a buyer actually receives. Then mark which offers are your best margin, your best fit, and your least sustainable.</p>
<p>Offer / Price / Best fit? / Sustainable?</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>What is the one offer you should retire, and the one you should double down on?</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

${module_(3, 'The Audience System', `
<p>Map the path a stranger takes to become a buyer or supporter: Discovery → Engagement → Trust → Purchase/Support → Return. Write what happens (or should happen) at each stage today.</p>
<p>Discovery: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>Engagement: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>Trust: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>Purchase/Support: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>Return: <span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

${module_(4, 'The Delivery System', `
<p>Write the exact steps between "someone says yes" and "they have what they paid for, and are glad they did." Where does this currently break down or depend entirely on memory?</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p>What checklist or template would make this repeatable without you re-deciding it each time?</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

${module_(5, 'The Decision System', `
<p>Name the three decisions that come up most often in your venture (pricing a commission, accepting a collaboration, saying yes to a project). For each, write the standing rule you'll apply instead of deciding fresh every time.</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

${module_(6, 'The Review System', `
<p>Once a month, answer three questions: What worked and should be repeated? What didn't and should be dropped? What's one system from Modules 1–5 that needs adjusting?</p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
<p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>
`)}

<p><strong>YOUR NEXT MOVE</strong></p>
<p>With operating systems in place, the venture is ready for Preservation-phase infrastructure: <strong>Creative Estate Mapping™</strong> ($200), building toward the full <strong>Creator Legacy Infrastructure Architecture™</strong> ($750).</p>
<p><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
