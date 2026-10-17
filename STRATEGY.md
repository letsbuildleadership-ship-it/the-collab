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
| Creator™ | Creatives | Same infrastructure applied to creative IP | Product ladder on its page |
| Impact™ · Technology · Atelier™ · Co.LLab+™ | Community / ventures | Supporting or coming soon | — |

**Strengths:** owned IP, a clear 4-step system, a free front door, no-subscription clarity at the top tier. **Gaps:** no verified social proof yet; Partnership is self-serve at a high ticket, so trust must come from the page; Founders status is "being developed" (pursuing 501(c)(3)) and must stay worded that way.

## 2. Marketing strategy
**Positioning:** *Every company starts with a vision. Most lose it.* The Co.LLab™ is the infrastructure that defines, builds and passes it on, licensed as IP.
**Frame:** business, economic and geopolitical problem → IP as the solution. Threat is always paired with an action. No promises, no fake scarcity.
**Funnel:** ad / share card → Home (problem → solution → tiers) → **free .LLab join** → Library Card $10 → Membership → **Partnership**. Every page ends on the .LLab storefront; every Partnership already includes .LLab.
**Assets:** 11 ads × 2 sizes (`marketing/ads/`), share card, Lookbook, phase photographs (booth I, scaffolding II, racks III, track IV).
**Channels:** LinkedIn (owners), Meta (lookalikes), search (succession, legacy planning). Sequence cold 01/04/07 → warm 03/06/09–11 → hot 05/08/02.
**KPIs:** ad CTR → Home→free-join rate → free→paid rate → tier mix → Partnership conversion.

## 3. Commerce strategy
**Ladder:** Free Portal → $10 Library Card → $150 Membership → Partner IP / Partnership. One lead offer per screen; price lists live on their own pages.
**Checkout:** Stripe Payment Links on each offer page (all verified 200); `netlify/functions` handle checkout, webhook fulfillment, account/library entitlements, seats and emails.
**After purchase:** account + Member Portal™, products licensed to keep, seats by single-use invite, memberships by term (Partnership 1/2/3 yr or lifetime), new releases while a member.
**Rules:** change prices only in `content/pricing.json` + Stripe; tests (`npm test`) guard facts and contrast; Founders and Partnership pages never cross-promote in content (shared nav only).

## 4. Next moves (highest value first)
1. Collect and publish **real proof** (testimonials, founder count/impact ledger fills automatically).
2. Add **analytics + UTM** per ad so the funnel KPIs above are measurable.
3. Capture **email** at free join and run a short nurture to the Library Card, then Membership.
4. Run the first ad test: loss frame (01) vs aspiration (02).
5. Reword the two remaining "partnering" lines on Founders if the separation should be total.
