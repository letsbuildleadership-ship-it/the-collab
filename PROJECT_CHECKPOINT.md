# PROJECT_CHECKPOINT — Enterprise Structural Reorganization

Branch: `claude/collab-website-architecture-l0haw2`. PR #40 (unified nav) is merged and live.

## Owner direction (interview, stage 3)
- **Lead offer:** Partnerships.
- **Buyer:** people with capital who fear losing money and not being remembered.
- **Sales model:** self-serve and asynchronous, with no calls.
- **Framing:** the business, economic and geopolitical problem, with Co.LLab IP™ as the solution. No promises.
- **Home:** the full Partnership case, structured as enterprise-architecture marketing.
- **.LLab:** the marketing engine. It is the free front door on every page, and Partnerships is the lead purchase.

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

## Stage 3: Home rebuilt as the Partnership case (all copy reused from approved sources)
- **Hero:** Partnership promise, with "See the four tiers" and "Evaluate it free first" buttons.
- **01 · The market:** existing economic and geopolitical positioning.
- **02 · The risk inside the company:** IV Phases positioning problem.
- **03 · The solution:** Co.LLab IP™, the Partnership solution text, the four phases and the no-promise license line.
- **04 · Partnership tiers:** Stripe unchanged.
- **05 · What happens after you buy:** from Clear Terms.
- **06 · Evaluate it free.**
- **Mission.**
- **07 · The enterprise behind it:** IP ownership and license, plus Founders, .LLab and Creator.
- **Hero copy:** `content/home.json` matches the HTML.

## Stage 4: .LLab as the marketing engine
- **Home hero:** "See the four tiers" and "Join The .LLab free" (`#llab`).
- **Home 06 · The .LLab:** the original .LLab access grid is restored (Membership, Library Card, Journal, free Portal, 5 Stripe links). It adds the .LLab positioning line and notes that every Partnership tier includes .LLab.
- **Free resources:** follow the .LLab section.
- **Enterprise row:** Founders, Creator, Impact.
- **Every marketing page:** a `.llab-cta` "Enter The .LLab" band above the footer. Not on login, account, library or Home.

## Stage 5: Editorial / luxury photography system
- **Photos:** the owner's originals are baked into the site's green-and-cream duotone in `assets/img/editorial/` (`stage.jpg`, `scaffolding.jpg`, `storefront.jpg`). The transparent monogram is `assets/img/brand/mark-white.png`.
- **CSS:** end of `css/base.css`. Reusable parts:
  - `hero--lookbook`: a hero where the photo reads.
  - `.lookbook` (+ `--center`, `--scrim`): a full-bleed image with a caption.
  - `.tiles` / `.tile`: collection tiles.
  - `.storefront`: the brand mark as a shop front, with the invitation beside it.
  - `.monogram`: a divider.
- **Home:**
  - Hero is the scaffolding photo.
  - Concert lookbook interlude ("because nobody builds alone") before the Partnership tiers.
  - Monogram dividers.
  - .LLab section opens with the storefront image.
  - 07 is 4 image tiles: Founders, Creator, Impact, Technology.
- **Every marketing page:** the "Enter The .LLab" band is now a storefront (brand mark on scaffolding).
- **About:** the "reliable" band is a scaffolding lookbook.
- **Creator:** a concert lookbook after the positioning block.
- **Partnerships:** the hero is the scaffolding lookbook.
- **Phones:** captions sit below the image and tiles stack single-column.
- **SW cache:** `collab-shell-v9`.
- **Adding a photo:**
  1. Bake it to the duotone with the same recipe (autocontrast, then colorize black (10,22,14), mid (118,120,96), white (247,230,200)). Save in `assets/img/editorial/`.
  2. Use it as a `<figure class="lookbook">` or a `.tile`.
  3. Give it descriptive alt text.

## Stage 6: Photographs as a system
- **Tool:** `node scripts/add-photo.mjs <file> <slug> --phase N --alt "…"` (crop, blur third-party marks, duotone, resize, manifest).
- **Library:** `assets/img/editorial/` (+ `manifest.json`): scaffolding, stage, storefront, track, racks, booth.
- **The IV Phases™ in four photographs:** booth (I), scaffolding (II), racks (III), track (IV).
- **Placements:**
  - Phase tiles on Home and Partnerships.
  - Mission over the track.
  - Founders hero: booth.
  - Atelier hero: racks.
  - Journal hero: track.
- **Ads:** 11 concepts (02, 05 and 08 re-shot; 09–11 are phase ads).
- **Not used:** the blue animation frame. Strategy: `docs/marketing-strategy.md` §6–7.

## Verification
- `npm test`: 128/128 pass.
- Internal links: none broken.
- Stripe: the set of unique links across the site is identical before and after.
- Playwright, 17 pages × 2 widths: nav OK, no horizontal overflow, 0 JS errors.

## Open notes
- **Founders tier copy:** "Founding partnership for organizations." in `content/founders.json` is approved product copy. Left unchanged.
- **Think model copy:** an audience card says "Companies partnering with The Co.LLab™" under Founders. It's approved copy and left unchanged. Revise if the Founders wording should drop "partnering".

## Next action
Owner reviews the Home preview (screenshots), then says go live: merge via GitHub and verify the live site via Composio.
