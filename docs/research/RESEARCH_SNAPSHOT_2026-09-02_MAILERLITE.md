# Research Snapshot — MailerLite — 2026-09-02

Purpose: capture currently observable MailerLite facts to unblock a possible
`beehiiv vs MailerLite` comparison article. Built to the HISHO Labs content rules —
official pages first, review marketplaces only as clearly-labelled user-consensus
evidence, nothing invented, `Unknown` stays `Unknown`.

## How this snapshot was produced

- Evidence gathered by Claude Code (Tech Lead) via direct fetch of official MailerLite
  pages and Capterra on **2026-09-02**. The nominal plan was to hand this to Codex; direct
  official-page access was available, so the bounded research was run inline and is left
  here for Codex adversarial re-verification before any publish.
- Pages are rendered/summarised through a fetch pipeline. Where a number could be a
  cached or summarised value rather than a live read, it is marked accordingly and must
  be re-confirmed against the live page before it appears in a published article.
- beehiiv-side facts are **not** re-collected here — see
  `docs/RESEARCH_SNAPSHOT_2026-08-31.md` and the refreshed beehiiv pricing read recorded
  in this session's report.

## Source tiers

| Tier | Meaning |
| --- | --- |
| T1 | Official vendor page (pricing, features, product) |
| T2 | Verified review marketplace (G2, Capterra) — user-consensus evidence only |
| T3 | Third-party blog / search aggregation / community — context only, never a fact |

## Status vocabulary

- **Confirmed** — unambiguous official statement, observed on an official page today.
- **Observed** — seen once today on the cited page; single read, not cross-checked.
- **User-reported** — from reviews/community; a claim *about* the product, not a vendor fact.
- **Unknown** — not verified today. Stays Unknown. Do not guess.

---

## 1. Pricing / free tier

Source: **MailerLite Pricing** — `https://www.mailerlite.com/pricing` — observed 2026-09-02 — T1

| Plan | Displayed price | Annual billing | Subscribers | Monthly email sends | Seats | Support | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Free | $0/month | — | Up to 250 | 2,500 | 2 | Community support | Observed |
| Comfort | "Starting $12/month" (billed monthly) | "10% discount" for annual billing | Slider-priced; `NOT_SHOWN` at default | "10× the ceiling of your subscriber tier each month" | 3 | "24/7 Email support" | Observed |
| Power | "Starting $25/month" (billed monthly) | "10% discount" for annual billing | Unlimited | Unlimited (fair use) | Unlimited | "24/7 Live chat & email support" | Observed |
| Enterprise | Custom pricing | — | 200K+ | Custom | Unlimited | Priority support | Observed |

Notes:

- Paid-plan price **rises with subscriber count** via a slider. The `$12` / `$25` figures
  are the *entry* prices at the smallest band. Any article must say "from $12 / from $25"
  and tell the reader to set the slider to their own list size. — Confirmed (page shows
  "Starting $..." wording).
- Exact subscriber bands / the price at each band: **Unknown** — the fetched page did not
  expose the slider values at non-default positions.
- Free-tier automation limit is stated as **"3 automations"** on the pricing feature list
  (see §3). A third-party review (T3) describes the free automation cap as a "5-step
  maximum"; that is **User-reported**, not confirmed on the official page.
- Plan names are **Free / Comfort / Power / Enterprise**. This matches the
  2026-08-31 snapshot and still post-dates the older `Growing Business` / `Advanced`
  naming used in some existing site articles. — Confirmed.
- Free trial length for paid plans: **Unknown** (not shown on the pricing page).

## 2. Subscriber / contact limits

Source: `https://www.mailerlite.com/pricing` — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Free plan ceiling | 250 subscribers | Observed |
| Comfort plan ceiling | Slider-defined; value at default `NOT_SHOWN` | Unknown |
| Power plan ceiling | "Unlimited" subscribers | Observed |
| Enterprise | "200K+ subscribers" | Observed |
| Definition of a billed subscriber (active vs unsubscribed vs bounced) | Not stated on pricing page | Unknown |

## 3. Newsletter / email features

Source: **MailerLite Features** — `https://www.mailerlite.com/features` — observed 2026-09-02 — T1
(cross-checked against pricing feature list, same date)

