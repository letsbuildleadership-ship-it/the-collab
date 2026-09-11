import { licenseHtml } from './_license.mjs';

export const meta = {
  key: 'creator-diagnostic',
  outFile: 'creator-diagnostic.pdf',
  docTitle: '.LLab Creator Infrastructure Diagnostic™ (Free Edition)',
  cover: {
    eyebrow: 'Creator Infrastructure™ — Free Diagnostic',
    title: '.LLab Creator Infrastructure <strong>Diagnostic</strong>™',
    subtitle: 'A short self-assessment across all four phases — free edition.',
    phase: 'All Four Phases',
    price: 'Free',
    footerRight: '.LLab Creator Infrastructure™',
  },
};

const section = (num, title, arc, items) => `
<p><strong>${num}. ${title.toUpperCase()} (${arc})</strong></p>
<p>Score each statement 0 (not true yet) to 3 (fully true).</p>
${items.map((i) => `<p>☐☐☐☐ &nbsp; ${i}</p>`).join('')}
<p><strong>Phase ${num} subtotal: <span class="worksheet-line" style="display:inline-block; width:20%;"></span> / ${items.length * 3}</strong></p>
`;

export const contentHtml = `
<section class="page">
${licenseHtml}
<p><strong>.LLAB CREATOR INFRASTRUCTURE DIAGNOSTIC™ — FREE EDITION</strong></p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p>This free edition gives you a directional score across all four phases of Creator Infrastructure™. Score honestly — this is a map of where infrastructure is thin, not a test you can fail.</p>

${section(1, 'Foundations', 'Idea → Identity', [
  'I can describe what I make in one clear sentence, without hedging.',
  'I know who my work is actually for.',
  'I could explain my creative identity to a stranger in under a minute.',
])}

${section(2, 'Infrastructure Planning & Management', 'Identity → Venture', [
  'I have a defined offer — something specific a person can buy or commission.',
  'I know roughly what it costs me (time, materials, effort) to deliver that offer.',
  'I have a plan, not just a hope, for how people find my work.',
])}

${section(3, 'Internal Operating Systems', 'Venture → Enterprise', [
  'At least one part of my practice runs on a repeatable process, not improvisation.',
  'I could hand off one task in my practice to someone else with written instructions.',
  'I track what\'s working and what isn\'t, in some form.',
])}

${section(4, 'Preservation', 'Enterprise → Legacy', [
  'I have a record of the work I\'ve made — titles, dates, where it lives.',
  'I know who would need to know what, if I stepped away for six months.',
  'I have thought, even briefly, about what happens to this body of work long-term.',
])}

<p><strong>YOUR RESULTS</strong></p>
<p>Total score: <span class="worksheet-line" style="display:inline-block; width:20%;"></span> / 36</p>
<p>Whichever phase scored lowest is where to start. Match it to the product ladder:</p>
<p>Foundations lowest → <strong>Creator Identity Map™</strong> ($20)</p>
<p>Infrastructure Planning &amp; Management lowest → <strong>Creator Alignment Map™</strong> ($50) or <strong>Creator Venture Build Plan™</strong> ($100)</p>
<p>Internal Operating Systems lowest → <strong>The Creator Operating System™</strong> ($300)</p>
<p>Preservation lowest → <strong>Creative Estate Mapping™</strong> ($200) or <strong>Creator Legacy Infrastructure Architecture™</strong> ($750)</p>
<p>Already strong across all four, and want it all unlocked at once? <strong>.LLab Membership™</strong> includes the full ladder.</p>
<p><strong>The Co.LLab: Building Leadership Infrastructure™</strong></p>
<p><a href="https://wearethellab.netlify.app/pages/creator.html">Explore .LLab Creator Infrastructure™</a></p>
</section>
`;
