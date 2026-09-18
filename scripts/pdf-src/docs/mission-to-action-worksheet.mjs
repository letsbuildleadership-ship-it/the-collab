import { renderWorksheetDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'mission-to-action-worksheet',
  outFile: 'free-tools/mission-to-action-worksheet.pdf',
  docTitle: 'Mission-to-Action Worksheet™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — Free Worksheet',
    title: 'Mission-to-Action <strong>Worksheet</strong>™',
    subtitle: 'Translate your mission into three concrete actions you can take this month.',
    phase: 'II · Infrastructure Planning & Management',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderWorksheetDoc({
  headline: "Mission Statements<br/><strong>Don't Move Anything.</strong>",
  intro: 'This does. Four prompts that turn a mission statement into three concrete actions.',
  frameworkLabel: "Mission statements don't move anything on their own — the gap between mission and action does.",
  frameworkSteps: [
    { label: 'State It', body: 'Mission, in one sentence' },
    { label: 'Spot The Gap', body: "Where action doesn't match" },
    { label: 'Close It', body: 'Three actions this month' },
  ],
  prompts: [
    { kicker: 'Prompt 1', prompt: 'My mission, in one sentence, is…' },
    { kicker: 'Prompt 2', prompt: "The place my current actions don't match that mission is…" },
    { kicker: 'Prompt 3', prompt: 'Three actions I can take this month that would close that gap are…' },
    { kicker: 'Prompt 4', prompt: 'The person who needs to know about this shift is…' },
  ],
  synthesisPrompt: "The one action from my list I'll start today is:",
  upsell: { name: 'The Leadership Alignment Map™', price: '$50', copy: 'connects mission, vision, values, strategy, culture, and leadership in full.' },
});
