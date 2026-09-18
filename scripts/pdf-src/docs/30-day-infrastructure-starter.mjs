import { renderStarterDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: '30-day-infrastructure-starter',
  outFile: 'free-tools/30-day-infrastructure-starter.pdf',
  docTitle: '30-Day Infrastructure Starter™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — Free Starter',
    title: '30-Day Infrastructure <strong>Starter</strong>™',
    subtitle: 'A simple 30-day plan for putting your first piece of infrastructure in place.',
    phase: 'II · Infrastructure Planning & Management',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderStarterDoc({
  headline: 'One Month.<br/><strong>One System.</strong>',
  intro: 'Pick one gap. Build one system for it. Resist adding a second.',
  steps: [
    { label: 'Week One — Name The Gap', short: 'Name the gap', body: 'Identify the single infrastructure gap costing you the most right now.' },
    { label: 'Week Two — Design The Minimum', short: 'Design the minimum', body: 'Sketch the smallest version of a system that would close it.' },
    { label: 'Week Three — Test It', short: 'Test it live', body: 'Run it for a week. Note where it holds and where it breaks.' },
    { label: 'Week Four — Decide What Stays', short: 'Decide what stays', body: "Keep what worked. Cut what didn't. Write down the final version." },
  ],
  closingPrompt: "The system I'm committing to build this month is:",
  upsell: { name: 'The Leadership Infrastructure Build Plan™', price: '$100', copy: 'turns this starter into a full 30-day build plan.' },
});
