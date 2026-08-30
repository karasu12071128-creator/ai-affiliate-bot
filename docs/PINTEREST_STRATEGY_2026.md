# Pinterest Strategy 2026

Last updated: 2026-08-30

## SSOT Scope

This document is the long-term operating policy for the Creator Growth Tools Pinterest experiment. Board records live in `data/pinterest-boards.json`, Pin-level plans and metrics live in `data/pinterest-pin-experiments.json`, article publication history lives in `data/article-publication-log.json`, and affiliate approvals and URLs remain centrally managed in `data/affiliate-programs.yaml` and `src/lib/affiliateLinks.ts`.

Human setup already completed: Pinterest profile, initial Boards, and Website Claim. The current phase prepares measurement only. It does not authorize image generation, browser automation, Pin publishing, or bulk posting.

The machine-readable strategy contract is `data/pinterest-growth-engine-contract.json`. `scripts/pinterest-growth-review.mjs` validates the Pin registry and produces a deterministic `KEEP / MODIFY / MEASURE_MORE` review. `STOP` is supported by the policy vocabulary but requires human review in v0.1.

## Pinterest Role

Pinterest is a visual search and article-discovery channel, not an early follower-growth campaign.

```text
visual search
-> relevant Creator Growth Tools article
-> affiliate CTA
-> SaaS signup or trial
-> paid conversion
```

Pins should qualify the search intent and send readers to the most relevant owned article. Direct bulk linking from Pinterest to affiliate URLs is outside this strategy.

## Core KPI Priority

1. Outbound Clicks
2. Saves
3. Outbound Click Rate
4. Save Rate
5. Impressions
6. Affiliate Clicks
7. Signup / Trial
8. Sale / Commission

Follower count is not an initial KPI.

## Initial Content Model

The site currently has five published articles. Create five distinct search-intent concepts per article, producing a maximum initial experiment pool of 25 Pins.

```text
5 articles x 5 search intents = 25 Pins
```

Do not publish 25 Pins in bulk. Publish about one Pin per day, stop after the first 10 Pins, review Pinterest Analytics, then decide whether and how to produce the remaining 15. `docs/PINTEREST_MVP.md` is an existing idea bank, not permission to publish or the operational experiment record.

The first 10 local assets use the five existing articles with two comparable creative types per article: `comparison` and `checklist`. They are rendered from one deterministic `cgt-pin-v1` template. Local asset availability does not authorize deployment or publication; OWNER posts the initial batch manually one item at a time.

## Pinterest Policy

- Publish original content with unique value.
- Use the most relevant Board for each Pin.
- Do not create spam, fake accounts, artificial Saves, or engagement manipulation.
- Do not publish bulk repetitive affiliate Pins.
- Do not hide commercial intent when the destination contains affiliate links.
- Do not use URL shorteners.
- Use this default funnel: Pinterest -> owned article -> centrally managed affiliate CTA.
- Keep every Pin promise aligned with the destination article.

## Creative Rules

Static Pin baseline:

- 1000 x 1500 pixels
- 2:3 aspect ratio
- Large readable headline
- High contrast
- Mobile readability
- Concrete benefit
- Save-worthy hook
- One clear promise

The brand name is `Creator Growth Tools`. Do not use `Creator Growth Guides`.

Recommended hook patterns:

- SAVE THIS LIST
- COMPARE BEFORE YOU CHOOSE
- READ THIS BEFORE YOU PICK A PLATFORM
- WHICH ONE IS ACTUALLY BETTER?
- BEST TOOLS FOR SOLO CREATORS
- DON'T CHOOSE BEFORE READING THIS

Hooks must not become misleading clickbait. The article must directly satisfy the promise.

## URL and Attribution

Every Pin destination must use the UTM rules in `docs/ANALYTICS_PLAN.md`:

```text
utm_source=pinterest
utm_medium=organic_pin
utm_campaign=<article-or-experiment>
utm_content=<pin_id>
```

UTM parameters are for Pinterest destination URLs only. Canonical, sitemap, JSON-LD, and internal article URLs remain clean.

## Article Publication Log Integration

`article_slug` in the Pin experiment registry joins to `slug` in `data/article-publication-log.json`. Keep each existing `pinterest_assets` array unchanged until a Pin is actually published. After publication and URL verification, append only that published `pin_id` to the matching article's `pinterest_assets` array. Do not add drafts, failed assets, or unpublished IDs.

## Analytics Review Schedule

| Review | Decision focus |
| --- | --- |
| Day 0 | Record the published Pin, destination URL, and baseline |
| Day 14 | Confirm indexing and initial Impressions |
| Day 30 | Review Saves, Outbound Clicks, Save Rate, and Outbound CTR |
| Day 60 | Review article traffic and Affiliate Clicks |
| Day 90 | Continue, improve, or stop the experiment |

Do not overreact to daily fluctuations during the initial indexing period. Record the scheduled review snapshots and compare Pins by search intent, article, hook, and Board.

Until the existing 10-Pin checkpoint is reached with comparable observations, the Growth Engine must return `INSUFFICIENT_DATA / MEASURE_MORE` and must not invent winner allocations. After the checkpoint it may identify directional leaders by Outbound Click Rate and Save Rate, but these are not causal claims.

## Kit Reapplication Gate

Kit is currently `rejected_reapply_later`. Review reapplication only after these conditions are met:

- At least 10 Pinterest Pins are published.
- All five Creator Growth Tools articles remain published.
- Editorial Methodology remains publicly accessible.
- Pinterest profile and Boards are complete.
- Initial Pinterest traffic evidence is available when possible.

The first formal reapplication review occurs after the 10-Pin Analytics checkpoint. Reapplication, program terms, tax details, and personal information remain human approval actions.
