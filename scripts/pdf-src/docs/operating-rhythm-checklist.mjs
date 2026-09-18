import { renderChecklistDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'operating-rhythm-checklist',
  outFile: 'free-tools/operating-rhythm-checklist.pdf',
  docTitle: 'Operating Rhythm Checklist™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — Free Checklist',
    title: 'Operating Rhythm <strong>Checklist</strong>™',
    subtitle: 'Check your meeting, communication, and decision rhythms against what healthy systems actually need.',
    phase: 'III · Internal Operating Systems',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderChecklistDoc({
  headline: 'A Healthy Rhythm Is Boring.<br/><strong>In The Best Way.</strong>',
  intro: 'A healthy operating rhythm is predictable, and rarely urgent. This checks whether yours is.',
  contrast: [
    { label: 'Runs On Urgency', items: ["Meetings happen because they're on the calendar", 'Decisions get made case-by-case', 'Planning happens only under pressure'] },
    { label: 'Runs On Rhythm', items: ['Every recurring meeting has a stated purpose', 'Decisions follow a known process', 'Planning happens on a set cadence'] },
  ],
  items: [
    'Recurring meetings have a stated purpose, not just a stated time.',
    'Decisions have a clear, known process — not case-by-case improvisation.',
    'Information reaches the people who need it without being asked twice.',
    "There's a regular rhythm for reviewing what's working and what isn't.",
    'Planning happens on a cadence, not only under pressure.',
    "Communication channels are few enough that nothing gets lost between them.",
    "Rhythms are documented somewhere besides one person's calendar.",
    'The rhythm has been reviewed and adjusted in the last year.',
  ],
  bands: [
    { label: '0–3 Checked', copy: 'The rhythm is mostly reactive right now. Start by naming the purpose of one recurring meeting.' },
    { label: '4–6 Checked', copy: 'Some rhythm exists. Pick the weakest checkbox and put a cadence behind it.' },
    { label: '7–8 Checked', copy: 'The rhythm is genuinely healthy. The Operating System™ below makes it repeatable at scale.' },
  ],
  commitPrompt: "The one rhythm I'll document or set a cadence for this month is:",
  upsell: { name: 'The .LLab Leadership Operating System™', price: '$750', copy: 'turns healthy rhythms into repeatable organizational practice.' },
});
