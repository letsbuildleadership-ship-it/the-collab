import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'decision-principles-playbook',
  outFile: 'decision-principles-playbook.pdf',
  docTitle: '.LLab Decision Principles Playbook™',
  cover: cover({
    title: '.LLab Decision Principles <strong>Playbook</strong>™',
    subtitle: 'Turn what you believe into the rules your organization uses to decide.',
    price: '$125',
  }),
};

export const contentHtml = foundationsDoc({
  title: '.LLab Decision Principles Playbook™',
  tagline: 'When the right decision is written down, it does not depend on who is in the room.',
  intro: 'The .LLab Decision Principles Playbook™ helps a leadership team agree on how decisions get made: what is decided where, what principles every decision is tested against, and how to review decisions afterward. It is built to be used in a meeting.',
  steps: [
    { title: 'WHAT WE DECIDE', items: [
      { q: 'List the five kinds of decision that come up most often.', lines: 3 },
      { q: 'Which of them get made inconsistently today?', lines: 2 },
      { q: 'Which are made by the wrong person or at the wrong level?', lines: 2 },
    ] },
    { title: 'WHO DECIDES', items: [
      { pick: 'For your most frequent decision, who should decide?', n: '1', options: ['Founder or executive', 'Leadership team together', 'Department lead', 'Anyone closest to the work', 'Board or governing group'] },
      { q: 'Who must be consulted, and who only informed?', lines: 2 },
      { q: 'What should never be decided without our values in the room?', lines: 2 },
    ] },
    { title: 'OUR DECISION PRINCIPLES', intro: 'Principles are short rules every decision is tested against.', items: [
      { q: 'What do we always put first when priorities conflict?', lines: 2 },
      { q: 'What do we refuse to sacrifice for speed?', lines: 2 },
      { fill: ['Principle 1:', 'Principle 2:', 'Principle 3:', 'Principle 4:', 'Principle 5:'] },
    ] },
    { title: 'TEST A REAL DECISION', items: [
      { q: 'Describe one decision we must make soon:', lines: 2 },
      { q: 'How does each principle apply to it?', lines: 3 },
      { q: 'What does the decision look like if we follow them?', lines: 2 },
    ] },
    { title: 'HOW WE RECORD AND REVIEW', items: [
      { q: 'Where will decisions be written down, and by whom?', lines: 1 },
      { q: 'How often will we look back at past decisions?', lines: 1 },
      { q: 'What will we do when a decision turns out to be wrong?', lines: 2 },
    ] },
    { title: 'OUR DECISION STATEMENT', items: [
      { fill: ['We decide by', 'Decisions about', 'are made by', 'We record decisions in', 'We review decisions every'] },
    ] },
  ],
  principle: 'Written principles make good decisions repeatable.',
  closing: 'A team that shares its decision principles decides faster, disagrees more usefully, and can onboard new leaders without starting over.',
});
