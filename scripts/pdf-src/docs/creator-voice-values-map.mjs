import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'creator-voice-values-map',
  outFile: 'creator-voice-values-map.pdf',
  docTitle: '.LLab Creator Voice & Values Map™',
  cover: cover({
    title: '.LLab Creator Voice &amp; Values <strong>Map</strong>™',
    subtitle: 'Name the voice in your work and the values you will not trade.',
    price: '$40',
    footerRight: '.LLab Creators™',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  "title": ".LLab Creator Voice & Values Map™",
  "tagline": "A creative practice is easier to build around once its voice is named.",
  "intro": "The Creator Voice & Values Map™ helps you describe how your work sounds and looks, what it stands for, and what you will not make or trade, so the rest of your infrastructure can be built around something specific.",
  "steps": [
    {
      "title": "WHAT I MAKE",
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
          "q": "What do people recognize in my work before they see my name?",
          "lines": 2
        }
      ]
    },
    {
      "title": "MY VOICE",
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
      "title": "WHAT MY WORK STANDS FOR",
      "items": [
        {
          "q": "What do I believe about people, craft and culture that shows up in what I make?",
          "lines": 2
        },
        {
          "q": "What do I want my work to leave people with?",
          "lines": 2
        }
      ]
    },
    {
      "title": "WHAT I WILL NOT MAKE OR TRADE",
      "items": [
        {
          "q": "What work, commissions or compromises will I turn down?",
          "lines": 2
        },
        {
          "q": "What would I never trade for attention, money or approval?",
          "lines": 2
        }
      ]
    },
    {
      "title": "MY VOICE AND VALUES STATEMENT",
      "items": [
        {
          "fill": [
            "My work sounds like",
            "It stands for",
            "I will not trade",
            "I want people to leave with"
          ]
        },
        {
          "q": "One action I will take in the next 30 days:",
          "lines": 2
        }
      ]
    }
  ],
  "principle": "A named voice can be repeated, protected and handed on.",
  "closing": "When your voice and values are written down, collaborators, buyers and successors can recognize what to keep."
});
