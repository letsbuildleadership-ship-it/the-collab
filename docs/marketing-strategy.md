# The Co.LLab™ — Marketing strategy: advertising psychology, sociology, and the ad system

The website is built to work two ways at once: as the platform where a buyer decides, and as a bank of ads that can be lifted out of it. Every ad reuses a website section, so the page a click lands on repeats the promise the ad made.

**Guardrails.** All copy is approved site copy. Prices and seat counts come from `content/pricing.json`. No invented testimonials, scarcity, rankings or earnings claims. Partnership ads carry the approved line: *A license for internal business use. Results depend on how each business applies it.*

## 1. Who the buyer is, and what moves them

**The buyer.** Someone with the capital to spend $5,000–$50,000 who is afraid of two things: the business losing its direction without them, and not being remembered for what they built.

| Force | Source | What it means for the message |
|---|---|---|
| **Loss aversion**: losses weigh roughly twice as much as equal gains | Kahneman & Tversky | Lead with the loss ("Most lose it"), not the gain. |
| **Threat needs efficacy**: fear persuades only when paired with a clear, doable action | Witte, Extended Parallel Process Model | Every threat line is followed by a concrete action: four phases, one payment, one button. A fear-only ad makes people avoid it. |
| **Mortality salience and symbolic immortality**: thinking of mortality pushes people toward work that outlives them | Terror Management Theory | "Pass it on. So it outlasts you." is the strongest emotional line. Keep the tone dignified, not morbid. |
| **Generativity**: midlife concern for what continues after you | Erikson | Apprentice seats ("partners sponsor people outside their company") and nonprofit giving speak to this motive. |
| **Status and cultural capital**: owning proprietary IP signals standing | Veblen, Bourdieu | Name the owner of the IP and use the word "licensed". Keep the look restrained. A $50,000 purchase needs a premium-looking page. |
| **Social identity**: people choose what says who they are | Tajfel & Turner | "Best for: owners leading on their own / leadership teams / the whole company / companies building beyond their founder" lets buyers self-select. "Partners" and the ecosystem give a group to belong to. |
| **Unity**: "we" persuades more than "you" | Cialdini | "Nobody builds alone" and the Omnidirectional Enterprise™ model. |
| **Reciprocity and commitment ladder** | Cialdini, Freedman & Fraser | Free tools → free Portal → Library Card $10 → Membership → Partnership. Every tier already includes .LLab, so the free door leads straight to the paid one. |

## 2. Message architecture

Each page and ad follows Attention → Interest (the problem) → Desire (the IP as the solution) → Action. The Home page runs in that order:

| Home section | Job |
|---|---|
| Hero ("Every company starts with a vision. Most lose it.") | Attention: loss frame and identity. |
| Spec strip | Cognitive ease: price, term, seats, free door in five facts. |
| 01 The market, 02 The risk | Interest: external and internal threat, in business, economic and geopolitical terms. |
| 03 The solution, 04 Tiers | Desire and action: Co.LLab IP™, four phases, four prices. |
| 05 After you buy | Risk reversal: one payment, licensed to keep, no subscription, plain terms. |
| 06 The .LLab, free resources | Low-commitment path for buyers not ready yet. |
| 07 The enterprise | Authority and adjacent offers. |

## 3. Principles applied

| Principle | Where |
|---|---|
| **Choice architecture (Hick's law)** | Home carries one lead offer. The .LLab and Founders price lists were removed from Home so they don't compete with the Partnership. |
| **Isolation (von Restorff)** | One solid orange button per screen. Secondary actions are outlined. |
| **Anchoring** | The price ladder is shown whole, so the $5,000 entry reads as the accessible end of a $50,000 range. |
| **Processing fluency** | Headlines of eight words or fewer, a four-word ladder ("Define it. Plan it. Live it. Pass it on."), a high-contrast type system. |
| **Risk reversal and transparency** | "One-time purchase. No subscription and no automatic charges." and "All sales are final once access is unlocked" are stated plainly. High-value buyers distrust fine print. |
| **Social proof, only when real** | The Founders count and dollars directed to nonprofits come from live data and stay hidden until they exist. No testimonials until real ones exist. |
| **Peak-end** | A strong opening hero and a closing "Enter The .LLab" storefront on every page. |
| **Deliberately not used** | False scarcity, countdowns, "most popular" badges, urgency timers. They cost trust with this buyer and need unverifiable claims. |
| **Legibility as persuasion** | Unread copy doesn't sell. Measured contrast failures dropped from 37% to 2% of text elements on desktop. Small labels went from about 1.6:1 to above 4.5:1, and the type floor is about 13.5px. |

## 4. The ad system

Run `node scripts/build-ads.mjs` to render `marketing/ads/*.png` (4:5 feed and 1.91:1 landscape) and the share card `assets/img/og-cover.png`. Every pasted link to the site is itself an ad.

**Template rules:** one image, one hook of eight words or fewer, one supporting line, one call to action, the legal line wherever pricing appears.

| # | Hook | Lever | Funnel stage | Lands on |
|---|---|---|---|---|
| 01 | Every company starts with a vision. **Most lose it.** | Loss aversion, identity | Cold | Home |
| 02 | **Pass it on.** So it outlasts you. | Mortality salience, legacy | Warm to hot | Partnership |
| 03 | Define it. Plan it. Live it. **Pass it on.** | Processing fluency | Warm | Home #solution |
| 04 | Generating value and capturing value **are different processes.** | Authority, reframe | Cold (LinkedIn) | Home #market |
| 05 | **One payment.** Licensed to keep. | Risk reversal, price clarity | Hot | Partnership #tiers |
| 06 | **Start free.** Build your legacy. | Foot-in-the-door, reciprocity | Cold to warm | Home #llab |
| 07 | **Nobody builds alone.** | Unity, belonging | Cold | Think #model |
| 08 | Your legacy. **Your whole team.** | Status, internal buy-in | Hot | Partnership #included |

**Sequence.** Cold: 01, 04, 07. Warm: 03, 06. Hot: 05, 08, 02. Cap frequency so cold ads don't repeat past about 6 impressions per person.

**Channels.** LinkedIn for owners and executives (04 and 01 first). Meta for lookalike audiences. Search for intent terms such as business succession, legacy planning and leadership infrastructure.

**What to test first:**
1. Loss framing (01) against aspiration ("Pass it on", 02).
2. Price visible (05) against hidden (01).
3. Photograph against type-only.
4. CTA wording: "See the four tiers" against "Preserve your legacy".

Measure click-through, landing-page-to-free-join rate, free-to-paid rate and tier mix.

## 5. Ethics and compliance

- **No earnings or return claims.** The license and results language stays on every pricing ad.
- **Fear with dignity.** Mortality framing uses legacy and continuity language, never death imagery or shame.
- **Targeting.** No sensitive-category targeting (health, age-based assumptions about decline).
- **Endorsements.** Add any testimonial only when it is real, with permission, and with FTC-compliant disclosure.
- **Accessibility.** Text stays at or above WCAG AA contrast. A regression test guards the colour tokens.

## 6. Adding to the system

- **New photo:** bake it to the site duotone (see `PROJECT_CHECKPOINT.md`), save it in `assets/img/editorial/`, then use it as a `.lookbook` or `.tile`. For an ad, add an entry to `ADS` in `scripts/build-ads.mjs`.
- **New ad:** pull the hook and support line from approved copy. Pair every threat with an action.
