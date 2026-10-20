import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'foundations-manual',
  outFile: 'foundations-manual.pdf',
  docTitle: 'Leadership Foundations Manual™',
  cover: cover({
    title: 'Leadership Foundations <strong>Manual</strong>™',
    subtitle: 'The full Phase I build: purpose, identity, values, principles and a charter in one guided manual.',
    price: '$300',
  }),
};

export const contentHtml = foundationsDoc({
  title: 'Leadership Foundations Manual™',
  tagline: 'Build the foundation once, in order, and write it down.',
  intro: 'The Leadership Foundations Manual™ is the complete guided build for Phase I · Foundations. It takes you through six parts in order: purpose, strength, identity, values, decision principles and your foundation charter. Work through it over several sittings, alone or with your leadership team.',
  steps: [
    { part: 'PART 1 — PURPOSE', items: [
      { q: 'Who do we serve, and what do they need from us?', lines: 2 },
      { q: 'What is the problem we exist to solve?', lines: 2 },
      { q: 'Our purpose in one sentence:', lines: 2 },
    ] },
    { part: 'PART 2 — STRENGTH', items: [
      { pick: 'What does our organization already do particularly well?', n: '1', options: ['Leadership', 'Culture', 'Communication', 'Strategy', 'Decision-making', 'Collaboration', 'Execution', 'Innovation', 'People development', 'Customer relationships'] },
      { q: 'Where does this strength show up today?', lines: 2 },
      { q: 'What makes it valuable to the people we serve?', lines: 2 },
    ] },
    { part: 'PART 3 — IDENTITY', items: [
      { q: 'What do we want to be known for?', lines: 2 },
      { q: 'What do we do differently from others who do similar work?', lines: 2 },
      { q: 'How would a new partner describe us in a sentence?', lines: 2 },
    ] },
    { part: 'PART 4 — VALUES', items: [
      { pick: 'Which values should guide how we lead?', n: '3–5', options: ['Integrity', 'Accountability', 'Service', 'Excellence', 'Trust', 'Courage', 'Collaboration', 'Growth', 'Transparency', 'Stewardship'] },
      { q: 'What does your most important value look like in behavior?', lines: 2 },
      { q: 'What behavior would contradict it?', lines: 2 },
    ] },
    { part: 'PART 5 — DECISION PRINCIPLES', items: [
      { q: 'What do we always put first when priorities conflict?', lines: 2 },
      { q: 'What will we refuse to sacrifice for speed?', lines: 2 },
      { fill: ['Principle 1:', 'Principle 2:', 'Principle 3:'] },
    ] },
    { part: 'PART 6 — SCORE YOUR FOUNDATIONS', items: [{ scale: [
      'Our purpose is clear and written down.',
      'Our strength is named and we build from it.',
      'Our identity is consistent across teams.',
      'Our values are described in behavior.',
      'Our decision principles are used in real decisions.',
      'Our leaders share the same understanding of all five.',
    ] }] },
    { part: 'PART 7 — YOUR FOUNDATION CHARTER', items: [
      { fill: ['We exist to', 'We are strongest at', 'We are known for', 'We lead by', 'When priorities conflict we put first', 'We will review this charter every'] },
    ] },
    { part: 'PART 8 — CARRY IT FORWARD', items: [
      { q: 'Who needs to receive this charter first?', lines: 1 },
      { q: 'Where will it live so it is used, not filed?', lines: 1 },
      { q: 'What is one action we will take in the next 30 days?', lines: 2 },
      { q: 'Who will be accountable for keeping the foundations current?', lines: 1 },
    ] },
  ],
  principle: 'Foundations built in order hold what is built on them.',
  closing: 'With your foundations written and shared, the next phases, Infrastructure Planning & Management, Internal Operating Systems and Preservation, have something solid to build on.',
});
