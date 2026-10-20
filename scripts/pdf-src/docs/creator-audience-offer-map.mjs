import { foundationsDoc, cover } from './_foundations-kit.mjs';

export const meta = {
  key: 'creator-audience-offer-map',
  outFile: 'creator-audience-offer-map.pdf',
  docTitle: '.LLab Creator Audience & Offer Map™',
  cover: cover({
    title: '.LLab Creator Audience &amp; Offer <strong>Map</strong>™',
    subtitle: 'Connect who your work is for with what you offer them.',
    price: '$125',
    footerRight: '.LLab Creators™',
  }),
};

const S = (arr) => ({ scale: arr });

export const contentHtml = foundationsDoc({
  "title": ".LLab Creator Audience & Offer Map™",
  "tagline": "Know who the work is for before you decide how to offer it.",
  "intro": "The Creator Audience & Offer Map™ helps you define the people your work serves and match each one to something specific you can offer.",
  "steps": [
    {
      "title": "WHO MY WORK IS FOR",
      "items": [
        {
          "q": "Who responds most strongly to my work?",
          "lines": 2
        },
        {
          "q": "What do they need, want or care about that my work speaks to?",
          "lines": 2
        },
        {
          "q": "Where do they already gather, look or listen?",
          "lines": 2
        }
      ]
    },
    {
      "title": "WHAT I OFFER TODAY",
      "items": [
        {
          "pick": "Which of these do I already offer?",
          "n": "any",
          "options": [
            "Original work",
            "Prints or editions",
            "Commissions",
            "Lessons or workshops",
            "Performances or events",
            "Licensing",
            "Collaborations",
            "Memberships or subscriptions"
          ]
        },
        {
          "q": "Which one do people ask for most?",
          "lines": 1
        }
      ]
    },
    {
      "title": "MATCH EACH AUDIENCE TO AN OFFER",
      "items": [
        {
          "q": "Audience 1 and the offer that fits them:",
          "lines": 2
        },
        {
          "q": "Audience 2 and the offer that fits them:",
          "lines": 2
        },
        {
          "q": "Audience 3 and the offer that fits them:",
          "lines": 2
        }
      ]
    },
    {
      "title": "HOW THEY FIND AND SUPPORT THE WORK",
      "items": [
        {
          "q": "How do people find me today?",
          "lines": 2
        },
        {
          "q": "How can someone support the work in one clear step?",
          "lines": 2
        },
        {
          "q": "What do I not want to offer, even if asked?",
          "lines": 2
        }
      ]
    },
    {
      "title": "MY AUDIENCE AND OFFER STATEMENT",
      "items": [
        {
          "fill": [
            "My work is for",
            "They need",
            "I offer",
            "They can support it by"
          ]
        },
        {
          "q": "One action I will take in the next 30 days:",
          "lines": 2
        }
      ]
    }
  ],
  "principle": "An offer is clearest when it is built for a specific person.",
  "closing": "When audience and offer are matched, each next step, from a page to a price, has something to stand on."
});
