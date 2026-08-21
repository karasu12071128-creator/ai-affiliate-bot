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
