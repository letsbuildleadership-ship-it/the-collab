import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'foundations-assessment',
  outFile: 'foundations-assessment.pdf',
  docTitle: '.LLab Leadership Foundations Assessment™',
  cover: cover({
    title: '.LLab Leadership Foundations <strong>Assessment</strong>™',
    subtitle: 'A scored, thirty-statement assessment of how clear, shared and lived your foundations are.',
    price: '$200',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  title: '.LLab Leadership Foundations Assessment™',
  tagline: 'See what your foundations already support, and where to build next.',
  intro: 'The .LLab Leadership Foundations Assessment™ scores five areas of Phase I · Foundations: purpose, identity, values, direction and shared understanding. It is not a test of whether your organization is “good” or “bad.” It is a starting point for seeing what you have built and what to strengthen first.',
  steps: [
    { part: 'PART 1 — PURPOSE', items: [S([
      'We can state why the organization exists in one sentence.',
      'The people we serve would recognize that purpose in how we work.',
      'Our purpose has guided a hard decision in the past year.',
      'Our purpose is written down where people can find it.',
      'New people learn our purpose in their first weeks.',
      'Our leaders would describe our purpose in the same way.',
    ])] },
    { part: 'PART 2 — IDENTITY', items: [S([
      'We know what we are known for, and it matches what we want to be known for.',
      'We can name the strength we build from.',
      'We know what we do differently from others who do similar work.',
      'Our leadership style is described, not just assumed.',
      'Our identity shows up the same way across teams and settings.',
      'We could explain our identity to a new partner in two minutes.',
    ])] },
    { part: 'PART 3 — VALUES', items: [S([
      'Our values are written down and few enough to remember.',
      'Leaders can describe the behavior each value looks like.',
      'We have said no to something because of a value.',
      'Values are used when we hire, promote and give feedback.',
      'People can tell us when a value is not being lived.',
      'Our values are revisited on a regular schedule.',
    ])] },
    { part: 'PART 4 — DIRECTION', items: [S([
      'Our vision describes where we are going in plain words.',
      'Our priorities this year follow from our mission and vision.',
      'People understand how their work contributes to the direction.',
      'We know what we will not pursue.',
      'We review our direction at least once a year.',
      'Our direction would be clear to someone outside the organization.',
    ])] },
    { part: 'PART 5 — SHARED UNDERSTANDING', items: [S([
      'Our leaders agree on what matters most.',
      'Foundations are discussed in leadership meetings, not just at retreats.',
      'We write down the reasons for important decisions.',
      'Someone is accountable for keeping our foundations current.',
      'If a founder or key leader left, our foundations would still be clear.',
      'We could hand our foundations to a successor in writing.',
    ])] },
    { title: 'READ YOUR RESULTS', intro: 'Add your scores for each part (maximum 30 per part).', items: [
      { fill: ['Purpose total:', 'Identity total:', 'Values total:', 'Direction total:', 'Shared understanding total:'] },
      { q: 'Which part scored highest? What explains it?', lines: 2 },
      { q: 'Which part scored lowest? What is one reason?', lines: 2 },
    ] },
    { title: 'YOUR NEXT MOVE', items: [
      { q: 'What is the one foundation to strengthen first?', lines: 1 },
      { q: 'What action will you take in the next 30 days?', lines: 2 },
      { q: 'Who needs to be involved?', lines: 1 },
      { q: 'How will you know it worked?', lines: 2 },
    ] },
  ],
  principle: 'You cannot strengthen what you have not seen.',
  closing: 'Repeat the assessment after six months. The difference between the two scores shows what your work has built.',
});
