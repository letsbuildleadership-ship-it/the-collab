import { renderSnapshotDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'legacy-infrastructure-snapshot',
  outFile: 'free-tools/legacy-infrastructure-snapshot.pdf',
  docTitle: 'Legacy Infrastructure Snapshot™',
  cover: {
    eyebrow: 'Phase IV · Preservation — Free Snapshot',
    title: 'Legacy Infrastructure <strong>Snapshot</strong>™',
    subtitle: 'A first look at how prepared your leadership infrastructure is to outlast you.',
    phase: 'IV · Preservation',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderSnapshotDoc({
  headline: 'Capture, Embed,<br/><strong>Transfer, Sustain.</strong>',
  intro: 'The four tests every lasting piece of infrastructure has to pass.',
  dimensions: [
    { label: 'Capture', body: "Whether what matters is actually recorded anywhere durable." },
    { label: 'Embed', body: "Whether it's built into systems, not just stored in a file." },
    { label: 'Transfer', body: 'Whether someone else could actually pick it up and continue it.' },
    { label: 'Sustain', body: 'Whether it would keep running, or quietly stop, without you.' },
  ],
  bands: [
    { label: '4–9', copy: 'Legacy infrastructure is mostly untested right now. Start with Capture — write it down first.' },
    { label: '10–15', copy: "Some of it would survive. Some wouldn't. Find the weakest test." },
    { label: '16–20', copy: 'Legacy infrastructure passes its own test. The Architecture™ below is the comprehensive version.' },
  ],
  reflectPrompt: 'The test my infrastructure would fail first is, and why:',
  upsell: { name: 'The .LLab Legacy Infrastructure Architecture™', price: '$1,000', copy: 'is the comprehensive framework this snapshot leads to.' },
});
