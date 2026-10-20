import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'creator-foundations-assessment',
  outFile: 'creator-foundations-assessment.pdf',
  docTitle: '.LLab Creator Foundations Assessment™',
  cover: cover({
    title: '.LLab Creator Foundations <strong>Assessment</strong>™',
    subtitle: 'A scored, thirty-statement assessment of the foundations under a creative practice.',
    price: '$200',
    footerRight: '.LLab Creators™',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  "title": ".LLab Creator Foundations Assessment™",
  "tagline": "See what your creative foundations already support, and where to build next.",
  "intro": "The Creator Foundations Assessment™ scores five areas of Phase I · Foundations for creators: voice, practice, audience, offer and ownership. It is a starting point for seeing what you have built, not a test of your work.",
  "steps": [
    {
      "part": "PART 1 — VOICE",
      "items": [
        {
          scale: [
            "I can describe the voice of my work in a few words.",
            "People recognize my work before they see my name.",
            "I know what my work stands for.",
            "I know what I will not make or trade.",
            "My voice is written down, not just felt.",
            "My voice stays consistent across everything I share."
          ]
        }
      ]
    },
    {
      "part": "PART 2 — PRACTICE",
      "items": [
        {
          scale: [
            "I know how a normal week of making runs.",
            "My tools, materials and space are in order.",
            "I keep records of my work.",
            "I could describe my process to a collaborator.",
            "The practice does not stop when I am away.",
            "I protect time for the work itself."
          ]
        }
      ]
    },
    {
      "part": "PART 3 — AUDIENCE",
      "items": [
        {
          scale: [
            "I can name who my work is for.",
            "I know what that audience needs from me.",
            "I know where they find and follow my work.",
            "I hear from them regularly.",
            "I can describe them in a sentence.",
            "My audience is growing in a direction I chose."
          ]
        }
      ]
    },
    {
      "part": "PART 4 — OFFER",
      "items": [
        {
          scale: [
            "I can state what I offer in one sentence.",
            "Each offer is matched to a specific audience.",
            "People can support my work in one clear step.",
            "I know what I will not offer.",
            "My offers are written down with their terms.",
            "I review my offers at least once a year."
          ]
        }
      ]
    },
    {
      "part": "PART 5 — OWNERSHIP",
      "items": [
        {
          scale: [
            "I know which rights I hold in my work.",
            "My agreements are written down.",
            "My work and records are backed up in more than one place.",
            "I know who would manage my work if I could not.",
            "I credit and document collaborators.",
            "My work could be handed on from my records alone."
          ]
        }
      ]
    },
    {
      "title": "READ YOUR RESULTS",
      "intro": "Add your scores for each part (maximum 30 per part).",
      "items": [
        {
          "fill": [
            "Voice total:",
            "Practice total:",
            "Audience total:",
            "Offer total:",
            "Ownership total:"
          ]
        },
        {
          "q": "Which part scored highest? What explains it?",
          "lines": 2
        },
        {
          "q": "Which part scored lowest? What is one reason?",
          "lines": 2
        }
      ]
    },
    {
      "title": "YOUR NEXT MOVE",
      "items": [
        {
          "q": "What is the one foundation to strengthen first?",
          "lines": 1
        },
        {
          "q": "What action will you take in the next 30 days?",
          "lines": 2
        },
        {
          "q": "Who needs to be involved?",
          "lines": 1
        },
        {
          "q": "How will you know it worked?",
          "lines": 2
        }
      ]
    }
  ],
  "principle": "You cannot strengthen what you have not seen.",
  "closing": "Repeat the assessment after six months. The difference between the two scores shows what your work has built."
});
