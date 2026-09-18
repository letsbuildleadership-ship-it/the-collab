import { renderChecklistDoc } from './_free-tool-templates.mjs';

export const meta = {
  key: 'culture-practice-audit',
  outFile: 'free-tools/culture-practice-audit.pdf',
  docTitle: 'Culture & Practice Audit™',
  cover: {
    eyebrow: 'Phase III · Internal Operating Systems — Free Audit',
    title: 'Culture &amp; Practice <strong>Audit</strong>™',
    subtitle: "A candid audit of the everyday practices actually shaping your culture — not just the ones on paper.",
    phase: 'III · Internal Operating Systems',
    price: 'Free',
    footerRight: '.LLab™ Leadership Infrastructure™',
  },
};

export const contentHtml = renderChecklistDoc({
  headline: "Culture Is What Happens.<br/><strong>Not What's On Paper.</strong>",
  intro: "Culture is what people do when no one's watching. This audits that, not the handbook.",
  contrast: [
    { label: 'On The Handbook', items: ['Values are printed on the wall', "Norms are “understood”", 'Meetings happen on the calendar'] },
    { label: 'In The Practice', items: ['Values match what people actually do most weeks', 'New people learn norms fast, without a manual', 'Meetings reliably produce real decisions'] },
  ],
  items: [
    'The stated values and the lived practices match most weeks.',
    'New people learn "how we really work" quickly, without a manual.',
    'Meetings reliably produce decisions, not just discussion.',
    'Recognition and consequences are applied consistently, not selectively.',
    "Communication norms are clear enough that silence isn't ambiguous.",
    "Practices survive when I'm not in the room.",
    'I could describe our culture in specific behaviors, not adjectives.',
    "We've retired at least one practice that stopped serving us.",
  ],
  bands: [
    { label: '0–3 Checked', copy: 'Culture is mostly aspirational right now — on paper more than in practice. Start with the practice furthest from the stated value.' },
    { label: '4–6 Checked', copy: 'Culture is partly lived. Pick the weakest checkbox and reinforce it deliberately.' },
    { label: '7–8 Checked', copy: 'Culture is genuinely operating. The Legacy Profile™ below connects it to your personal influence.' },
  ],
  commitPrompt: "The practice I'll bring back in line with our values first is:",
  upsell: { name: 'The .LLab Leadership Legacy Profile™', price: '$150', copy: 'connects what you just audited to your organizational influence and legacy.' },
});
