# Research Snapshot — Ghost — 2026-09-02

Purpose: capture currently observable Ghost / Ghost(Pro) facts to unblock a possible
`beehiiv vs Ghost` comparison article. Same rules as the MailerLite snapshot — official
pages first, review marketplaces only as labelled user-consensus, nothing invented,
`Unknown` stays `Unknown`.

## How this snapshot was produced

- Evidence gathered by Claude Code (Tech Lead) via direct fetch of `ghost.org` official
  pages and Capterra on **2026-09-02**, then left for Codex adversarial re-verification
  before any publish.
- Fetch pipeline renders/summarises pages; single-read values are marked `Observed` and
  must be re-checked live before publication.
- Priority per the work order: **MailerLite first, Ghost second.** This snapshot is the
  second pass.

## Source tiers

| Tier | Meaning |
| --- | --- |
| T1 | Official vendor page (pricing, features, product) |
| T2 | Verified review marketplace (G2, Capterra) — user-consensus evidence only |
| T3 | Third-party blog / search aggregation / community — context only |

## Status vocabulary

- **Confirmed** — unambiguous official statement observed today.
- **Observed** — single read on the cited page today; not cross-checked.
- **User-reported** — review/community claim about the product, not a vendor fact.
- **Unknown** — not verified today. Stays Unknown.

---

## 1. Pricing / free tier

Source: **Ghost Pricing** — `https://ghost.org/pricing/` — observed 2026-09-02 — T1

The page displays **yearly-billed** prices.

| Plan | Displayed price (billed yearly) | Members | Staff users | Status |
| --- | --- | --- | --- | --- |
| Starter | $18/month | 1,000 | 1 | Observed |
| Publisher | $29/month | 1,000 | 3 | Observed |
| Business | $199/month | 10,000 | 15 | Observed |
| Custom | Custom pricing (contact) | Unlimited | Unlimited | Observed |

Notes:

- Prices shown are **billed yearly**. Monthly-billing prices: **Unknown** (not displayed
  on the page as read). The 2026-08-31 snapshot recorded the same limitation. — Confirmed
  (consistent across two reads).
- Member price bands scale above the listed ceilings (e.g. Starter/Publisher priced at
  1,000 members; more members cost more). Exact band pricing: **Unknown**.
- **"Free"** in the Ghost context = the **open-source software is free to self-host**, not
  a free Ghost(Pro) tier. There is no $0 Ghost(Pro) plan. — Confirmed (see §5, §9).
- Free trial: Ghost(Pro) historically offers a trial; length **not verified** on the
  pricing page today. — Unknown.

## 2. Subscriber / member limits

Source: `https://ghost.org/pricing/` — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Starter | 1,000 members | Observed |
| Publisher | 1,000 members | Observed |
| Business | 10,000 members | Observed |
| Custom | "Unlimited members" | Observed |
| Newsletter email sends | "Unlimited" on all plans | Observed |
| Definition of a "member" (free signup vs paid) | Members = signed-up readers (free or paid); paid tiers require Publisher+ (see §6) | Observed |

## 3. Newsletter / email features

Source: **Ghost homepage / product** — `https://ghost.org/` — observed 2026-09-02 — T1

- "Deliver posts by email newsletter to your audience" with built-in **segmentation**. — Observed
- Newsletter sends are "Unlimited" on every Ghost(Pro) plan (from §1 pricing table). — Observed
- Multiple newsletters per publication, sending controls, per-tier newsletter access:
  **Unknown** (not verified on a dedicated feature page today).
- Ghost is **publication-first**: the newsletter is one output of a site that is primarily
  a website + CMS, not an email tool with a site bolted on. — Observed (positioning, §8).

## 4. Automation

Source: `https://ghost.org/pricing/` + homepage — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Native visual automation / sequence builder | **Not observed** as a first-class feature. Ghost's automation story is **integrations + webhooks + Admin API** (Zapier, n8n, custom), unlocked on Publisher and above. | Observed (leaning: no native builder) |
| Welcome emails / drip sequences native to Ghost | **Unknown** — not confirmed on an official page today. Do not assert presence or absence. | Unknown |
| Webhooks / Admin API / Zapier / n8n | Publisher plan and above | Observed |

