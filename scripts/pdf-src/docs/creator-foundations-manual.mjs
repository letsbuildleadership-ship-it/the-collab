import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'creator-foundations-manual',
  outFile: 'creator-foundations-manual.pdf',
  docTitle: '.LLab Creator Foundations Manual™',
  cover: cover({
    title: '.LLab Creator Foundations <strong>Manual</strong>™',
    subtitle: 'The full Phase I build for a creative practice: voice, practice, audience, offer and a foundation statement.',
    price: '$300',
    footerRight: '.LLab Creators™',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  "title": ".LLab Creator Foundations Manual™",
  "tagline": "Build the foundation under your creative practice once, in order, and write it down.",
  "intro": "The Creator Foundations Manual™ is the complete guided build for Phase I · Foundations for creators. Work through its parts in order over several sittings: what you make, your voice, your values, your audience and offer, and your foundation statement.",
  "steps": [
    {
      "part": "PART 1 — WHAT I MAKE",
      "items": [
        {
          "q": "What do I make, in the plainest words?",
          "lines": 2
        },
        {
          "q": "Which mediums and methods do I come back to?",
          "lines": 2
        },
        {
          "q": "What is the thread that connects my work?",
          "lines": 2
        }
      ]
    },
    {
      "part": "PART 2 — MY VOICE",
      "items": [
        {
          "pick": "Which words describe the voice of my work?",
          "n": "3–5",
          "options": [
            "Direct",
            "Warm",
            "Precise",
            "Playful",
            "Rigorous",
            "Raw",
            "Quiet",
            "Bold",
            "Handmade",
            "Polished"
          ]
        },
        {
          "q": "What does my work sound or look like when it is most itself?",
          "lines": 2
        }
      ]
    },
    {
      "part": "PART 3 — WHAT I STAND FOR",
      "items": [
        {
          "q": "What does my work stand for?",
          "lines": 2
        },
        {
          "q": "What will I not make or trade?",
          "lines": 2
        }
      ]
    },
    {
      "part": "PART 4 — MY PRACTICE",
      "items": [
        {
          "q": "How does a normal week of making run?",
          "lines": 2
        },
        {
          "q": "What depends only on me?",
          "lines": 2
        },
        {
          "q": "What will I write down first?",
          "lines": 1
        }
      ]
    },
    {
      "part": "PART 5 — MY AUDIENCE AND OFFER",
      "items": [
        {
          "q": "Who is my work for, and what do they need?",
          "lines": 2
        },
        {
          "q": "What do I offer them, in one sentence?",
          "lines": 2
        },
        {
          "q": "How can someone support the work in one clear step?",
          "lines": 2
        }
      ]
    },
    {
      "part": "PART 6 — SCORE MY FOUNDATIONS",
      "items": [
        {
          scale: [
            "My voice is named and written down.",
            "My values and limits are clear.",
            "My practice runs without depending only on me.",
            "My audience is named.",
            "My offer is stated and matched to my audience.",
            "My rights, records and credits are in order."
          ]
        }
      ]
    },
    {
      "part": "PART 7 — MY FOUNDATION STATEMENT",
      "items": [
        {
          "fill": [
            "My work is",
            "It sounds like",
            "It stands for",
            "It is for",
            "I offer",
            "I will not trade",
            "I will review this every"
          ]
        }
      ]
    },
    {
      "part": "PART 8 — CARRY IT FORWARD",
      "items": [
        {
          "q": "Who needs to see this statement first?",
          "lines": 1
        },
        {
          "q": "Where will it live so it is used, not filed?",
          "lines": 1
        },
        {
          "q": "What is one action I will take in the next 30 days?",
          "lines": 2
        },
        {
          "q": "Who would carry the work forward?",
          "lines": 1
        }
      ]
    }
  ],
  "principle": "A foundation built in order holds what is built on it.",
  "closing": "With your foundation written, the next phases, Infrastructure Planning & Management, Internal Operating Systems and Preservation, have something solid to build on."
});
