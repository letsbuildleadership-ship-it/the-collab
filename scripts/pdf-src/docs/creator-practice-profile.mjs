import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'creator-practice-profile',
  outFile: 'creator-practice-profile.pdf',
  docTitle: '.LLab Creator Practice Profile™',
  cover: cover({
    title: '.LLab Creator Practice <strong>Profile</strong>™',
    subtitle: 'Describe how your creative practice runs today and where it depends on you.',
    price: '$75',
    footerRight: '.LLab Creators™',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  "title": ".LLab Creator Practice Profile™",
  "tagline": "See your practice as a system, not just a body of work.",
  "intro": "The Creator Practice Profile™ helps you describe the rhythms, tools and people behind your work, and find what only lives in your head.",
  "steps": [
    {
      "title": "HOW MY PRACTICE RUNS",
      "items": [
        {
          "q": "What does a normal week of making look like?",
          "lines": 2
        },
        {
          "q": "Which tools, materials and spaces does the practice depend on?",
          "lines": 2
        },
        {
          "q": "Who else helps the work happen?",
          "lines": 1
        }
      ]
    },
    {
      "title": "WHAT I ALREADY DO WELL",
      "items": [
        {
          "pick": "Where is my practice strongest?",
          "n": "1–3",
          "options": [
            "Making",
            "Finishing",
            "Teaching",
            "Collaborating",
            "Showing the work",
            "Selling the work",
            "Documenting the work",
            "Staying consistent"
          ]
        },
        {
          "q": "Why does that strength matter to the work?",
          "lines": 2
        }
      ]
    },
    {
      "title": "WHERE THE PRACTICE DEPENDS ON ME",
      "items": [
        {
          "q": "What would stop if I could not work for a month?",
          "lines": 2
        },
        {
          "q": "What do I know that is not written down anywhere?",
          "lines": 2
        },
        {
          "q": "What is one thing I could hand to someone else this quarter?",
          "lines": 1
        }
      ]
    },
    {
      "title": "WHAT THE WORK LEAVES BEHIND",
      "items": [
        {
          "q": "Which work, records and rights would I want protected?",
          "lines": 2
        },
        {
          "q": "Who would carry the practice or the body of work forward?",
          "lines": 1
        }
      ]
    },
    {
      "title": "MY PRACTICE STATEMENT",
      "items": [
        {
          "fill": [
            "My practice is strongest in",
            "It depends on me for",
            "I will write down",
            "I want the work to outlast me through"
          ]
        },
        {
          "q": "One action I will take in the next 30 days:",
          "lines": 2
        }
      ]
    }
  ],
  "principle": "A practice that is described can be strengthened.",
  "closing": "Seeing the practice as a system shows where to build, document and share it."
});
