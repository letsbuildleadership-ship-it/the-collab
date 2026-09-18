import { renderWorksheetDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'leadership-influence-worksheet',
  outFile: 'free-tools/leadership-influence-worksheet.pdf',
  docTitle: 'Leadership Influence Worksheet™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — Free Worksheet',
    title: 'Leadership Influence <strong>Worksheet</strong>™',
    subtitle: "Map where your influence is strongest inside your organization — and where it isn't reaching yet.",
    phase: 'III · Internal Operating Systems',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderWorksheetDoc({
  headline: "Influence Isn't Title.<br/><strong>It's Reach.</strong>",
  intro: 'Map where your influence actually travels — and where it stops.',
  frameworkLabel: "Influence isn't title. It's reach — and reach can be mapped.",
  frameworkSteps: [
    { label: 'Map It', body: 'Where influence is strongest' },
    { label: 'Find The Edge', body: "Where it doesn't reach" },
    { label: 'Extend It', body: 'What carries it further' },
  ],
  prompts: [
    { kicker: 'Prompt 1', prompt: 'Where my influence is strongest right now is…' },
    { kicker: 'Prompt 2', prompt: "Where it doesn't reach yet is…" },
    { kicker: 'Prompt 3', prompt: "The person or system that extends it when I'm not there is…" },
    { kicker: 'Prompt 4', prompt: 'One system that would extend it further is…' },
  ],
  synthesisPrompt: 'The single move that would extend my influence furthest is:',
  upsell: { name: 'The .LLab Leadership Legacy Profile™', price: '$150', copy: 'connects your influence map to infrastructure and legacy.' },
});
