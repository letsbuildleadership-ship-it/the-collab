# PROJECT_CHECKPOINT — Website Architecture, Marketing & Commerce

Branch: `claude/collab-website-architecture-l0haw2`

## Completed
### Stage 1 — Audit
- `pages/founders.html` exists, with 4 live Stripe links. It couldn't be reached from the Partnership and IP License pages.
- Header nav was inconsistent across pages. Footer "Navigate" lacked Partnerships.
- No broken internal links. All pages have title, description and canonical.

### Stage 2 — Navigation (all 17 pages: `index.html`, `pages/*.html`)
- **Header, identical everywhere:** Home · Founders Organization · .LLab · Partnerships · Think · Journal · About · More ▾ · Sign in.
- **More menu:** Creator™, Impact™, The IV Phases™, Omnidirectional Enterprise™, Free Tools, Free Journal Preview, .LLab Atelier™, Co.LLab+™, Technology · Legacy Ventures™.
- **Footer "Navigate":** Home, Founders Organization, .LLab, Partnerships, Think, Journal, About.
- **More menu behavior:** `css/base.css` (end of file) and `js/main.js`.
  - aria-expanded, Escape, outside click, focus-out.
  - Inline inside the mobile menu.
- **Founders ↔ Partnership separation** now applies to page content, not the shared nav. The tests strip the header and footer before checking.
- **Service worker:** cache bumped to `collab-shell-v7`.

### Stage 3 — Discovery → purchase
- **Think closing CTAs:** added .LLab and Partnerships.
- **Journal closing CTAs:** added Partnerships.
- **About closing CTAs:** added Partnerships.

### Stage 4 — Verification
- `npm test`: 128/128 pass.
- **Stale tests updated to match the current approved data in `content/pricing.json`:**
  - Tiers are `grant_scope: designated`, so the email says "every product included in your tier".
  - `engagement: null`, so no session is promised.
- **New test:** every page has exactly one nav, one More menu and one Sign in, with both Founders and Partnerships in the header nav.
- **Playwright, all 17 pages at 1440px and 390px:** menu opens inside the viewport, Escape closes it, no horizontal overflow, 0 JS errors.
- **Stripe links:** unchanged.

## Notes
- `scripts/build-ip-license.mjs` copies the header and footer from partnership.html, so a rebuild keeps the new nav.

## Remaining
- Netlify production deploy check after merge. There is no build step: the site is static and publish dir is `.`.

## Next action
Owner: review and merge. Then spot-check the live nav and checkout buttons.
