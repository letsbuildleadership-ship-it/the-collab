# The Co.LLab™ — Marketing strategy: advertising psychology, sociology, and the ad system

The website is built to work two ways at once: as the platform where a buyer decides, and as a bank of ads that can be lifted out of it. Every ad reuses a website section, so the page a click lands on repeats the promise the ad made.

**Guardrails.** All copy is approved site copy. Prices and seat counts come from `content/pricing.json`. No invented testimonials, scarcity, rankings or earnings claims. Partnership ads carry the approved line: *A license for internal business use. Results depend on how each business applies it.*

## 1. Who the buyer is, and what moves them

**The buyer.** Someone with the capital to spend $5,000–$50,000 who is afraid of two things: the business losing its direction without them, and not being remembered for what they built.

| Force | Source | What it means for the message |
|---|---|---|
| **Loss aversion**: losses weigh roughly twice as much as equal gains | Kahneman & Tversky | Lead with the loss ("Most lose it"), not the gain. |
| **Threat needs efficacy**: fear persuades only when paired with a clear, doable action | Witte, Extended Parallel Process Model | Every threat line is followed by a concrete action: four phases, one payment, one button. A fear-only ad makes people avoid it. |
| **Mortality salience and symbolic immortality**: thinking of mortality pushes people toward work that outlives them | Terror Management Theory | "Pass it on." is the strongest emotional line. Keep the tone dignified, not morbid. |
| **Generativity**: midlife concern for what continues after you | Erikson | .LLab Edu™ (sponsored learning and mentorship for partners, and future educational courses; in development) and nonprofit giving speak to this motive. |
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
| 01 The problem | Interest: the economic problem and the risk inside the company. |
| 02 The solution, 03 Tiers | Desire and action: Co.LLab IP™, four phases, four prices. |
| 04 After you buy | Risk reversal: one payment, licensed to keep, no subscription, plain terms. |
| 05 The .LLab (free row inside) | Low-commitment path for buyers not ready yet. |
| 06 The enterprise | Authority and adjacent offers. |

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

The 15 ads and their node × phase tags are listed in `marketing/ads/index.json` and mapped in `STRATEGY.md` §2.

**Sequence.** By phase: I cold reach (01, 06, 09, 12) → II retarget (03, 04, 10, 15) → III convert (05, 08, 11, 14) → IV legacy and advocacy (02, 07, 13). Cap cold frequency at about 6 impressions per person.

**Channels.** LinkedIn for owners and executives (04 and 01 first). Meta for lookalike audiences. Search for intent terms such as business succession, legacy planning and leadership infrastructure.

**What to test first:**
1. Loss framing (01) against aspiration ("Pass it on", 02).
2. Price visible (05) against hidden (01).
3. Photograph against type-only.
4. CTA wording: "Explore Partnerships" against "Preserve your legacy".

Measure click-through, landing-page-to-free-join rate, free-to-paid rate and tier mix.

## 5. Ethics and compliance

- **No earnings or return claims.** The license and results language stays on every pricing ad.
- **Fear with dignity.** Mortality framing uses legacy and continuity language, never death imagery or shame.
- **Targeting.** No sensitive-category targeting (health, age-based assumptions about decline).
- **Endorsements.** Add any testimonial only when it is real, with permission, and with FTC-compliant disclosure.
- **Accessibility.** Text stays at or above WCAG AA contrast. A regression test guards the colour tokens.

## 6. Photography as strategy: The IV Phases™ in four photographs

Real, unstaged photographs read as honest, and honesty is what a buyer spending $5,000–$50,000 is checking for. Stock imagery would undercut that. Each phase has one signature photograph, and the same pictures run on the site and in the ads.

| Phase | Photograph | What it signals | Psychology and sociology |
|---|---|---|---|
| **I · Foundations** (Define) | Wood-slat booth, enamel AMERICAN sign, high table and stools | Identity, rootedness, a place people gather. The table and stools are the Partnership **seats**. | Place identity and in-group belonging for heartland and small-business owners. Concrete imagery is recalled better than abstract claims. |
| **II · Infrastructure Planning & Management** (Plan) | Steel scaffolding corridor | Structure going up before the building exists. | Makes an abstract service tangible. |
| **III · Internal Operating Systems** (Live) | Tailored jackets on a wood-paneled rack | Order, standards, fit: how things are kept every day. The luxury-retail feel. | Fluency and quality cues: ordered scenes signal competence. The "built around the person" line from the site reads as tailoring. |
| **IV · Preservation** (Pass it on) | One railroad track to the horizon | The path is already laid and continues past you. | Symbolic immortality and generativity: the picture of "so it outlasts you". It carries the emotional close without death imagery. |

**Where they run**
- **Home:** the four phases are photograph tiles that link to the Partnership levels (Home #solution). The mission closes over the railroad.
- **Partnership page:** the same four tiles.
- **Founders page hero:** the booth, for community and Main Street.
- **Atelier hero:** the racks.
- **Journal hero:** the railroad ("Ideas, before infrastructure").
- **Ads:** 02 (railroad), 05 (racks, with price tags visible), 08 (booth seats), and 09–11 (one per phase).

**Picking future photographs.** Choose one that:
1. Has one clear subject and room for text.
2. Is human-scale and real.
3. Maps to a phase or a lever above.
4. Contains no readable third-party brands. The booth photo had Budweiser and Sturgis logos, which are blurred in the file.
5. Has consent if people are identifiable (the concert photo is flagged for this in the manifest).

**Not used.** The blue light-streak frame is one frame of a logo animation: low resolution, blown out, with a partial "WE". It would work as the first second of a video ad, not as a still.

## 7. Adding to the system

**Adding many photographs (bulk):** drop JPGs in `photos/inbox/` (name one `p2-anything.jpg` to tag it Phase II) and run `npm run photos`. Each is toned to match the site, sized, added to the manifest and to the Lookbook page (`pages/lookbook.html`, filterable by phase, with a lightbox). Originals move to `photos/done/` and are never published. Add `alt` text in `assets/img/editorial/manifest.json`, then rerun `npm run gallery`.

**Adding one photograph (full control):**

    node scripts/add-photo.mjs <file> <slug> --phase 1-4 --alt "describe it" --focus "50% 55%"
    # optional: --crop x,y,w,h   --blur "x,y,w,h;x,y,w,h"   --keep-color   --note "…"

It crops, blurs any third-party marks you list, bakes the site duotone, resizes, saves to `assets/img/editorial/<slug>.jpg` and records it in `assets/img/editorial/manifest.json`. Then:
- **On a page:** use `<figure class="lookbook">` or a `.tile` (copy an existing one).
- **In an ad:** add the slug to `ADS` in `scripts/build-ads.mjs` and run `node scripts/build-ads.mjs`.
- **Or** send the photos in chat with a note on where each belongs, and it's done for you.

- **New ad:** pull the hook and support line from approved copy. Pair every threat with an action.
