import { renderWorksheetDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'legacy-starter-worksheet',
  outFile: 'free-tools/legacy-starter-worksheet.pdf',
  docTitle: 'Legacy Starter Worksheet™',
  cover: {
    eyebrow: 'Phase IV · Preservation — Free Worksheet',
    title: 'Legacy Starter <strong>Worksheet</strong>™',
    subtitle: 'Begin naming what you want to leave behind — and who needs to carry it forward.',
    phase: 'IV · Preservation',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderWorksheetDoc({
  headline: 'Preservation Starts<br/><strong>With Naming.</strong>',
  intro: 'Begin naming what you want to leave behind — and who needs to carry it forward.',
  frameworkLabel: 'Preservation starts with naming, long before it becomes documentation.',
  frameworkSteps: [
    { label: 'Name It', body: 'What should outlast you' },
    { label: 'Locate It', body: "What's only in your head" },
    { label: 'Assign It', body: 'Who carries it forward' },
  ],
  prompts: [
    { kicker: 'Prompt 1', prompt: 'What I want to outlast me is…' },
    { kicker: 'Prompt 2', prompt: 'What currently exists only in my head is…' },
    { kicker: 'Prompt 3', prompt: 'Who could carry it forward, starting today, is…' },
    { kicker: 'Prompt 4', prompt: '"Preserved well" would look like…' },
  ],
  synthesisPrompt: "The first thing I'll document or hand off this month is:",
  upsell: { name: 'The .LLab Legacy Infrastructure Map™', price: '$200', copy: 'identifies what should be captured, embedded, transferred, and sustained.' },
});