- Email campaigns: "Drag & drop editor"; "Simple, and Custom HTML editors"; "Unlimited
  newsletter templates"; "70 Newsletter blocks" (surveys, signatures, coupons, galleries,
  countdown timers, events). — Observed
- A/B testing: "A/B testing" listed as included on all plans; multivariate on send time,
  sender name, subject line. — Observed
- Signup forms & pop-ups: "Signup forms"; pop-up builder; "Teaser pop-ups", "Promotion
  pop-ups", "Spin-the-wheel". Free = "3 signup forms"; Comfort = "10 signup forms &
  pop-ups"; Power = "Unlimited". — Observed
- Segmentation: "Subscriber segmentation"; dynamic content / audience-specific content
  blocks; "Preference center"; "Unsubscribe page builder". — Observed
- Deliverability: "Email verifier"; "Smart Sending" (ML send-time optimisation);
  "Dedicated IP" and "Deliverability consultation" on Enterprise only. — Observed

## 4. Automation

Source: `https://www.mailerlite.com/features` + `/pricing` — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Automation builder | "Automation builder" / "visual automations"; "Automation templates" | Observed |
| Free plan | "3 automations" | Observed |
| Comfort plan | "50 automations" | Observed |
| Power plan | "Unlimited automations"; "multiple automation triggers" | Observed |
| Multi-trigger workflows | Power plan and above | Observed |
| Depth vs enterprise marketing-automation tools | Reviewers repeatedly call automation "good enough for small business" but limited for advanced use — see §11 | User-reported |

## 5. Landing pages / website functionality

Source: `https://www.mailerlite.com/features` + `/pricing` — observed 2026-09-02 — T1

- "Website builder"; "Landing page builder"; "Create a blog"; "Prebuilt sections". — Observed
- Free: "1 website & 1 landing page". Comfort: "10 websites & landing pages". Power+:
  "Unlimited landing pages & websites". — Observed
- Custom domain support, hosting details, bandwidth: **Unknown** (not surfaced on the
  fetched pages).

## 6. Monetization features

Source: `https://www.mailerlite.com/features` — observed 2026-09-02 — T1

- "Sell digital products"; "Paid newsletter subscriptions" / "Paid newsletters";
  "E-commerce campaigns"; ecommerce integrations (Shopify, WooCommerce). — Observed
- Per-plan digital-product limits: Free = "1 digital product/booking"; Comfort = "5
  digital products & bookings"; Power+ = "Unlimited". — Observed
- MailerLite's own commission / take-rate on paid newsletter subscriptions or digital
  product sales: **Unknown** (not stated on the fetched pages). Do not state a take rate.
- Ad network / sponsorship marketplace / recommendation network: **not present** on the
  MailerLite pages read today. Recorded as *not observed* rather than *confirmed absent* —
  per content rules, absence must be observed on a definitive page, not assumed. Status:
  Unknown (leaning absent). For the article, the honest line is "MailerLite does not
  advertise an ad network or recommendation network" — which is what was observed.

## 7. Analytics

Source: `https://www.mailerlite.com/features` — observed 2026-09-02 — T1

- "Performance reports"; "Comparative reporting"; link clicks, geolocation, signup
  sources, "E-commerce revenue" tracking. — Observed
- Advanced website analytics / funnel analytics: **Unknown**.
- Deeper reporting is a recurring reviewer complaint — see §11. — User-reported

## 8. Integrations

Source: `https://www.mailerlite.com/features` — observed 2026-09-02 — T1

- "150+ integrations available" (pricing page for Free says "100+ integrations"; features
  page says "150+"). The two official surfaces disagree — record both, state "100+ to
  150+ depending on plan/page" and do not pick a precise number. — Observed (with
  internal inconsistency noted)
- Named integrations: Claude, WordPress, Canva, Zapier, Shopify, WooCommerce. — Observed
- API / MCP access: "limited API/MCP access" noted on the Free tier; fuller access on
  paid. Exact limits: **Unknown**.

## 9. Migration / export considerations

| Item | Value | Status |
| --- | --- | --- |
| Subscriber import | Supported (standard for the category); exact flow not verified on an official page today | Unknown |
| Subscriber / data export | **Unknown** — not verified on an official MailerLite page on 2026-09-02. Do not assert export behaviour. | Unknown |
| Account approval friction on import | Strict verification / approval process is the single most common reviewer complaint; large or unusually-sourced lists are flagged or delayed — see §11 | User-reported |

