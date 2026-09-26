# Creator Growth Tools — Homepage vNext prototype

Status: `HOMEPAGE_VNEXT_READY_FOR_OWNER_REVIEW / NOT_MERGED / NOT_DEPLOYED`
Branch: `claude/creator-growth-home-vnext-m1y5m8`
Base: `main` @ `2441d06` (Search Console verification tag)
Date: 2026-09-26

Direction: editorial × near-future × decision-support publication.
Brand line: **Choose by fit, not hype.**

Screenshots (reduced-motion render, local `astro preview`):

- `docs/review/homepage-vnext/desktop-1440.png`
- `docs/review/homepage-vnext/mobile-390.png`
- `docs/review/homepage-vnext/mobile-430.png`
- `docs/review/homepage-vnext/mobile-390-menu.png` (menu open)

## Sections

1. Header: Decision Guides, Newsletter, AI Voice, Creator Growth, How We Review,
   Search. No Subscribe, because there is no newsletter capture path.
   On mobile the nav folds into a one-tap menu button (progressive
   enhancement: without JS the links wrap and stay usable).
2. Hero: eyebrow, H1, supporting copy, "Find my fit" / "Browse comparisons",
   three credibility points, and a static visual (question cards → one
   decision panel) with the Shiori slot saying "Start here."
3. "What are you trying to decide?": five decision cards.
4. "Decisions creators are making now": four image-led article cards.
5. Methodology: four steps + "See our methodology →".
6. Compact reader-facing disclosure + "How we make money →".
7. Footer: About, How We Review, Editorial Methodology, How We Make Money,
   Affiliate Disclosure, Contact, Privacy. Publisher: HISHO Labs.

## Routes used

| Card | Route | Note |
| --- | --- | --- |
| Start a newsletter | `/best-newsletter-platforms/` | |
| Leave beehiiv | `/beehiiv-alternatives/` | |
| Compare two platforms | `/kit-vs-beehiiv/` | |
| Add AI voice | `/topics/ai-voice/` | from the category registry |
| Grow on YouTube | `/elevenlabs-for-short-form-video/` | nearest real guide (monetized YouTube Shorts); no YouTube-growth guide exists |
| Article: beehiiv alternatives | `/beehiiv-alternatives/` | |
| Article: beehiiv vs Substack | `/beehiiv-vs-substack/` | |
| Article: beehiiv vs MailerLite | `/beehiiv-vs-mailerlite/` | |
| Article: ElevenLabs for short-form | `/elevenlabs-for-short-form-video/` | |
| Nav: Decision Guides | `/articles/` | |
| Nav: Newsletter | `/topics/newsletter-email/` | |
| Nav: AI Voice | `/topics/ai-voice/` | |
| Nav: Creator Growth | `/topics/` | no dedicated creator-growth category yet |
| Nav: How We Review | `/how-we-test/` | |
| Nav: Search | `/articles/#search` | client-side filter over the guide list; no new route, no index file |
| See our methodology | `/editorial-methodology/` | |
| How we make money | `/affiliate-disclosure/` | |

No new route was created. The sitemap is unchanged.

## Asset gaps

| Marker | Where | What is needed |
| --- | --- | --- |
| `HERO_VIDEO_ASSET_REQUIRED` | `src/lib/heroMedia.ts` | A 6–8s muted loop + poster framed for the hero visual frame (bright ground, Shiori small). Register with `placement: "hero-visual"`. The existing `shiori-hero-16x9-v1` clip is still approved and on record but is **not** reused: it is a photoreal full-frame presenter on a dark set, which inverts the vNext hierarchy. |
| `SHIORI_MASCOT_ASSET_REQUIRED` | `src/lib/shiori.ts` | An approved Shiori illustration (SVG or small WebP). Until then the slot shows a restrained pale-pink bookmark mark (栞). |
| `ARTICLE_CARD_IMAGE_REQUIRED` | `src/lib/editorialMedia.ts` | Four editorial images, 16:10, served from `public/`. Until then each card shows an on-palette CSS composition; the built HTML carries `data-asset-required="ARTICLE_CARD_IMAGE_REQUIRED"` on each. **Replace before production.** |
| `TERMS_PAGE_REQUIRED` | footer | The brief lists Terms; no terms page exists, so no link was invented. |

All three slots have fixed aspect ratios, so dropping in the assets causes no
layout shift. Every asset is gated on `approved: true` plus provenance.

## Disclosure changes

- The homepage now carries one compact, reader-facing statement: some links
  are affiliate links, we may earn a commission at no extra cost, and it does
  not determine coverage or recommendations. It links to `/affiliate-disclosure/`.
- `/affiliate-disclosure/` is unchanged: the full relationship table, per-link
  labels, and `rel="sponsored"` explanation stay there for full transparency.
- The footer keeps the standing affiliate statement on every page.

## Removed from the homepage

- Current Lab (`src/lib/lab.ts` is kept and still tested; it is no longer
  rendered on the homepage)
- The four-pillar rail with "Not open yet" / "First workflow in progress"
- The coverage instrument (tracked-product counts, matchup kicker)
- "Extending next into … nothing is published" planned-topic notice
- Evidence-grade chips and "Most recent fact check" stamp on the homepage
  (they remain on every article)
- The dark v0.4 stage and its full-bleed presenter video

## Tests and checks

- `npm test`: 57 pass / 0 fail.
  - Superseded: "a pillar with nothing published is not presented as a
    destination" (the rail is gone). Replaced by "every homepage decision card
    points at a page that exists" (mutation-checked: a bad slug fails it).
  - Added: editorial cards reference real articles and gate images on
    approval; the homepage exposes no lab/pipeline/program-status language.
  - Updated: hero media gating now accepts a placement argument; the
    reduced-motion rule is asserted in `home.css`.
- `npm run build`: 22 pages.
- `npm run check:site`: PASS (links, sitemap, link labelling, headings,
  hero media flag now read from `.hero-visual`).
- Lighthouse 12 (local preview, headless Chromium):
  mobile 100/100/100/100, desktop 100/100/100/100 (perf/a11y/best
  practices/SEO). LCP 1.0s mobile / 0.3s desktop, CLS 0, TBT 0ms.
- Horizontal overflow: none at 390, 430, 1440 (`scrollWidth == clientWidth`).

## SEO preservation

Unchanged: domain, canonical logic, Search Console verification tag,
sitemap, robots, JSON-LD publisher. Homepage `<title>` is now
"Find the tool that fits how you actually work | Creator Growth Tools" and the
meta description uses the new supporting copy.
