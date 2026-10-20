import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'values-charter',
  outFile: 'values-charter.pdf',
  docTitle: '.LLab Mission & Values Charter™',
  cover: cover({
    title: '.LLab Mission & Values <strong>Charter</strong>™',
    subtitle: 'Put your mission, vision and values in writing as one charter your organization can lead from.',
    price: '$40',
  }),
};

export const contentHtml = foundationsDoc({
  title: '.LLab Mission & Values Charter™',
  tagline: 'Write down what you stand on, so everyone can stand on it with you.',
  intro: 'The Mission & Values Charter™ walks you through writing one page your organization can point to: why it exists, where it is going, and the values that guide how it leads. Complete it alone or with your leadership team.',
  steps: [
    { title: 'WHY WE EXIST', intro: 'Start with the work, not the wording.', items: [
      { q: 'Who do we serve, and what do they need from us?', lines: 2 },
      { q: 'What do we do that would be missed if we stopped?', lines: 2 },
      { q: 'Our mission in one sentence:', lines: 2 },
    ] },
    { title: 'WHERE WE ARE GOING', items: [
      { q: 'What does the organization look like in five years if it goes well?', lines: 2 },
      { q: 'What will be different for the people we serve?', lines: 2 },
      { q: 'Our vision in one sentence:', lines: 2 },
    ] },
    { title: 'WHAT WE VALUE', items: [
      { pick: 'Which values already show up in how we lead?', n: '3–5', options: ['Integrity', 'Accountability', 'Service', 'Excellence', 'Trust', 'Courage', 'Collaboration', 'Growth', 'Transparency', 'Stewardship'] },
      { note: 'Write your final values below, one per line.' },
      { fill: ['Value 1:', 'Value 2:', 'Value 3:', 'Value 4:'] },
    ] },
    { title: 'WHAT EACH VALUE LOOKS LIKE', intro: 'A value becomes infrastructure when people can see it in behavior.', items: [
      { q: 'Choose your most important value. What does it look like when we lead?', lines: 2 },
      { q: 'What behavior would contradict it?', lines: 2 },
      { q: 'What is one decision we made that reflected it?', lines: 2 },
    ] },
    { title: 'OUR CHARTER', intro: 'Complete the charter. This is the page you keep.', items: [
      { fill: ['We exist to', 'We are building toward', 'We lead by', 'We will not trade', 'We will review this charter every'] },
    ] },
    { title: 'PUT IT TO WORK', items: [
      { q: 'Who needs to see this charter first?', lines: 1 },
      { q: 'Where will it live so it is used, not filed?', lines: 1 },
      { q: 'What is one action we will take in the next 30 days because of it?', lines: 2 },
    ] },
  ],
  principle: 'A charter turns belief into something the organization can use.',
  closing: 'When mission, vision and values are written plainly, they can be taught, checked and handed on, and that is where infrastructure begins.',
});