## 10. Important limitations (observed + user-reported, kept separate)

Observed on official pages (T1):

- Free plan is capped at **250 subscribers** and **2,500 sends/month** — small compared
  with several rivals' free tiers.
- Paid pricing scales with list size; entry prices are "from" prices.
- Free plan limited to "3 automations", "1 website & 1 landing page", "3 signup forms".

User-reported (T2/T3 — consensus themes, not facts):

- Strict account verification / approval; risk of suspension or termination with limited
  appeal. Capterra recurring theme; one documented severe case of "account termination
  without warning after payment, with no refund". — User-reported (T2)
- Limited advanced automation, segmentation, and reporting versus enterprise platforms. — User-reported (T2)
- "Large jumps between pricing tiers". — User-reported (T2)
- Editor occasionally unintuitive / glitchy. — User-reported (T2)

## 11. Review-marketplace consensus (user-consensus evidence only)

Source: **MailerLite Reviews — Capterra** — `https://www.capterra.com/p/136603/MailerLite/reviews/` — observed 2026-09-02 — T2

| Metric | Value | Status |
| --- | --- | --- |
| Capterra overall | 4.7 / 5 | Observed (T2) — see caveat |
| Capterra review count | 2,322 | Observed (T2) — see caveat |
| Capterra "ease of use" | 4.6 | Observed (T2) |
| Capterra "customer service" | 4.8 | Observed (T2) |
| Capterra "value for money" / "features" sub-scores | Not separately captured | Unknown |
| G2 overall / count | **Unknown** — G2 not directly loaded on 2026-09-02 (prior sessions hit HTTP 403). Third-party summaries cite ~4.6/5 on G2; treat as T3 / User-reported only. | Unknown |

Caveat: the Capterra figures (4.7 / 2,322) are **identical** to the numbers carried in
existing site articles dated 2026-08-22. They may be a genuinely stable value or a
summarised/cached read. **Re-confirm against the live Capterra page before publishing any
rating**, and date it honestly ("last verified 2026-09-02, matches 2026-08-22").

Recurring **praise** (Capterra + T3, consistent): ease of use, intuitive UI, value for
money, fast and helpful support (live chat answers in minutes, weekends included),
landing pages, campaign creation.

Recurring **complaints** (Capterra + T3, consistent): account approval / verification
strictness and suspension risk with weak appeal; limited advanced automation and
segmentation; occasional editor glitches; big jumps between price tiers.

Do not convert any of §11 into a vendor fact. It is what reviewers say.

## 12. Target user positioning

Synthesis from official copy (T1) + review consensus (T2/T3):

- MailerLite positions as an **affordable, easy, all-in-one email tool** for freelancers,
  small businesses, bloggers, creators, and simple ecommerce — "email marketing without
  the bloat".
- Centre of gravity: **sending good email cheaply with low setup effort**, plus enough
  websites/landing-pages/automation/digital-product selling for a small operation.
- It does **not** position as a newsletter *growth* platform: no advertised ad network,
  sponsorship marketplace, or cross-publication recommendation network was observed.
- Natural contrast with beehiiv: MailerLite = low-cost simple sender + light monetisation;
  beehiiv = paid growth-and-monetisation platform for publications that intend to earn
  directly.

---

## Facts deliberately NOT to be stated as confirmed in any article

- Any MailerLite paid-plan price at a specific subscriber band above the entry tier.
- Any exact subscriber band boundaries.
- Any MailerLite take-rate / commission on paid newsletters or digital products.
- Any free-trial length for paid plans.
- Any subscriber-list export behaviour (not verified on an official page).
- Any G2 rating or review count dated 2026-09-02.
- A precise integration count (official pages disagree: "100+" vs "150+").
- Any claim that MailerLite "has no X" unless framed as "does not advertise X on its
  current pages", which is what was actually observed.

## Draft status

**DRAFT_UNBLOCKED (with conditions).** Official pricing/feature facts for MailerLite are
now observed and dated. Conditions before publish:

1. Re-confirm the Capterra rating/count on the live page and date it.
2. Keep every §11 item as user-consensus language, never as fact.
3. Run the beehiiv-side numbers from the refreshed 2026-09-02 read (see session report),
   not from memory.
4. Codex adversarial review of the finished draft.
