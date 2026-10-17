# The Co.LLab™ — project brief (read this instead of re-auditing)
Static site + Netlify Functions. Live: https://wearethellab.netlify.app (Netlify publishes `main`, no build step). Strategy: `STRATEGY.md`. State: `PROJECT_CHECKPOINT.md`.

## Commands
`npm test` (131 tests) · `npm run photos` (bulk photo intake) · `npm run gallery` · `node scripts/build-ads.mjs` · `node scripts/build-partnership-page.mjs` (tier tables from pricing) · `node scripts/build-ip-license.mjs`

## Map
`index.html` Home · `pages/*.html` (partnership, founders, products=.LLab, think [framework], journal, about, creator, impact, atelier, community, technology, lookbook*) · `content/*.json` (CMS copy, `pricing.json` = prices/Stripe) · `css/base.css` (all components at the end) · `js/main.js` · `netlify/functions/` · `assets/img/editorial/` (photos + `manifest.json`) · `marketing/ads/` (generated).
*generated: lookbook (build-gallery), ip-license, partnership tier tables.

## Rules
- Approved copy and prices are fixed: no invented claims, testimonials, scarcity or earnings. Prices/Stripe links only via `content/pricing.json`.
- Founders, .LLab, Partnerships stay distinct. Founders ≠ membership. Partnership + Founders pages don't cross-promote in content (shared header/footer only).
- Nav is identical on every page (Home · Partnerships · Founders · .LLab · Think · Journal · About · More). Edit all pages if it changes.
- Text must stay AA-contrast; smallest text is bold white; text on photos sits on a frosted panel (`.lookbook`, `.tile`, `hero--lookbook`).
- New photos: `npm run photos` (JPGs in git-ignored `photos/inbox/`; blur third-party logos with `add-photo.mjs --blur`).

## Working cheaply
Don't re-inspect the repo: use this map. Edit with scripts/regex in batches; verify with `npm test` + one Playwright pass (pages × 1440/390: overflow, console errors) + Stripe link set unchanged. Deploy = merge PR to `main`, then check the live site.
