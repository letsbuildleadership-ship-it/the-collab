import { renderStarterDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'one-strength-starter',
  outFile: 'free-tools/one-strength-starter.pdf',
  docTitle: 'One Strength Starter™',
  cover: {
    eyebrow: 'Phase I · Foundations — Free Starter',
    title: 'One Strength <strong>Starter</strong>™',
    subtitle: 'A single-page starter for naming and building from one leadership strength — nothing more, nothing less.',
    phase: 'I · Foundations',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderStarterDoc({
  headline: 'Resist The Urge<br/><strong>To List Five.</strong>',
  intro: "Pick the strength that's most load-bearing right now — the one everything else leans on.",
  steps: [
    { label: 'Name It', short: 'State it plainly', body: 'Write the strength in one sentence, no qualifiers.' },
    { label: 'Prove It', short: 'One real example', body: 'Describe one recent, specific example of it in action.' },
    { label: 'Build On It', short: 'One small action', body: 'Choose one small action this week that uses it on purpose.' },
  ],
  closingPrompt: "The one action I'll take this week that uses this strength on purpose is:",
  upsell: { name: 'The Leadership Infrastructure Strength Map™', price: '$20', copy: 'turns this single strength into real infrastructure.' },
});
