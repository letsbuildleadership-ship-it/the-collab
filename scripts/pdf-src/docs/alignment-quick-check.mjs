import { renderSnapshotDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'alignment-quick-check',
  outFile: 'free-tools/alignment-quick-check.pdf',
  docTitle: 'Alignment Quick-Check™',
  cover: {
    eyebrow: 'Phase II · Infrastructure Planning & Management — Free Quick-Check',
    title: 'Alignment <strong>Quick-Check</strong>™',
    subtitle: 'A five-minute check on whether your day-to-day work still matches your stated priorities.',
    phase: 'II · Infrastructure Planning & Management',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderSnapshotDoc({
  headline: 'Five Minutes.<br/><strong>Four Dimensions.</strong>',
  intro: 'A five-minute check on whether your day-to-day work still matches your stated priorities. This is a mirror, not a report card.',
  dimensions: [
    { label: 'Mission Clarity', body: 'Whether your mission is stated clearly enough to guide a decision.' },
    { label: 'Priority Fit', body: "Whether today's priorities actually reflect that mission." },
    { label: 'Resource Fit', body: 'Whether time, money, and attention go where the mission says they should.' },
    { label: 'Follow-Through', body: 'Whether commitments made against the mission actually get finished.' },
  ],
  bands: [
    { label: '4–9', copy: 'Alignment is loose right now. Start with whichever dimension scored lowest.' },
    { label: '10–15', copy: 'Partial alignment. Mission and action agree some of the time — find where they split.' },
    { label: '16–20', copy: 'Strong alignment. The Alignment Map™ below connects it to strategy and culture too.' },
  ],
  reflectPrompt: 'The dimension furthest out of alignment is, and the fix I\'ll try first is:',
  upsell: { name: 'The Leadership Alignment Map™', price: '$50', copy: 'closes the gaps this quick-check surfaces.' },
});
