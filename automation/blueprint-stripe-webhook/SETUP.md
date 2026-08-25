# The Blueprint™ — Stripe → Apps Script webhook

Delivers the six Blueprint™ PDFs automatically when someone buys one of the
six live Stripe products for that line. This isn't part of the static site
build — the site (this repo) only links out to Stripe Checkout / Payment
Links. Delivery after purchase happens in the Google Apps Script project
bound to the spreadsheet that already runs the rest of the membership
automation. `StripeWebhook.gs` in this folder is that Apps Script code,
kept here in git so it's reviewable and versioned.

## What it does

1. Stripe calls the webhook URL on `checkout.session.completed`.
2. The script re-fetches the event from Stripe's API by event id, using a
   restricted secret key, to confirm the event is real (see the long comment
   at the top of `StripeWebhook.gs` for why this is used instead of
   `Stripe-Signature` header verification — Apps Script web apps can't read
   arbitrary request headers, so the header-based check Stripe recommends
   isn't implementable here).
3. It looks up the line item's price ID against the six Blueprint price IDs.
4. It shares the matching PDF with the buyer's email and sends them the
   Drive link.
5. Every step (sent, no-match, rejected, error) is logged to the `EVENT_LOG`
   tab via the existing `logEvent()` in `Code.gs`.

## Price ID → PDF map → Payment Link (live Stripe account)

| Product | Price ID | Drive file | Payment Link |
|---|---|---|---|
| Welcome (Issue 00) — $300 | `price_1U7aSuAK6n3ctuR9l90HwyP5` | `13svjVaXqycmgYvnmWycNAssHFzid6yDE` | https://buy.stripe.com/3cI4gy2Iu1JH15h4KG9ws0O |
| Phase One: Foundations (Issue 01) — $300 | `price_1U7aTAAK6n3ctuR99S4YmR56` | `1QZiOH2bdV2iUSsBYycDp9496NpxAuCjg` | https://buy.stripe.com/eVqdR86YK4VT5lx3GC9ws0P |
| Phase Two: Infrastructure Planning (Issue 02) — $300 | `price_1U7aTPAK6n3ctuR97GWx9dmW` | `1So0FU_7PJVieoCTEmgyAo58rYFClKLue` | https://buy.stripe.com/4gMbJ05UGbkh6pBa509ws0Q |
| Phase Three: Internal Operating Systems (Issue 03) — $300 | `price_1U7aTdAK6n3ctuR9TlxJ4Mzf` | `13s-RKX2R2aNhpAEa72NYI7c4E-O3hewW` | https://buy.stripe.com/bJe00ibf00FD4htgto9ws0R |
| Phase Four: Preservation (Issue 04) — $300 | `price_1U7aTsAK6n3ctuR90SycsLmg` | `1hFznYubGFbZPMxNt6hb9Wg_z92BNEOCY` | https://buy.stripe.com/14AcN4dn8fAxcNZ90W9ws0S |
| Complete Edition (all 5 issues) — $900 | `price_1U7aU7AK6n3ctuR9rxOzHC0A` | `1tHCZGOSlyXrepAyjqDjtW8WOQPCZeaO0` | https://buy.stripe.com/dRm3cucj45ZX9BN5OK9ws0T |

These six live Payment Links were created directly against the Stripe
account and are wired into `content/products.json` / `pages/products.html`
(new "Blueprint™ Magazine Series" section). They are **live** — a real
purchase through any of them charges a real card. Each redirects to
Stripe's default hosted confirmation page after payment; the webhook below
is what actually delivers the PDF.

## One-time setup

1. Open the "The Co.LLab Infrastructure System" Apps Script project
   (bound to spreadsheet `1aVZm8Xtfd2eDbqCfEMwF-p4aWqOHENPdDUoqxxFxF7A`).
2. Add a new script file, paste in `StripeWebhook.gs`.
3. **Project Settings → Script Properties**, add:
   - `STRIPE_SECRET_KEY` — a **restricted** Stripe key with only
     `Events: Read` and `Checkout Sessions: Read`. Never use the full
     secret key here.
   - `WEBHOOK_SHARED_SECRET` — any random string you generate yourself.
4. **Deploy → New deployment → Web app.** Execute as "Me", access "Anyone"
   (Stripe can't authenticate as you, so it must be publicly reachable —
   the shared secret plus the event-verification step are what keep it
   safe, not deployment auth).
5. Copy the deployment URL and append `?key=<WEBHOOK_SHARED_SECRET>` to it.
6. In the Stripe Dashboard, add a webhook endpoint pointing at that URL,
   subscribed to `checkout.session.completed`.
7. Send a test purchase (Stripe test mode or a $0.50 live test) and confirm
   a row appears in `EVENT_LOG` and the buyer receives the email.

## Status: live

- Apps Script deployed as a Web App (`StripeWebhook.gs` alongside the
  existing `Code.gs`), `STRIPE_SECRET_KEY` (restricted, read-only) and
  `WEBHOOK_SHARED_SECRET` set as Script Properties.
- Stripe webhook endpoint `we_1U8ACIAK6n3ctuR9XcWRHfsu` registered against
  the deployment URL (with `?key=...` appended), subscribed to
  `checkout.session.completed`, status `enabled`.
- End-to-end flow is live: Payment Link → Stripe Checkout → webhook →
  event re-verified against Stripe's API → PDF shared with buyer + email
  sent → row logged to `EVENT_LOG`.
- Stripe generates a `whsec_...` signing secret for every endpoint by
  default; it's unused here by design (see the header-access limitation
  above) and doesn't need to be stored anywhere.

Recommended before the first real sale: send one test purchase through
each of the 6 Payment Links (or at least one) and confirm the PDF email
arrives and `EVENT_LOG` shows a `BLUEPRINT_SENT` row.

## Known limitation

Because Apps Script can't read the `Stripe-Signature` header, this cannot
do the textbook HMAC signature check Stripe's docs describe. The
event-refetch approach above is a real, non-spoofable verification (an
attacker can't make Stripe's API return an event that doesn't exist), but
it does mean `STRIPE_SECRET_KEY` must stay a restricted, read-only key —
treat it as the actual trust boundary.
