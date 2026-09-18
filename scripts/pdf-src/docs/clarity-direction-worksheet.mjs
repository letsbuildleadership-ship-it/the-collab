import { renderWorksheetDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'clarity-direction-worksheet',
  outFile: 'free-tools/clarity-direction-worksheet.pdf',
  docTitle: 'Clarity & Direction Worksheet™',
  cover: {
    eyebrow: 'Phase I · Foundations — Free Worksheet',
    title: 'Clarity &amp; Direction <strong>Worksheet</strong>™',
    subtitle: 'Four short prompts to name your direction in plain language before you build anything on top of it.',
    phase: 'I · Foundations',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderWorksheetDoc({
  headline: "Direction Isn't A Vision.<br/><strong>It's Four Sentences.</strong>",
  intro: 'Write in plain language. No prompt should take longer than a minute to answer.',
  frameworkLabel: 'Direction gets clearer with each short, plain-language answer — not with more thinking.',
  frameworkSteps: [
    { label: 'Name It', body: "Say what you're building, plainly" },
    { label: 'Define It', body: 'Know what success looks like' },
    { label: 'Test It', body: "Face the decision you're avoiding" },
  ],
  prompts: [
    { kicker: 'Prompt 1', prompt: "The one thing I'm actually building right now is…" },
    { kicker: 'Prompt 2', prompt: "I'll know it's working when…" },
    { kicker: 'Prompt 3', prompt: 'The decision I keep avoiding is…' },
    { kicker: 'Prompt 4', prompt: 'If I only had one strength to build from, it would be…' },
  ],
  synthesisPrompt: 'In one sentence, my direction right now is:',
  upsell: { name: 'The Leadership Infrastructure Strength Map™', price: '$20', copy: 'is the next step once your direction is named.' },
});
