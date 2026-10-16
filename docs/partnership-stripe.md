# Partnership: Stripe changes (applied 2026-10-10)

**Applied** on 2026-10-10 with deployment authorization, right after the
website went live (Netlify deploy of commit 5055ee2). Sections 1 and 2 below
are now live on Stripe; section 3 is still optional.

Verified read-only (live account `acct_1SwN2WAK6n3ctuR9`):

| Tier | Product | Price (one-time) | Payment Link | Status |
|---|---|---|---|---|
| Partner | prod_VPrhOJ3AsPNXtm | price_1UP1xlAK6n3ctuR9EFyv5jVx · $5,000 | https://buy.stripe.com/3cIfZg6YKcol4ht2Cy9ws19 | active, promo codes off |
| Strategic | prod_VPrhU4TMQY0MPX | price_1UP1yAAK6n3ctuR9GsBjRFro · $10,000 | https://buy.stripe.com/dRm7sK5UG9c9dS3cd89ws1a | active, promo codes off |
| Enterprise | prod_VPrpLF8ueIK6F0 | price_1UP269AK6n3ctuR9kYElHc6N · $25,000 | https://buy.stripe.com/28EfZg0AmfAx9BNfpk9ws1b | active, promo codes off |
| Omnidirectional | prod_VPri7WDL6E1f4E | price_1UP1ycAK6n3ctuR9tseEPqVf · $50,000 | https://buy.stripe.com/9B6dR896SagddS36SO9ws1c | active, promo codes off |

All four prices are `type: one_time` with `recurring: null`. No new products,
prices, or links are needed; the existing Payment Links stay.

## 1. Product descriptions (shown on the Stripe checkout page)

**Partner**
> One-time purchase. Access the infrastructure: keep Leadership Infrastructure™ Phase I–II products and Blueprint™ Welcome–Phase Two; 12 months of .LLab Membership™, Library Card™ and Journal™. 1 seat. Standard Co.LLab™ IP license (internal use only). All sales final once access is unlocked, subject to applicable law. A purchase, not an investment.

**Strategic**
> One-time purchase. Integrate the infrastructure: everything in Partner, plus keep Phase III Internal Operating Systems products and Blueprint™ Phase Three; 12 months of every membership. 2 seats. One annual group orientation or recorded briefing. Standard Co.LLab™ IP license (internal use only). All sales final once access is unlocked, subject to applicable law. A purchase, not an investment.

**Enterprise**
> One-time purchase. Keep the complete designated Co.LLab™ IP portfolio plus designated eligible releases during your 12-month term; 12 months of every membership. 5 seats. One annual enterprise orientation. Standard Co.LLab™ IP license (internal use only; no ownership or commercial rights). All sales final once access is unlocked, subject to applicable law. A purchase, not an investment.

**Omnidirectional**
> One-time purchase. Everything in Enterprise, plus defined Omnidirectional Enterprise™ ecosystem participation (eligibility only, not guaranteed); 12 months of every membership. 10 seats. One annual strategic briefing. Standard Co.LLab™ IP license (internal use only; no ownership or commercial rights). All sales final once access is unlocked, subject to applicable law. A purchase, not an investment.

## 2. Checkout disclosure on all four Payment Links

`custom_text.submit.message` (shown above the Pay button):

> One-time purchase, not an investment. All sales are final once access is unlocked, subject to applicable law. Use is governed by the Co.LLab™ IP license: wearethellab.netlify.app/pages/ip-license.html. Full terms: wearethellab.netlify.app/pages/partnership.html#terms

## 3. Test link cleanup (optional)

The owner $0 test link `plink_1UP3TMAK6n3ctuR9uqiiuvXU` and code
`PARTNER-TEST-94A796` (single use, expires ~2026-10-17) can be deactivated
after the test purchase.

## 4. Tier update (2026-10-16): to apply in Stripe

The site now sells the tiers below (content/pricing.json). Paste these as
the four product descriptions so checkout matches the page.

**Partner ($5,000)**
> One-time purchase. A license to all 9 products of The IV Phases™ and The Blueprint™ — Welcome, yours to keep using. 12 months of .LLab Membership™, .LLab Library Card™ and The .LLab Journal™, then renew yearly at regular prices. 1 seat. All Co.LLab™ IP is owned by Ashley E. Clasby and licensed for internal business use only. All sales final once access is unlocked, subject to applicable law.

**Strategic ($10,000)**
> One-time purchase. Everything in Partner, plus a license to every issue of The Blueprint™, including the Complete Edition (All 5 Issues). 12 months of every membership, then renew yearly. 3 seats. Internal business use only. All sales final once access is unlocked, subject to applicable law.

**Enterprise ($25,000)**
> One-time purchase. Everything in Strategic, plus a license to all of Creator Infrastructure™ and every new Co.LLab™ release during your 12 months. 12 months of every membership, then renew yearly. 10 seats. Internal business use only. All sales final once access is unlocked, subject to applicable law.

**Omnidirectional ($50,000)**
> One-time purchase. Everything in Enterprise, plus lifetime .LLab Membership™, .LLab Library Card™ and The .LLab Journal™ (never renew) and every new Co.LLab™ release for 3 years. 25 seats. Internal business use only. All sales final once access is unlocked, subject to applicable law.

**Checkout message (all four links)**
> One-time purchase. All sales are final once access is unlocked, subject to applicable law. Use is governed by the Co.LLab™ IP license: wearethellab.netlify.app/pages/ip-license.html. Full terms: wearethellab.netlify.app/pages/partnership.html#terms

**ACH:** in Stripe, enable "ACH Direct Debit" (US bank account) on all four
Partnership Payment Links. ACH costs 0.8% capped at $5 per payment versus
2.9% + 30¢ by card. ACH payments take about 4 business days to clear;
fulfillment runs on checkout completion, so pay sales commission only after
the payment shows as succeeded.
