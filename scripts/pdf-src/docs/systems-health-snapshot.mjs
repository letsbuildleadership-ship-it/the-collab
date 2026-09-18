import { renderSnapshotDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'systems-health-snapshot',
  outFile: 'free-tools/systems-health-snapshot.pdf',
  docTitle: 'Systems Health Snapshot™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — Free Snapshot',
    title: 'Systems Health <strong>Snapshot</strong>™',
    subtitle: 'A fast diagnostic snapshot of how well your internal systems are actually operating.',
    phase: 'III · Internal Operating Systems',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderSnapshotDoc({
  headline: 'Four Systems.<br/><strong>One Score Each.</strong>',
  intro: 'Score each system as it functions today, not as it\'s designed to function.',
  dimensions: [
    { label: 'Culture', body: 'Whether stated values match what actually happens day to day.' },
    { label: 'Rhythm', body: 'Whether meetings, planning, and review run on a predictable cadence.' },
    { label: 'Communication', body: 'Whether information reaches the right people without being chased.' },
    { label: 'Influence', body: "Whether your leadership reach extends beyond the room you're in." },
  ],
  bands: [
    { label: '4–9', copy: 'Systems are informal right now. Start with whichever one scored lowest.' },
    { label: '10–15', copy: 'Some systems are operating well; others are still improvised.' },
    { label: '16–20', copy: 'Systems are genuinely healthy. The Operating System™ below makes them repeatable.' },
  ],
  reflectPrompt: 'The system scoring lowest is, and the first fix I\'ll make is:',
  upsell: { name: 'The .LLab Leadership Operating System™', price: '$750', copy: 'is the full build for whichever system scored lowest.' },
});
