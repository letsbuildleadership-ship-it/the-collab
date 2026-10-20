# The Co.LLab™ — Strategy on one page
*Business analysis · marketing · commerce. Prices come from `content/pricing.json` (never hand-edit). Deep psychology/ad detail: `docs/marketing-strategy.md`.*

## 1. Business analysis
**What it is:** an enterprise that commercializes proprietary IP (owned by Ashley E. Clasby) as leadership infrastructure, organized by **The IV Phases™**: Foundations → Planning → Operating Systems → Preservation. Core framework: **Omnidirectional Enterprise™** (value moves in every direction between businesses, nonprofits, communities, people, technology, capital, knowledge + IP, creators).

**Revenue model:** (1) high-ticket one-time **licenses** (Partnerships); (2) recurring **memberships** (.LLab); (3) one-time **founding purchases** that also fund partner nonprofits (Founders Organization); (4) per-product sales (IV Phases, Creator). No equity, returns or earnings are promised.

| Offer | Buyer | Role in the business | Price (registry) |
|---|---|---|---|
| **Partnerships** | Owners/leaders with capital, afraid the vision fades or they're forgotten | **Lead offer**, highest value | $5,000 · $10,000 · $25,000 · $50,000, one-time |
| **.LLab** | Anyone starting out | **Marketing engine + recurring revenue**; every Partnership includes it | Free Portal → Library Card $10/mo · Membership $150/mo (or $1,500/yr) · Journal $150/yr |
| **Founders Organization** | Founders / community supporters | Community economic development; supports partner nonprofits. *Not a membership tier* | $20 · $50 · $350 · $1,000 |
| .LLab Creators™ | Creatives | Same infrastructure applied to creative IP | Product ladder on its page |
| Impact™ · Technology · Atelier™ · Co.LLab+™ | Community / ventures | Supporting or coming soon | — |

**Strengths:** owned IP, a clear 4-step system, a free front door, no-subscription clarity at the top tier. **Gaps:** no verified social proof yet; Partnership is self-serve at a high ticket, so trust must come from the page; Founders status is "being developed" (pursuing 501(c)(3)) and must stay worded that way.

## 2. Marketing strategy — one operating model
**Rule: no tactic exists outside Omnidirectional Enterprise™ × The IV Phases™.** Every ad, page, offer, email and funnel step is tagged with a **node** (who / which direction value moves: Businesses, Nonprofits, Communities, People, Technology, Capital, Knowledge + IP, Creators) and a **phase** (I Foundations → awareness · II Infrastructure Planning & Management → consideration · III Internal Operating Systems → purchase · IV Preservation → retention, advocacy, legacy). `marketing/ads/index.json` carries the tags and `npm test` fails if any node or phase is uncovered.

**Positioning:** *Every company starts with a vision. Most lose it.* The Co.LLab™ is the infrastructure that defines, builds and passes it on, licensed as IP. Frame: problem → solution; threat always paired with an action; no promises, no fake scarcity.

**The funnel is the four phases:** I Free Portal + free tools (People) → II Library Card $10/mo → III Membership $150/mo (all 9 IV Phases products) or a Partnership level (Businesses/Capital) → IV Omnidirectional tier (lifetime, 10 seats), apprentice seats, nonprofit giving, referrals.

| Node → | Phase I · Foundations | Phase II · Infrastructure Planning & Management | Phase III · Internal Operating Systems | Phase IV · Preservation | Home page |
|---|---|---|---|---|---|
| **Businesses** | ads 01, 09 | ad 10 | ads 08, 11 | — | Partnerships |
| **Capital** | — | ad 04 | ad 05 | ad 02 | Partnership tiers |
| **People** | ad 06 (free join) | Library Card | Membership | — | The .LLab |
| **Creators** | ad 12 | — | — | — | .LLab Creators™ |
| **Knowledge + IP** | — | ads 03, 15 | — | — | Think · Journal |
| **Technology** | — | — | ad 14 | — | Technology |
| **Communities** | — | — | — | ad 07 | Founders · Co.LLab+™ |
| **Nonprofits** | — | — | — | ad 13 | Impact™ |

**Media plan by phase:** I = cold reach (LinkedIn for owners, Meta lookalikes; Creators on image-led feeds) → II = retarget with framework and economic ads → III = conversion ads with price clarity → IV = lifetime/legacy, apprentice and nonprofit stories. **Search** captures intent (succession, legacy planning). **KPIs per phase:** I reach/CTR → II Home→free-join → III free→paid and tier mix → IV renewals, referrals, seats used.

## 3. Commerce strategy
**Ladder:** Free Portal → $10 Library Card → $150 Membership → Partner IP / Partnership. One lead offer per screen; price lists live on their own pages.
**Checkout:** Stripe Payment Links on each offer page (all verified 200); `netlify/functions` handle checkout, webhook fulfillment, account/library entitlements, seats and emails.
**After purchase:** account + Member Portal™, products licensed to keep, seats by single-use invite, memberships by term (Partnership 1/2/3 yr or lifetime), new releases while a member.
**Rules:** change prices only in `content/pricing.json` + Stripe; tests (`npm test`) guard facts and contrast; Founders and Partnership pages never cross-promote in content (shared nav only).

## 4. Next moves (highest value first)
1. Collect and publish **real proof** (testimonials, founder count/impact ledger fills automatically).
2. Add **analytics + UTM** per ad so the funnel KPIs above are measurable.
3. Capture **email** at free join and run a short nurture to the Library Card, then Membership.
4. Fill the empty matrix cells (e.g. Capital × I, Creators × III) with tested ads, and run the first test: loss frame (01) vs legacy frame (02).
5. Reword the two remaining "partnering" lines on Founders if the separation should be total.