For the article, the honest framing is: "Ghost does not advertise a visual automation
builder; automated flows are built through Zapier/n8n/webhooks on Publisher and up." That
is what was observed.

## 5. Landing pages / website functionality

Source: `https://ghost.org/` + `https://ghost.org/pricing/` — observed 2026-09-02 — T1

- Ghost **is** a full website / CMS: "hundreds of beautifully designed publication
  templates", custom design control, fast-loading pages, "built-in SEO". — Observed
- **Custom themes**: Starter = **No**; Publisher / Business / Custom = **Yes**. — Observed
- Full theme control requires editing Handlebars templates (developer skill). — Observed / User-reported (see §10)
- Dedicated "landing page builder" drag-and-drop: **not observed** as a named feature;
  pages are created as Ghost pages/posts with the editor and theme. Status: Unknown.

## 6. Monetization features

Source: `https://ghost.org/pricing/` + `https://ghost.org/` — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Paid subscriptions (memberships) | **Starter = No**; Publisher / Business / Custom = **Yes**. "monthly and yearly premium tiers". | Observed |
| Ghost's take rate on paid subscriptions | **0%**. Verbatim: "Process payments for your premium subscriptions without any additional transaction fees from Ghost." Homepage: "0% payment fees". | Confirmed |
| Payment processor | Stripe. Payment-processor fees still apply (standard Stripe rates, not set by Ghost). Third-party reviews note **Stripe is the only supported processor**, unavailable in some countries. | Observed (Stripe) / User-reported (Stripe-only limitation) |
| Tips & donations | Starter = No; Publisher+ = Yes. | Observed |
| Native signup forms | "native signup forms that turn anonymous views into logged-in members". | Observed |
| Ad network / sponsorship marketplace / recommendation network | **Not present** / not advertised on the pages read today. Recorded as *not observed*, not *confirmed absent*. | Unknown (leaning absent) |
| Digital product / course sales | **Unknown** — not verified on an official page today. | Unknown |

## 7. Analytics

Source: `https://ghost.org/pricing/` — observed 2026-09-02 — T1

| Item | Value | Status |
| --- | --- | --- |
| Advanced analytics | Starter = **No**; Publisher / Business / Custom = **Yes**. | Observed |
| What "advanced analytics" includes | Not itemised on the page as read. | Unknown |
| Basic analytics on Starter | Implied (some analytics, not "advanced"); specifics `NOT_SHOWN`. | Unknown |

## 8. Integrations

Source: `https://ghost.org/pricing/` — observed 2026-09-02 — T1

- Starter: **basic only** — "Slack, Content API". — Observed
- Publisher / Business / Custom: unlock "Zapier, n8n, custom integrations, Admin API,
  webhooks". — Observed
- Ghost is open-source with a documented REST API; the wider integration/plugin ecosystem
  is **smaller than WordPress's** — the most common reviewer trade-off (see §10). — User-reported

## 9. Migration / export considerations

| Item | Value | Status |
| --- | --- | --- |
| Open-source / self-host | Ghost software is open source; homepage stresses "open source", source on GitHub, "funded 100% by its users". Self-hosting is free (infra/maintenance cost is yours). | Confirmed |
| Portability | Ghost's core pitch is ownership: "Your audience, brand, and revenue – owned entirely by you". Content and members can be exported and the whole site moved between Ghost(Pro) and self-host. Exact export format / one-click flow: not verified on an official page today. | Observed (positioning) / Unknown (mechanics) |
| Import from other platforms | Ghost provides migration tooling/services; specifics not verified today. | Unknown |
| Lock-in risk | Lower than hosted-only rivals *because* self-hosting is a real exit. This is the structural difference to foreground vs beehiiv. | Observed (follows from open-source status) |

## 10. Important limitations (observed + user-reported, kept separate)

Observed on official pages (T1):

- **No free Ghost(Pro) tier.** Entry is $18/month billed yearly.
- **No paid memberships, custom themes, tips, or advanced analytics on Starter** —
  those require Publisher ($29/mo yearly) or above.
- Big jump from Publisher (1,000 members, $29/mo) to Business (10,000 members, $199/mo).
- Full design control = editing themes (Handlebars), i.e. developer work.
- Starter integrations limited to Slack + Content API.

