# PROJECT_CHECKPOINT — Enterprise Structural Reorganization

Branch: `claude/collab-website-architecture-l0haw2`. PR #40 (unified nav) is merged and live.

## Owner direction
**Partnerships is the lead offer.** Founders Organization is a supporting offer.

## Architecture
| Layer | Pages |
|---|---|
| Enterprise | Home, About |
| Core framework + IP | Think (`#model`: Omnidirectional Enterprise™ + The IV Phases™) |
| Offerings | Partnerships (lead), Founders Organization, .LLab, Creator™, Impact™, Technology · Legacy Ventures™, Atelier™, Co.LLab+™ |
| Resources | Journal, Free Journal Preview, Free Tools (`products.html#phases`) |

## Completed (stage 2, this branch)
1. **Framework moved from About to Think.**
   - The OE model and IV Phases section moved from `about.html` to `think.html#model`.
   - About keeps a short pointer to it.
   - All `about.html#model` / `#four-phases` links now point to Think: menus, footers, closing maps, scripts.
   - The CMS fields `model_*`, `ethics_body` and `audiences` moved from `about.json` to `think.json` and `admin/config.yml`.
   - About and Think SEO titles updated.
   - Think's duplicate closing mini-map removed.
2. **Partnership-led site.**
   - Menu and footer order: Partnerships → Founders → .LLab.
   - Site banner (`content/site.json` and the static fallback) uses the Partnership page's approved banner text.
   - The Founders page keeps its own static Founders banner.
   - "Go deeper" button rows on Think, Journal and About lead with Partnerships.
3. **Home order:** hero → positioning → mission → OE → IV Phases → Partnership tiers (featured) → Choose your path (`#paths`).
   - Hero buttons: "Choose a partnership" and "Choose your path" (`content/home.json`).
   - The duplicate .LLab and Founders price grids were removed. Those checkouts remain on their own pages.
4. **Partner IP** (`#partner-ip`) moved from .LLab to Partnerships, between Included and Terms.
5. **Founders eyebrows:** "Founders Organization · BUILD" and "The model" (`content/founders.json`).
6. **Journal order:** intro → Recent entries → How an idea becomes infrastructure → Subscribe → Go deeper.
7. **CSS:** `#paths` card styles (no mobile overflow).
8. **Service worker:** cache `collab-shell-v8`.

## Verification
- `npm test`: 128/128 pass.
- Internal links: none broken.
- Stripe: the set of unique links across the site is identical before and after.
- Playwright, 17 pages × 2 widths: nav OK, no horizontal overflow, 0 JS errors.

## Open notes
- **Founders tier copy:** "Founding partnership for organizations." in `content/founders.json` is approved product copy. Left unchanged.
- **Think model copy:** an audience card says "Companies partnering with The Co.LLab™" under Founders. It's approved copy and left unchanged. Revise if the Founders wording should drop "partnering".

## Next action
Owner approves go-live, then merge the PR and verify the live site via Composio.
