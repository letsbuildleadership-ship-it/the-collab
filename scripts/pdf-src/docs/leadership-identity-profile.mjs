import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'leadership-identity-profile',
  outFile: 'leadership-identity-profile.pdf',
  docTitle: 'Leadership Identity Profile™',
  cover: cover({
    title: 'Leadership Identity <strong>Profile</strong>™',
    subtitle: 'Name how you lead, what you stand for and what you will not trade.',
    price: '$75',
  }),
};

export const contentHtml = foundationsDoc({
  title: 'Leadership Identity Profile™',
  tagline: 'Know who you are as a leader before you build anything around it.',
  intro: 'The Leadership Identity Profile™ helps one leader put a clear description of their leadership on paper: strengths, convictions, boundaries and the legacy they want their leadership to leave. It is the personal foundation that organizational infrastructure is built on.',
  steps: [
    { title: 'HOW I LEAD TODAY', items: [
      { pick: 'Which describe how people experience your leadership?', n: '3–5', options: ['Clear direction', 'Steady under pressure', 'Relational', 'Strategic', 'Hands-on', 'Visionary', 'Disciplined', 'Encouraging', 'Decisive'] },
      { q: 'What do people come to you for?', lines: 2 },
      { q: 'What do you do so naturally you rarely name it?', lines: 2 },
    ] },
    { title: 'WHAT I STAND FOR', items: [
      { q: 'What do you believe about people and work that shapes your decisions?', lines: 2 },
      { q: 'What cause or purpose would you keep working on even when it was hard?', lines: 2 },
      { q: 'Which of your convictions is the least negotiable?', lines: 2 },
    ] },
    { title: 'WHAT I WILL NOT TRADE', items: [
      { q: 'What lines will you not cross for results, money or approval?', lines: 2 },
      { q: 'When did you last hold one of those lines, and what did it cost or protect?', lines: 2 },
    ] },
    { title: 'WHERE MY LEADERSHIP DEPENDS ON ME', intro: 'Strength that lives only in one person is not yet infrastructure.', items: [
      { q: 'What would stop working if you were unavailable for a month?', lines: 2 },
      { q: 'What do you hold in your head that others need written down?', lines: 2 },
      { q: 'What is one thing you could hand to someone else this quarter?', lines: 1 },
    ] },
    { title: 'THE LEGACY I WANT FROM MY LEADERSHIP', items: [
      { q: 'What do you want people to say your leadership made possible?', lines: 2 },
      { q: 'Who is likely to carry this work forward?', lines: 1 },
      { q: 'What would they need from you to do that well?', lines: 2 },
    ] },
    { title: 'MY LEADERSHIP IDENTITY STATEMENT', items: [
      { fill: ['I lead by', 'I stand for', 'I will not trade', 'My leadership is strongest when', 'I want my leadership to leave behind'] },
      { q: 'One action I will take in the next 30 days:', lines: 2 },
    ] },
  ],
  principle: 'Infrastructure starts with a leader who can say who they are.',
  closing: 'A leader who can describe their identity clearly can build systems that carry it, and people who can carry it forward.',
});
