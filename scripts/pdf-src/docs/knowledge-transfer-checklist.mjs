import { renderChecklistDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'knowledge-transfer-checklist',
  outFile: 'free-tools/knowledge-transfer-checklist.pdf',
  docTitle: 'Knowledge Transfer Checklist™',
  cover: {
    eyebrow: 'Phase IV · Preservation — Free Checklist',
    title: 'Knowledge Transfer <strong>Checklist</strong>™',
    subtitle: "Make sure what's in your head is actually documented somewhere else too.",
    phase: 'IV · Preservation',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderChecklistDoc({
  headline: "If It's Only In Your Head,<br/><strong>It Doesn't Exist Yet.</strong>",
  intro: "Institutional memory that lives in one person's head isn't preserved — it's a single point of failure. This checks what would survive without you.",
  contrast: [
    { label: 'Lives In Your Head', items: ['Decisions and reasoning exist only in memory', 'One person could explain your priorities: you', 'Relationships depend on you personally'] },
    { label: 'Lives In The System', items: ['Key decisions and reasoning are written down', 'At least one other person could explain your priorities', "Critical relationships don't depend only on you"] },
  ],
  items: [
    'My key decisions and their reasoning are written down somewhere.',
    'At least one other person could explain my priorities in my absence.',
    "Critical relationships aren't dependent on me personally to continue.",
    'Important documents and systems are accessible to more than just me.',
    "I've identified who would need to be brought up to speed, and how.",
    "Institutional memory doesn't live only in informal conversations.",
    "There's a plan for what happens to unfinished work if I step away.",
    "I've reviewed this list in the last twelve months, not just once.",
  ],
  bands: [
    { label: '0–3 Checked', copy: 'Very little is transferable right now. Start by writing down the reasoning behind one recent decision.' },
    { label: '4–6 Checked', copy: 'Some knowledge is captured. Pick the weakest checkbox and document it this month.' },
    { label: '7–8 Checked', copy: 'Knowledge transfer is strong. The Diagnostic™ below checks the other three phases too.' },
  ],
  commitPrompt: "The one piece of knowledge I'll get out of my head and into writing this month is:",
  upsell: { name: 'The .LLab Leadership Infrastructure Diagnostic™', price: '$300', copy: 'assesses all four phases at once, including this one.' },
});
