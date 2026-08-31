# Research Snapshot — 2026-08-31

Purpose: record the official-source facts verified on 2026-08-31 for the beehiiv content expansion
(`beehiiv-review`, `beehiiv-vs-substack`, `best-newsletter-platforms`).

Only facts observed on an official vendor page on 2026-08-31 are marked `OBSERVED`.
Facts carried over from `RESEARCH_SNAPSHOT_2026-08-22.md` keep their original observation date.
Sources that could not be reached are marked `BLOCKED` and are not presented as re-verified.

## beehiiv — pricing (OBSERVED 2026-08-31, https://www.beehiiv.com/pricing)

The pricing page has a subscriber slider. All prices below are the values displayed at the
**default 1,000-subscriber position**. Prices rise with list size.

| Plan | Displayed price | Annual billing | Subscriber ceiling shown |
| --- | --- | --- | --- |
| Launch | $0/month | — | Up to 2,500 subscribers |
| Scale | $43 per month | "$517 billed annually", "Save $71/year" | 100,000 |
| Max | $96 per month | "$1,151 billed annually", "Save $157/year" | 100,000 |
| Enterprise | Custom pricing | — | 100K+ subscribers |

Launch includes: newsletters, website and podcast, campaign analytics, unlimited email sends,
recommendation network, optimized deliverability, custom domains, link-in-bio, AI website builder,
API access (excluding Send API), beehiiv MCP (read access), beehiiv Agent (read access).

Scale adds: Ad Network, Recommendations, 0% take rate on paid subscriptions, Digital Products,
Community, Email Automations, Surveys & Polls, advanced website analytics, Webhooks,
beehiiv MCP and Agent (write access), Teams (3 seats), Slack community access, human support.

Max adds: remove beehiiv branding, Sponsorship Storefront, audio newsletters,
Digital Products (Appointments), RSS to Send, up to 10 publications, Teams (unlimited seats),
priority human support, Getty image credits, dynamic content, AI bot control, Send API,
group subscriptions, click-triggered automations.

Enterprise adds: concierge onboarding, dedicated account manager, dedicated IP addresses,
random cohort sends, custom publication limits, VIP human support, SSO.

Free trial length: `NOT_SHOWN` on the pricing page. The page shows "Try for free" buttons and a
free-forever Launch plan, but no trial duration. **Do not state a trial length in any article.**

## beehiiv — partner program (OBSERVED 2026-08-31, https://www.beehiiv.com/partners)

| Item | Observed |
| --- | --- |
| Commission tiers | Launch 0%, Bronze 50%, Silver 55%, Gold 60% |
| Headline | "Earn up to 60% of revenue from your referrals for a full year" |
| Cookie window | "Cookies are valid for 60-days" |
| Payout | 15th of each month, prior month's earnings, via PayPal |

**Editorial decision: do not publish the commission percentages in reader-facing articles.**
Articles disclose that an active beehiiv affiliate relationship exists and that it did not decide
the conclusions. The exact terms live here, in the internal record, and in
`data/affiliate-programs.yaml`.

## Substack — cost model (OBSERVED 2026-08-31, https://substack.com/going-paid)

Verbatim: "Writers keep 90% of their revenue minus credit card fees."

| Item | Observed |
| --- | --- |
| Monthly platform fee | `NOT_SHOWN` |
| Subscriber limit | `NOT_SHOWN` |
| Card processing fee percentage | `NOT_SHOWN` on this page |

`https://support.substack.com/hc/en-us/articles/360037607131` returned **HTTP 403** on 2026-08-31.
The 10% platform share and the specific Stripe rates were therefore **not verified from an official
page today**. Articles state only the observed "keep 90% minus credit card fees" wording and say
that card fees are set by the payment processor and vary by country.

**Do not publish a specific Stripe percentage.** `https://stripe.com/pricing` resolved to the
Japanese pricing page (3.6%, Billing 0.7%), which is region-specific and not the reader's rate.

## Ghost — pricing (OBSERVED 2026-08-31, https://ghost.org/pricing/)

| Plan | Displayed price | Members at that price |
| --- | --- | --- |
| Starter | $18/month billed yearly | 1,000 |
| Publisher | $29/month billed yearly | 1,000 |
| Business | $199/month billed yearly | 10,000 |
| Custom | Contact for pricing | Unlimited |

Ghost takes 0% from paid subscriptions; payment processor fees still apply.
The Ghost software is open source and free to self-host.
Monthly-billing prices: `NOT_SHOWN` (page displayed yearly billing).

## Kit — pricing (OBSERVED 2026-08-31, https://kit.com/pricing)

| Plan | Displayed price | Subscribers |
| --- | --- | --- |
| Free | $0/month | Up to 10,000 |
| Creator | $33/month ($390/year, save $78) | 1,000 (slider default) |
| Pro | $66/month ($790/year, save $158) | 1,000 (slider default) |

Free includes unlimited landing pages and forms, unlimited broadcasts, tagging and segmentation,
and selling digital products and subscriptions. Creator adds unlimited visual automations and
unlimited sequences. The free plan's automation allowance was `NOT_SHOWN` as a number on the page
on 2026-08-31, so the older "one basic Visual Automation" phrasing is **not** repeated in the new
articles; they say only that unlimited visual automations begin on Creator.

## MailerLite — pricing (OBSERVED 2026-08-31, https://www.mailerlite.com/pricing)

| Plan | Displayed price | Subscribers | Monthly emails |
| --- | --- | --- | --- |
| Free | $0/month | Up to 250 | 2,500 |
| Comfort | From $12/month | `NOT_SHOWN` at default | 10× the subscriber-tier ceiling |
| Power | From $25/month | `NOT_SHOWN` at default | Unlimited (fair use) |
| Enterprise | Custom | 200K+ | Custom |

**Plan names changed.** The 2026-08-22 snapshot and the existing articles predate the
`Comfort` / `Power` naming. This is a refresh trigger for
`best-email-marketing-tools-for-creators` and `best-email-marketing-for-solopreneurs`,
recorded here and in `Management/` as follow-up work. It is **not** fixed in this Work Order.

## Review marketplace data — NOT RE-VERIFIED 2026-08-31

| Source | Result on 2026-08-31 |
| --- | --- |
| `https://www.g2.com/products/beehiiv/reviews` | **HTTP 403 — BLOCKED** |

Carried forward from `RESEARCH_SNAPSHOT_2026-08-22.md`, with the original observation date
stated in the articles:

- beehiiv: G2 4.5/5 from 40 reviews (observed 2026-08-22).
- Kit: G2 4.4/5 from 236 reviews; Capterra 4.6/5 from 243 reviews (observed 2026-08-22).

Articles attribute these to "our last verified check on August 22, 2026" rather than presenting
them as current on 2026-08-31. No new rating or review count was invented.

## Facts deliberately NOT stated in the new articles

- Any beehiiv free-trial length.
- Any specific Substack platform-fee percentage sourced from a page we could not load today.
- Any specific Stripe or card-processing percentage.
- Any beehiiv commission percentage.
- Any beehiiv or Substack review rating dated 2026-08-31.
- Any first-hand or hands-on usage claim for any product.
