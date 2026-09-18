import { renderChecklistDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'accountability-gaps-checklist',
  outFile: 'free-tools/accountability-gaps-checklist.pdf',
  docTitle: 'Accountability Gaps Checklist™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — Free Checklist',
    title: 'Accountability Gaps <strong>Checklist</strong>™',
    subtitle: 'Spot where accountability quietly breaks down across your team or organization.',
    phase: 'II · Infrastructure Planning & Management',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderChecklistDoc({
  headline: "Gaps Aren't Dramatic.<br/><strong>They're Quiet.</strong>",
  intro: 'Most accountability breaks down quietly, not in one dramatic failure. This checklist finds the quiet breaks before they compound.',
  contrast: [
    { label: 'Looks Accountable', items: ['Everyone nods in the meeting', "Ownership feels “understood”", 'Feedback flows one direction: down'] },
    { label: 'Actually Accountable', items: ['Decisions are written down, not just agreed', 'Every commitment has one named owner', 'Feedback moves both ways, on a schedule'] },
  ],
  items: [
    'Decisions made in meetings are written down somewhere everyone can find.',
    'Every open commitment has one clearly named owner.',
    'I know what happens when a deadline is missed — and so does everyone else.',
    'Feedback moves in both directions, not just downward.',
    "I can name who is accountable to me, and who I'm accountable to.",
    'Nothing important currently depends only on my memory.',
    "Follow-through is checked on a schedule, not just when something breaks.",
    "I've had an honest conversation about accountability in the last 90 days.",
  ],
  bands: [
    { label: '0–3 Checked', copy: 'Accountability is informal right now. Start by naming one owner for one open commitment today.' },
    { label: '4–6 Checked', copy: 'Some real structure exists. Pick the weakest checkbox and put a system behind it.' },
    { label: '7–8 Checked', copy: 'Accountability is strong. The Alignment Map™ below connects it to the rest of your infrastructure.' },
  ],
  commitPrompt: "The one commitment I'll assign a clear owner to this week is:",
  upsell: { name: 'The Leadership Alignment Map™', price: '$50', copy: 'is the next step for closing the gaps you just found.' },
});
