import { renderChecklistDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'leadership-foundations-checklist',
  outFile: 'free-tools/leadership-foundations-checklist.pdf',
  docTitle: 'Leadership Foundations Checklist™',
  cover: {
    eyebrow: 'Phase I · Foundations — Free Checklist',
    title: 'Leadership Foundations <strong>Checklist</strong>™',
    subtitle: "A self-audit of what's already in place — before you build anything new on top of it.",
    phase: 'I · Foundations',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderChecklistDoc({
  headline: "Foundations Aren't Assumed.<br/><strong>They're Audited.</strong>",
  intro: 'Most leadership foundations are half-built and never checked. This audit checks them — quickly, and honestly.',
  contrast: [
    { label: 'Assumed To Be True', items: ["Values are “known” but never written down", 'Priorities live in your head, not shared', 'Consistency depends on mood, not a system'] },
    { label: 'Actually In Place', items: ['Values are stated in one plain sentence', 'Priorities are legible to people around you', 'At least one real system carries the load'] },
  ],
  items: [
    'I can name my core values in one sentence, without notes.',
    'My team or collaborators could describe my priorities the same way I would.',
    "I have a clear picture of what I'm responsible for versus what I'm not.",
    "I know which relationships and structures I'm currently leaning on most.",
    'I’ve written down what “working well” actually looks like for me.',
    'I have at least one system — not just a habit — that keeps me consistent.',
    'I know where my leadership infrastructure is thinnest right now.',
    "I've told at least one other person what I'm building.",
  ],
  bands: [
    { label: '0–3 Checked', copy: "Foundations are early. Start with whichever unchecked item surprised you most — that's usually the real gap." },
    { label: '4–6 Checked', copy: 'Real structure exists. Pick the weakest checkbox and build one piece of infrastructure around it next.' },
    { label: '7–8 Checked', copy: "A strong foundation. You're ready to go deeper with the paid Strength Map™ below." },
  ],
  commitPrompt: "The unchecked item I'll close first, and how, is:",
  upsell: { name: 'The Leadership Infrastructure Strength Map™', price: '$20', copy: 'turns one identified strength into a plan for building infrastructure around it.' },
});
