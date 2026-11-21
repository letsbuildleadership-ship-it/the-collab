# The Co.LLab™ — Strategy on one page
*Enterprise analysis · marketing · commerce. Prices come from `content/pricing.json` (never hand-edit). Deep psychology/ad detail: `docs/marketing-strategy.md`.*

## 0. Positioning (canonical — every page, ad, PDF and email follows this)
**Human potential is the underlying resource, not the product or the outcome**: the knowledge, capabilities, creativity, experience and expertise within people and organizations. The Co.LLab™ builds the infrastructure that converts it into organizational intelligence, strategic execution, measurable performance, sustainable enterprise value and lasting institutional impact. Not coaching, HR or generic consulting.

**Strategic model:** Human Capital → Intelligence Mobilization → Leadership Infrastructure → Enterprise Performance → Institutional Continuity (full version: `pages/about.html#strategic-model`; glossary entries for each stage). Offerings by stage: Intelligence Mobilization = The .LLab R.A.T.™, Intelligence Infrastructure™, The .LLab Journal™ · Leadership Infrastructure = The IV Phases™ IP, The .LLab Membership™ · Enterprise Performance = Partnership™, Infrastructure Analysis™, The .LLab Creators™ · Institutional Continuity = Phase IV Preservation, The Co.LLab Founders Organization™.

**Mission:** To build leadership infrastructure that connects human capital, organizational intelligence, and strategic execution to generate sustainable enterprise value and lasting institutional impact.
**Vision:** An economic and organizational landscape where systems effectively mobilize human capabilities, distribute opportunity, and translate collective intelligence into enduring enterprise value.
**Principle:** systems are designed around human capabilities; people should not have to conform to ineffective infrastructure.

**Definitions:** Omnidirectional Enterprise™ = a proprietary operating philosophy connecting intelligence, authority, value, IP and opportunity across an interconnected economic ecosystem rather than exclusively through top-down structures · The IV Phases™ of Leadership Infrastructure™ = Foundations → Infrastructure Planning & Management → Internal Operating Systems → Preservation · TRIARCH™ = the Value Architecture of The Co.LLab™, connecting organizational intelligence, infrastructure and enterprise value (tiers CROWN, SCEPTER, SIGNET, HEIRLOOM) · The Co.LLab Founders Organization™ = infrastructure for building sustainable enterprises · Creator Infrastructure™ = connects creative capabilities, IP ownership and economic participation to viable revenue-generating enterprises · The .LLab™ = a separate intellectual ecosystem for research, development, proprietary tools, knowledge and applied innovation. Founders and The .LLab are separate offerings, never membership tiers of each other.

**Language:** precise, economic, operational, executive-level. Avoid motivational/self-development phrasing ("unlock your potential", "pass it on with pride", "nobody builds alone", "dreams"). "Legacy" stays only in trademarked names (Legacy Wall, Legacy Library, Legacy Founder, the .LLab Legacy products) and the brand slogan; in copy use institutional continuity / enterprise value that lasts.

## 1. Enterprise analysis
**What it is:** an enterprise that commercializes proprietary IP (owned by Ashley E. Clasby) as leadership infrastructure, organized by **The IV Phases™**: Foundations → Planning → Operating Systems → Preservation. Core framework: **Omnidirectional Enterprise™** (value moves in every direction between enterprises, nonprofits, communities, people, technology, capital, knowledge + IP, creators).

**Revenue model:** (1) high-ticket one-time **licenses** (Partnerships); (2) recurring **memberships** (.LLab); (3) one-time **founding purchases** that also fund partner nonprofits (Founders Organization); (4) per-product sales (IV Phases, Creator). No equity, returns or earnings are promised.

| Offer | Buyer | Role in the enterprise | Price (registry) |
|---|---|---|---|
| **Partnerships** | Owners/leaders whose enterprise value depends on a few people | **Lead offer**, highest value | $5,000 · $10,000 · $25,000 · $50,000, one-time |
| **.LLab** | Anyone starting out | **Marketing engine + recurring revenue**; every Partnership includes it | Free Portal → Library Card $10/mo · Membership $150/mo (or $1,500/yr) · Journal $150/yr |
| **Founders Organization** | Founders / community supporters | Infrastructure for building sustainable enterprises; supports partner nonprofits. *Not a membership tier* | $20 · $50 · $350 · $1,000 |
| .LLab Creators™ | Creatives | Same infrastructure applied to creative IP | Product ladder on its page |
| .LLab Impact™ · Technology · Atelier™ · Co.LLab+™ | Community / ventures | Supporting or coming soon | — |

**Strengths:** owned IP, a clear 4-step system, a free front door, no-subscription clarity at the top tier. **Gaps:** no verified social proof yet; Partnership is self-serve at a high ticket, so trust must come from the page; Founders status is "being developed" (pursuing 501(c)(3)) and must stay worded that way.

## 2. Marketing strategy — one operating model
**Rule: no tactic exists outside Omnidirectional Enterprise™ × The IV Phases™.** Every ad, page, offer, email and funnel step is tagged with a **node** (who / which direction value moves: Enterprises, Nonprofits, Communities, People, Products & Services, Technology, Capital, Knowledge + IP, Creators) and a **phase** (I Foundations → awareness · II Infrastructure Planning & Management → consideration · III Internal Operating Systems → purchase · IV Preservation → retention, advocacy, legacy). `marketing/ads/index.json` carries the tags and `npm test` fails if any node or phase is uncovered.

**Positioning:** *Every company starts with a vision. Most lose it.* The Co.LLab™ is the infrastructure that defines, builds and passes it on, licensed as IP. Frame: problem → solution; threat always paired with an action; no promises, no fake scarcity.

**The funnel is the four phases:** I Free Portal + free tools (People) → II Library Card $10/mo → III Membership $150/mo (every IV Phases product) or a Partnership level (Enterprises/Capital) → IV Omnidirectional tier (lifetime, 10 seats), apprentice seats, nonprofit giving, referrals.

| Node → | Phase I · Foundations | Phase II · Infrastructure Planning & Management | Phase III · Internal Operating Systems | Phase IV · Preservation | Home page |
|---|---|---|---|---|---|
| **Enterprises** | ads 01, 09 | ad 10 | ads 08, 11 | — | Partnerships |
| **Capital** | — | ad 04 | ad 05 | ad 02 | Partnership tiers |
| **People** | ad 06 (free join) | Library Card | Membership | — | The .LLab |
| **Creators** | ad 12 | — | — | — | .LLab Creators™ |
| **Products & Services** | — | ad 03 | — | — | The .LLab Products (catalog) |
| **Knowledge + IP** | — | ad 15 | — | — | Think · Journal |
| **Technology** | — | — | ad 14 | — | Technology |
| **Communities** | — | — | — | ad 07 | Founders · Co.LLab+™ |
| **Nonprofits** | — | — | — | ad 13 | .LLab Impact™ |

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
