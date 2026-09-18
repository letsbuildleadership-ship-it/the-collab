import { renderSnapshotDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'foundation-strength-snapshot',
  outFile: 'free-tools/foundation-strength-snapshot.pdf',
  docTitle: 'Foundation Strength Snapshot™',
  cover: {
    eyebrow: 'Phase I · Foundations — Free Snapshot',
    title: 'Foundation Strength <strong>Snapshot</strong>™',
    subtitle: "A quick self-score across four foundational dimensions — where you're strong, and where it's thin.",
    phase: 'I · Foundations',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderSnapshotDoc({
  headline: 'Four Dimensions.<br/><strong>One Honest Score Each.</strong>',
  intro: "A quick self-score across four foundational dimensions — where you're strong, and where it's thin.",
  dimensions: [
    { label: 'Clarity', body: 'How clearly you can state what you\'re building and why.' },
    { label: 'Consistency', body: 'Whether your actions match your stated priorities week to week.' },
    { label: 'Support', body: 'The relationships and structures actually holding you up.' },
    { label: 'Direction', body: 'How confidently you know your next right move.' },
  ],
  bands: [
    { label: '4–9', copy: 'Foundations are early across the board. Start with your lowest-scoring dimension, not your favorite one.' },
    { label: '10–15', copy: 'A mixed foundation. One or two dimensions are carrying the others — reinforce the weakest.' },
    { label: '16–20', copy: 'A strong foundation. The Strength Map™ below builds real infrastructure on top of it.' },
  ],
  reflectPrompt: 'My lowest-scoring dimension is, and one thing I\'ll do about it this week is:',
  upsell: { name: 'The Leadership Infrastructure Strength Map™', price: '$20', copy: 'builds infrastructure around your lowest-scoring dimension.' },
});
