# Creator Growth Tools — Homepage vNext prototype

Status: `READY_FOR_CODEX_FINALIZATION / NOT_MERGED / NOT_DEPLOYED`

Next owner: Codex, per `docs/review/homepage-vnext/CODEX_FINALIZATION_CONTRACT.md`
(integration points, SEO contract, do-not-expose list, protected files).
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

## Hero video (2026-09-30)

Source: Google Drive `SHIORI_MASTER_ASSETSwebsite/931371290_1790745061840991.mp4`
(file id `1oBO88brGh-2JPBoekHnfbwJmaqqkcTVf`, uploaded 2026-09-30 05:11 UTC).
The only clip in that folder newer than the vNext concept; V1/V2 there date
from 2026-09-09 and predate it. 1280x720, 24 fps, 8.00 s (192 frames), H.264
High + AAC stereo, 1.89 MB, sha256 `135aa3e9…10bb42`.

| File | What | Size |
| --- | --- | --- |
| `media-src/vnext/hero-loop-original.mp4` | Master, byte-identical, outside `public/` (never deployed) | 1,892,812 B |
| `public/media/vnext/hero-loop.mp4` | Web copy: no audio, H.264 CRF 26 veryslow, 2 s GOP, faststart; SSIM 0.993 / PSNR 48 dB vs master; not upscaled | 589,833 B |
| `public/media/vnext/hero-loop-poster.jpg` | Final frame (the decision state), 1280x720 | 32,037 B |

No WebM: VP9 stayed near 40 dB PSNR even at 756 KB, and at comparable size
H.264 CRF 28 still measured higher, so a second format would not have paid
for itself.

Behaviour: `autoplay muted loop playsinline`, poster, no native controls,
`preload="metadata"`. The frame paints the poster as its background, so it is
never empty (before play, if the clip cannot decode, under reduced motion).
Reduced motion: the clip never plays and its `src` is dropped, so nothing
more downloads; the poster stays. A small pause/play button (WCAG 2.2.2)
appears only once the clip is actually playing. The clip pauses off screen.
Frame: 16:9 on desktop; 4:3 on phones at `object-position: 70%`, which keeps
Shiori and the decision panel in frame through the loop.

Rollback: set the clip's `approved: false` in `src/lib/heroMedia.ts`; the
approved key-visual still renders instead (only one of the two is rendered).

## Content and disclosure pass (2026-09-30)

- Reader-facing trust pages: How We Make Money (`/affiliate-disclosure/`),
  Editorial Policy (`/editorial-methodology/`), How We Review
  (`/how-we-test/`). The URLs are unchanged. Program status, link plumbing,
  and ops notes were removed from public copy; the material-connection
  disclosure still names every brand that can pay us.
- Priority articles polished (see commit `2c3ac0e`). `lastVerifiedDate` is
  unchanged because no facts were re-verified.
- `SECOND_SHIORI_VIDEO_SLOT`: the brand band (`#brand`) with a static fallback,
  ready for a `"brand-band"` registry entry.

## Asset gaps

| Marker | Where | What is needed |
| --- | --- | --- |
| `TERMS_PAGE_REQUIRED` | footer | No terms page exists, so no link was invented. |

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
