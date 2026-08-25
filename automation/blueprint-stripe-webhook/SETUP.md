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

## Price ID → PDF map (live Stripe account, already confirmed)

| Product | Price ID | Drive file |
|---|---|---|
| Welcome (Issue 00) | `price_1U7aSuAK6n3ctuR9l90HwyP5` | `13svjVaXqycmgYvnmWycNAssHFzid6yDE` |
| Phase One: Foundations (Issue 01) | `price_1U7aTAAK6n3ctuR99S4YmR56` | `1QZiOH2bdV2iUSsBYycDp9496NpxAuCjg` |
| Phase Two: Infrastructure Planning (Issue 02) | `price_1U7aTPAK6n3ctuR97GWx9dmW` | `1So0FU_7PJVieoCTEmgyAo58rYFClKLue` |
| Phase Three: Internal Operating Systems (Issue 03) | `price_1U7aTdAK6n3ctuR9TlxJ4Mzf` | `13s-RKX2R2aNhpAEa72NYI7c4E-O3hewW` |
| Phase Four: Preservation (Issue 04) | `price_1U7aTsAK6n3ctuR90SycsLmg` | `1hFznYubGFbZPMxNt6hb9Wg_z92BNEOCY` |
| Complete Edition (all 5 issues) | `price_1U7aU7AK6n3ctuR9rxOzHC0A` | `1tHCZGOSlyXrepAyjqDjtW8WOQPCZeaO0` |

There is no Stripe Payment Link wired up for these six products in
`content/products.json` yet — only the Founders and Phase-product tiers have
`buy.stripe.com` links today. Add Payment Links (or a Checkout Session
integration) for the six Blueprint prices above before this webhook has
anything to react to.

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

## Known limitation

Because Apps Script can't read the `Stripe-Signature` header, this cannot
do the textbook HMAC signature check Stripe's docs describe. The
event-refetch approach above is a real, non-spoofable verification (an
attacker can't make Stripe's API return an event that doesn't exist), but
it does mean `STRIPE_SECRET_KEY` must stay a restricted, read-only key —
treat it as the actual trust boundary.
