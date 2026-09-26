# Creator Growth Tools — Homepage vNext prototype

Status: `VISUAL_INTEGRATION_READY_FOR_OWNER_REVIEW / NOT_MERGED / NOT_DEPLOYED`
Branch: `claude/creator-growth-home-vnext-m1y5m8`
Base: `main` @ `2441d06` (Search Console verification tag); approved assets @ `156f278`
Date: 2026-09-26

Direction: editorial × near-future × decision-support publication.
Brand line: **Choose by fit, not hype.**

Screenshots (local `astro preview`), `docs/review/homepage-vnext/`:

1. `1-desktop-full.jpg`
2. `2-desktop-first-viewport.jpg`
3. `3-m390-first-viewport.jpg`
4. `4-m390-articles.jpg`
5. `5-m430-first-viewport.jpg`
6. `6-m430-articles.jpg`
7. `7-m390-shiori-decisions.jpg`

## Approved visual assets (integrated)

Source files in `public/media/vnext/` (OWNER, commit `156f278`) are never
altered. They are imported through `astro:assets`, so the build (sharp, already
an Astro dependency) emits AVIF/WebP/JPEG derivatives at the widths used, with
explicit width/height. The page never ships the 1.3 MB source PNGs.

| Asset | Where | Loading |
| --- | --- | --- |
| `hero-key-visual.png` | Hero frame, 16:10 desktop, 4:3 crop (`object-position: 68%`) on phones | eager, `fetchpriority="high"` |
| `shiori-mascot.png` | `ShioriGuide` beside "What are you trying to decide?", bubble "Start here." | lazy |
| `article-newsletter-01.jpg` | beehiiv alternatives card | lazy |
| `article-newsletter-02.jpg` | beehiiv vs Substack card | lazy |
| `article-creator-growth.jpg` | beehiiv vs MailerLite card (kicker "Audience growth") | lazy |
| `article-ai-voice.jpg` | ElevenLabs for short-form video card | lazy |

Placement decisions:

- The hero key visual already contains Shiori and a "Start here." bubble, so
  the standalone mascot is not layered over the hero (two Shioris side by side).
  She sits beside the decision cards, where the reader actually starts.
- No article is about YouTube growth. The creator-growth image goes on
  beehiiv vs MailerLite, whose question is "growth platform or low-cost
  sender?"; the AI voice image goes on the ElevenLabs guide.

## Sections

1. Header: Decision Guides, Newsletter, AI Voice, Creator Growth, How We Review,
   Search. No Subscribe, because there is no newsletter capture path.
   On mobile the nav folds into a one-tap menu button (progressive
   enhancement: without JS the links wrap and stay usable).
2. Hero: eyebrow, H1, supporting copy, "Find my fit" / "Browse comparisons",
   three credibility points, and the approved key visual.
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
| `HERO_VIDEO_ASSET_REQUIRED` | `src/lib/heroMedia.ts` | A 6–8s muted loop framed for the hero frame, after the static visual is approved. The slot layers over the approved still; reduced motion drops it. |
| `TERMS_PAGE_REQUIRED` | footer | No terms page exists, so no link was invented. |

`SHIORI_MASCOT_ASSET_REQUIRED` and `ARTICLE_CARD_IMAGE_REQUIRED` are resolved
by the approved assets; the CSS placeholder art and the bookmark fallback are removed.

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

- `npm test`: 57 pass / 0 fail. Contract tests updated for real images:
  raw `<img>`/`<picture>` stay banned in page source; every `<Picture>` must
  bind a registry entry gated on approval; every imported still must live in
  `public/media/vnext/` and exist.
- `npm run build`: 22 pages, no warnings.
- `npm run check:site`: PASS. The alt check now accepts a bare `alt` (Astro's
  serialisation of `alt=""` for decorative images); a fixture with a missing
  alt still fails.
- Rendered check: no broken images, no horizontal overflow at 390/430/1440.
  Hero image fully inside the first viewport at 390x844 and 430x932.
- Lighthouse 12 (local preview): mobile and desktop 100/100/100/100.
  Mobile LCP 1.1s, CLS 0, TBT 40ms, 57 KiB total; desktop LCP 0.3s, CLS 0,
  83 KiB total.

## SEO preservation

Unchanged: domain, canonical logic, Search Console verification tag,
sitemap, robots, JSON-LD publisher. Homepage `<title>` is now
"Find the tool that fits how you actually work | Creator Growth Tools" and the
meta description uses the new supporting copy.