User-reported (T2/T3 — consensus themes, not facts):

- Smaller plugin/integration ecosystem than WordPress; advanced customisation needs
  technical skill. — User-reported (T2)
- Not suited to ecommerce or complex sites. — User-reported (T2)
- Stripe-only for membership payments; unavailable in some countries. — User-reported (T3, consistent)
- Major version upgrades (self-host) can be painful. — User-reported (T2)
- Missing some "basic" niceties (e.g. native site search historically). — User-reported (T2)
- Consistent pattern: "users who understand Ghost is a publishing platform love it;
  users expecting a general website builder are disappointed." — User-reported (T3)

## 11. Review-marketplace consensus (user-consensus evidence only)

Source: **Ghost Reviews — Capterra** — `https://www.capterra.com/p/151947/Ghost/reviews/` — observed 2026-09-02 — T2

| Metric | Value | Status |
| --- | --- | --- |
| Capterra overall | 4.7 / 5 | Observed (T2) |
| Capterra review count | 53 | Observed (T2) |
| Capterra "ease of use" | 4.5 | Observed (T2) |
| Capterra "customer service" | 4.3 | Observed (T2) |
| Capterra "value for money" / "features" | Not captured | Unknown |
| G2 overall / count | **Unknown** — G2 not directly loaded 2026-09-02. Third-party summaries cite figures from ~4.1/5 to "strong"; inconsistent, treat as T3 only, do not publish a G2 number. | Unknown |

The Capterra sample (**53 reviews**) is **small** — smaller even than beehiiv's ~40 on G2.
Any consensus claim must be hedged accordingly.

Recurring **praise** (Capterra + T3): clean distraction-free editor; fast sites with
built-in SEO; genuine all-in-one (blog + newsletter + membership) without plugin sprawl;
modern design; independence / no algorithm.

Recurring **complaints** (Capterra + T3): limited plugin ecosystem vs WordPress;
customisation needs code; not for ecommerce/complex sites; self-host upgrades hard;
Stripe-only payments.

Do not convert §11 into vendor facts.

## 12. Target user positioning

Synthesis from official copy (T1) + review consensus (T2/T3):

- Ghost headline: **"Turn your audience into a business."** Positioning: an **independent,
  creator-owned publishing platform** — website + newsletter + membership in one, open
  source, "No investors. No bullshit.", "Escape the algorithm".
- Centre of gravity: **owning the whole publication** — your domain, your CMS, your
  member list, your revenue, with a real self-host exit.
- Best fit: writers/publishers/independent media who want a professional website and
  membership business and are comfortable with (or can hire) light technical setup.
- Natural contrast with beehiiv: Ghost = ownership, self-host option, integrated
  membership *site*, 0% fees, but you run more of it and pay from $18–29/mo with no free
  tier. beehiiv = hosted growth engine (recommendation network, ad network, referral
  program, paid recommendations), free Launch tier up to 2,500 subs, less ownership,
  faster to grow.

---

## Facts deliberately NOT to be stated as confirmed in any article

- Any Ghost(Pro) monthly-billed price (page shows yearly billing only).
- Any member-band price above the listed plan ceilings.
- Any Ghost free-trial length.
- Any specific Stripe / payment-processing percentage.
- Any G2 rating or review count.
- Any claim that Ghost "has no automation / no digital products" — frame only as "does
  not advertise a native X on its current pages", which is what was observed.
- Any self-host cost figure (infra varies).
- Any first-hand / hands-on usage claim.

## Draft status

**DRAFT_UNBLOCKED (with conditions).** Official pricing/feature facts for Ghost(Pro) are
observed and dated. Conditions before publish:

1. Re-confirm Ghost(Pro) plan prices, member limits, and the per-tier feature gates on
   the live pricing page and date them.
2. Keep the small Capterra sample (53) explicitly hedged; do not publish a G2 number.
3. Treat "0% fees from Ghost" as the confirmed monetisation fact; keep Stripe-only as a
   user-reported limitation.
4. Draft **only after** the beehiiv vs MailerLite article ships and passes all checks —
   per the work order, MailerLite is the first and only initial experiment.
5. Codex adversarial review of the finished draft.
