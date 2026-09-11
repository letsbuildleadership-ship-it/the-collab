import { licenseHtml } from './_license.mjs';

export const meta = {
  key: 'creator-venture-build-plan',
  outFile: 'creator-venture-build-plan.pdf',
  docTitle: 'Creator Venture Build Plan™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — a .LLab™ Workbook',
    title: 'Creator Venture Build <strong>Plan</strong>™',
    subtitle: 'A practical 30-day plan for turning your creative practice into a venture.',
    phase: 'II · Infrastructure Planning & Management',
    price: '$100',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const week = (n, title, prompts) => `
<p><strong>WEEK ${n} — ${title.toUpperCase()}</strong></p>
${prompts.map((p) => `<p>${p}</p><p><span class="worksheet-line" style="display:inline-block; width:100%;"></span></p>`).join('')}
`;

export const contentHtml = `
<section class="page">
${licenseHtml}
<p><strong>CREATOR VENTURE BUILD PLAN™</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p>Turning a creative practice into a venture doesn't require a big leap — it requires four focused weeks. This plan assumes you already have a Creator Identity Map™ and, ideally, a Creator Alignment Map™ in hand.</p>

${week(1, 'Define the offer', [
  'What, exactly, is for sale or for support — name it in one sentence.',
  'What does a buyer or supporter actually receive, and by when?',
  'What is the price or ask, and why that number specifically?',
])}

${week(2, 'Build the smallest version', [
  'What is the leanest version of this offer you could deliver in the next two weeks?',
  'What will you deliberately leave out of this first version?',
  'Who are the first three people you\'ll offer it to directly?',
])}

${week(3, 'Create the reach path', [
  'Where does your specific audience already spend attention?',
  'What is the one channel you\'ll commit to for the next 90 days?',
  'What\'s the first piece of outreach, content, or announcement you\'ll publish?',
])}

${week(4, 'Run it and record what happened', [
  'What actually happened when you offered it — numbers, reactions, results?',
  'What would you change about the offer itself before doing this again?',
  'What repeatable system, if any, is now visible from this first round?',
])}

<p><strong>YOUR 30-DAY COMMITMENT</strong></p>
<p><strong>By the end of this plan, I will have offered <span class="worksheet-line" style="display:inline-block; width:100%;"></span></strong></p>
<p><strong>to <span class="worksheet-line" style="display:inline-block; width:100%;"></span></strong></p>
<p><strong>and I will know <span class="worksheet-line" style="display:inline-block; width:100%;"></span></strong></p>

<p><strong>YOUR NEXT MOVE</strong></p>
<p>Once your venture has run at least once, the next infrastructure question is how to make it repeatable without reinventing it every time — that's <strong>The Creator Operating System™</strong> ($300).</p>
<p><strong>Build the infrastructure. Strengthen the practice. Create the legacy.</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
