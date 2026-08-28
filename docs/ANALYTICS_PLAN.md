# Analytics Plan

## MVP Tools

- Cloudflare Web Analytics: page views, landing pages, referral sources
- Pinterest Analytics: impressions, saves, outbound clicks
- Affiliate dashboards: clicks, signups, trials, paid conversions, commission

GA4 is intentionally not included in the MVP unless a later measurement gap justifies it.

## Affiliate Click Event Design

Event name: `affiliate_click`

Properties:

- `product`: `kit`, `beehiiv`, or `activecampaign`
- `article`: article slug
- `placement`: `top_cta`, `bottom_cta`, or future named placements

Example:

```text
affiliate_click
product=kit
article=kit-vs-beehiiv
placement=top_cta
```

## Implementation Notes

CTA links include `data-event`, `data-product`, `data-article`, and `data-placement` attributes. `public/analytics.js` dispatches a lightweight browser event without adding a heavy analytics dependency.

For actual collection, use one of these after launch:

- Affiliate dashboard click reporting, if affiliate links are approved
- Cloudflare Zaraz or a tiny Cloudflare Pages Function, if onsite custom click collection is required
- GA4 only if the MVP needs deeper campaign attribution

## Pinterest Destination UTM Rules

Pinterest Pins must link to the relevant Creator Growth Tools article with these parameters:

```text
utm_source=pinterest
utm_medium=organic_pin
utm_campaign=<article-or-experiment>
utm_content=<pin_id>
```

Example:

```text
https://ai-affiliate-bot.pages.dev/kit-vs-beehiiv/?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=kit-vs-beehiiv&utm_content=pin001
```

Rules:

- Use lowercase, stable campaign and Pin IDs.
- `utm_campaign` identifies the article slug or a documented experiment.
- `utm_content` must match `pin_id` in `data/pinterest-pin-experiments.json`.
- UTM parameters belong only on the Pinterest destination URL.
- Canonical tags, sitemap URLs, JSON-LD URLs, and internal article links must never include UTM parameters.
- Pinterest sends traffic to an owned article first. Do not replace the destination with a direct affiliate URL.
