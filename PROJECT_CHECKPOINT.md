# PROJECT_CHECKPOINT — Website Architecture, Marketing & Commerce

Branch: `claude/collab-website-architecture-l0haw2`

## Completed
- **Audit**
  - `pages/founders.html` exists, with 4 live Stripe links. Its problem was nav reachability.
  - Header nav was inconsistent across pages. Footer "Navigate" lacked Partnerships.
  - No broken internal links or anchors. All pages have title, description and canonical.
- **Primary nav unified on all 17 pages** (`index.html`, `pages/*.html`):
  - Order: Home · Founders Organization · .LLab · Partnerships · Think · Journal · About · More ▾ · Sign in.
  - More menu: Creator™, Impact™, The IV Phases™, Omnidirectional Enterprise™, Free Tools, Free Journal Preview, .LLab Atelier™, Co.LLab+™, Technology · Legacy Ventures™.
  - The More links reuse the existing footer targets.
- **Approved Founders ↔ Partnership separation kept** (enforced by `test/partnership.test.js`):
  - `founders.html` omits Partnerships.
  - `partnership.html` and `ip-license.html` omit Founders Organization.
- **Footer:** "Navigate" now includes Partnerships, except on founders.html.
- **More menu behavior:** `css/base.css` (end of file) and `js/main.js`.
  - Accessible button with aria-expanded, Escape to close, closes on click outside or focus leaving.
  - Shows inline inside the mobile menu.
- **Service worker:** cache bumped to `collab-shell-v7`.
- **Verified**
  - Playwright at 1440px and 390px on 8 pages: menu opens inside the viewport, Escape closes it, no horizontal overflow, 0 JS errors.
  - Stripe links unchanged.
  - `npm test`: 127/128 pass.

## Blockers / notes
- `test/purchase-email.test.js:61` fails, and was failing before this work.
  - It expects the phrase "complete designated Co.LLab™ IP portfolio" in the partnership confirmation email.
  - The fix needs a decision on commercial copy. Not changed.
- `scripts/build-ip-license.mjs` copies the header from partnership.html.
  - Rerunning it keeps the new nav, minus Founders. That is consistent with the separation rule.

## Remaining (optional, next stage)
- Internal linking from Think and Journal to purchase pages (.LLab, Founders), without rewriting approved copy.
- Production deploy check on Netlify after merge.

## Next action
Owner: review the branch and resolve the purchase-email copy question.
