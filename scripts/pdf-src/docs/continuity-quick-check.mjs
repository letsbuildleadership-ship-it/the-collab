import { renderSnapshotDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'continuity-quick-check',
  outFile: 'free-tools/continuity-quick-check.pdf',
  docTitle: 'Continuity Quick-Check™',
  cover: {
    eyebrow: 'Phase IV · Preservation — Free Quick-Check',
    title: 'Continuity <strong>Quick-Check</strong>™',
    subtitle: 'Check whether your organization could keep running smoothly if you stepped away for a month.',
    phase: 'IV · Preservation',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderSnapshotDoc({
  headline: 'The One-Month Test.',
  intro: "Imagine you're unreachable for thirty days. Score honestly against that scenario.",
  dimensions: [
    { label: 'Documentation', body: 'How much of what you know is actually written down somewhere else.' },
    { label: 'Delegation', body: 'How much currently depends on you personally to keep moving.' },
    { label: 'Dependency', body: 'How many critical relationships or systems run through you alone.' },
    { label: 'Readiness', body: 'How prepared your team would be if you were unreachable tomorrow.' },
  ],
  bands: [
    { label: '4–9', copy: 'Continuity is fragile right now. Start with your lowest-scoring dimension.' },
    { label: '10–15', copy: 'Some continuity exists, but real dependencies remain.' },
    { label: '16–20', copy: 'Strong continuity. The Infrastructure Blueprint™ below makes it intentional, not accidental.' },
  ],
  reflectPrompt: "The dependency I'd most need to remove first is:",
  upsell: { name: 'The .LLab Infrastructure Blueprint™', price: '$500', copy: 'turns this check into an intentional infrastructure-building framework.' },
});
