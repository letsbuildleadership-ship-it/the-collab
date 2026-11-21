# Hartwell & Rafael Enterprise — hartwellrafael.com

Single-page static landing site, deployed to the Netlify project `hartwellrafael`.
Lives here temporarily, separate from The Co.LLab site (nothing in the parent repo
references it, and it is not part of wearethellab.com). Move it to its own repository
when one exists.

- `index.html` — the page (About, Mission & Vision, Omnidirectional Enterprise,
  Four Phases, Services, Booking, Contact)
- `styles.css`, `main.js` — design system + menu, reveal, form submit
- Booking: Calendly event type "Hartwell & Rafael Enterprise — Conversation"
  (30 min, Google Meet, live availability, email confirmation)
- Contact form: Netlify Forms (`contact`), submissions in the Netlify dashboard

Deploy: from this folder, `netlify deploy --prod --dir .` (no build step).
