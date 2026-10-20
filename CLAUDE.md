# The Co.LLab™ — project brief (read this instead of re-auditing)
Static site + Netlify Functions. Live: https://wearethellab.netlify.app (Netlify publishes `main`, no build step). Strategy: `STRATEGY.md`. State: `PROJECT_CHECKPOINT.md`.

## Commands
`npm test` (189 tests) · `npm run photos` (bulk photo intake) · `npm run gallery` (Lookbook page parked; `--force` to rebuild) · `node scripts/build-ads.mjs` · `node scripts/build-partnership-page.mjs` (tier tables from pricing) · `node scripts/build-ip-license.mjs` · `node scripts/build-hub.mjs` (all-products hub from pricing) · `node scripts/generate-pdfs.mjs <key>` (product PDFs) · `node scripts/build-quests.mjs` (free-tool quests) · `node scripts/build-paid-quests.mjs` (21 paid workbook quests, needs pdftotext) · `node scripts/block-paid-files.mjs` (run after adding any paid PDF: blocks it from public download). New product with no Stripe link yet: add it to pricing.json with `stripe_pending: true` (hub shows "Available soon"); paste `stripe_price_id` + `payment_link` and delete the flag to sell it

## Map
`index.html` Home · `pages/*.html` (partnership, founders, products=.LLab, think [framework], journal, about, creator, impact, atelier, community, technology,  · `content/*.json` (CMS copy, `pricing.json` = prices/Stripe) · `css/base.css` (all components at the end) · `js/main.js` · `netlify/functions/` · `assets/img/editorial/` (photos + `manifest.json`) · `marketing/ads/` (generated).
*generated: lookbook (build-gallery), ip-license, partnership tier tables.

## Members & owner tools
Owner pages are private: `/admin/*` is served by `netlify/functions/admin-page.js` only to a signed-in owner session (token -> signed cookie) and looks like a missing page to everyone else; the owner signs in at the private entry address `/admin/<ADMIN_ENTRY>/<page>` (ADMIN_ENTRY lives in Netlify env, never in code). Never add static admin files outside that route.
Free vs paid: the free-tool PDFs are open to everyone (no account). A free account works the quests on the free tools (and open quests) and gets the Infrastructure Snapshot™ (`previewFor`) that prompts Membership; paid IP, its quests, the Infrastructure Analysis™ (full analysis, outcomes, PDF report) is Membership (or owning that product). Portal quests (`content/quests`, `netlify/functions/quest.js`) · .LLab Collaborating Companies (`pages/collaborating-companies.html`, part of a license/Membership, owner-approved) · owner pages `admin/customers.html`, `admin/ip-feedback.html` (IP review: feedback + ideas + weekly email, nothing left undecided) · `admin/ip-analysis.html` (review all IP, run the analysis, decide on each recommendation), `admin/collaborating-companies.html`.

## Page pattern (luxury / shopping-site style)
Header → **model ribbon** (the only element repeated site-wide, plus the Home/Think/Partnership model) → hero → the page's own main points + products → **Continue** strip (2 links). **Each product/idea lives on exactly one page; other pages link, never repeat.** Home = the book cover: hero + contents (8 chapters, each a real page with 1–3 sub-links) + back matter; long copy lives on the chapter pages. `pages/all-products.html` is the product hub (every product, one line, link only; generated). Removed copy is archived in `docs/archive/removed-blocks.html` (404 on the live site). Sticky mobile buy button on Home/Partnerships/Founders/.LLab.

## Rules
- **Every marketing tactic (ad, page, offer, email, funnel step) is modeled under Omnidirectional Enterprise (node) × The IV Phases (1–4).** Tag new ads in `scripts/build-ads.mjs` (`TAG`); a test enforces it. See `STRATEGY.md` §2.
- Approved copy and prices are fixed: no invented claims, testimonials, scarcity or earnings. Prices/Stripe links only via `content/pricing.json`.
- Founders, .LLab, Partnerships stay distinct. Founders ≠ membership. Partnership + Founders pages don't cross-promote in content (shared header/footer only).
- Nav is identical on every page (Home · Partnerships · Founders · .LLab · Think · Journal · About · More). Edit all pages if it changes.
- Text must stay AA-contrast; smallest text is bold white; text on photos sits on a frosted panel (`.lookbook`, `.tile`, `hero--lookbook`).
- New photos: `npm run photos` (JPGs in git-ignored `photos/inbox/`; blur third-party logos with `add-photo.mjs --blur`).

## Working cheaply
Don't re-inspect the repo: use this map. Edit with scripts/regex in batches; verify with `npm test` + one Playwright pass (pages × 1440/390: overflow, console errors) + Stripe link set unchanged. Deploy = merge PR to `main`, then check the live site.
