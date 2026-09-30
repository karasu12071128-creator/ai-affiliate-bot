# Codex finalization contract — Creator Growth Tools vNext

Supersedes `CODEX_HANDOFF_HERO_VIDEO.md`, whose review scope is included
below as item V1.

## Repository and branch

- Repository: `karasu12071128-creator/ai-affiliate-bot`
- Branch: `claude/creator-growth-home-vnext-m1y5m8` (push here only)
- Base: `main` @ `2441d06` (Search Console verification tag). `main` has
  not moved.
- Content and slot work: `2c3ac0e`. This contract is committed on top of it.
- Branch history: `0ab1bba` homepage → `156f278` OWNER stills →
  `9d81714` still integration → `89eda2e` hero clip → `3ca3e15` video
  handoff → `2c3ac0e` content, disclosure, and brand-band slot
- Working tree: clean at hand-off.

## Goal

Content, information architecture, and public copy are finished. Codex owns
the **final visual integration** (the two OWNER videos) and the **final QA**
before any OWNER merge decision. Don't redesign, and don't rewrite articles.

Read rather than copy: `AGENTS.md`, `CLAUDE.md` (HISHO Labs root),
`docs/SITE_RENEWAL_VNEXT_HOME.md`.

## Current routes (sitemap, 21 URLs; built via `npm run build`)

`/` `/articles/` `/topics/` `/topics/newsletter-email/` `/topics/ai-voice/`
`/how-we-test/` (How We Review) `/editorial-methodology/` (Editorial Policy)
`/affiliate-disclosure/` (How We Make Money) `/about/` `/contact/`
`/privacy-policy/`, plus 10 articles: `/beehiiv-alternatives/`
`/beehiiv-review/` `/beehiiv-vs-mailerlite/` `/beehiiv-vs-substack/`
`/best-email-marketing-for-solopreneurs/`
`/best-email-marketing-tools-for-creators/` `/best-newsletter-platforms/`
`/elevenlabs-for-short-form-video/` `/kit-review/` `/kit-vs-beehiiv/`.
Only the page titles were renamed; **no URL changed**. Search = `/articles/#search`
(client-side filter, not a route).

## Video integration points

| Slot | Registry | Markup | Now | Static fallback |
| --- | --- | --- | --- | --- |
| Hero | `src/lib/heroMedia.ts`, placement `"hero-visual"` (entry `vnext-hero-loop-v1`) | `.hero-visual` in `src/pages/index.astro` | OWNER clip `931371290_…mp4` live (590 KB, poster 32 KB) | `heroStill` = `public/media/vnext/hero-key-visual.png`, rendered only when no hero clip is approved |
| Brand band (`SECOND_SHIORI_VIDEO_SLOT`) | same file, placement `"brand-band"` (no entry yet) | `#brand .brand-visual` in `index.astro` | Static still | Key visual while the hero plays a clip; transparent mascot if the hero has reverted to the still |

How to fill a slot: add one registry entry (`src`, `poster`, `width`,
`height`, `provenance`, `approved: true`, `placement`). The markup, lazy
loading, poster background, pause control, reduced-motion stop, and
`check:site` verification are already in place. The brand clip gets its
`src` from `data-src` only when scrolled near, so it adds no weight at first
load. Rollback for either slot is `approved: false`.

The frames have fixed ratios: 16:9 on desktop and 4:3 on phones, where the
crop is `object-position: 70%` for the hero and 68% for the brand band. A
new clip should suit that crop; adjust `object-position` per clip if it
doesn't.

## Remaining work for Codex

**V1. Review the live hero clip.** Scope is as in `CODEX_HANDOFF_HERO_VIDEO.md`:
- asset integrity (master sha256 `135aa3e9…`, no audio, faststart);
- the CRF 26 trade-off;
- iOS Safari autoplay and Low Power Mode fallback;
- the accessibility of the `role="img"` frame and the pause toggle;
- **real H.264 playback**, which the Claude environment couldn't decode.

**V2. Locate and integrate the two OWNER videos** ("mascot Shiori × cosmic /
near-future" and "regular Shiori"):
- Only one new clip was visible through the Drive connector on 2026-09-30,
  in `SHIORI_MASTER_ASSETSwebsite`, and it is the one already in the hero.
  The second video was **not found**. Ask OWNER where it is instead of guessing.
- Which clip goes in which slot is an OWNER decision. If it isn't stated,
  report the candidates and stop.
- Encode each clip the way the hero was encoded (see the doc). Keep masters in
  `media-src/`, never in `public/`. Keep each web clip under 1 MB and each
  poster under 150 KB (the contract test enforces both).

**V3. Final visual QA** at 390, 430, and 1440 px, in real Safari and Chrome:
- no overflow;
- no frame ever blank;
- the headline and CTAs never covered.

**V4. Minor visual TODOs** (optional; OWNER may waive):
- the desktop H1 sets "work." alone on its fourth line;
- each loop hard-cuts from frame 191 back to frame 0, as generated;
- the footer links "How We Make Money" and "Affiliate Disclosure" both go to
  one page, which OWNER asked for.

## SEO, canonical, and Search Console contract — do not change

- `site` stays `https://ai-affiliate-bot.pages.dev` (`astro.config.mjs`,
  `src/site.ts`).
- `<link rel="canonical">` is built from `canonicalPath ?? pathname` in
  `src/layouts/BaseLayout.astro`.
- Keep the `google-site-verification` meta in `BaseLayout.astro` exactly as it is.
- The sitemap strategy (`src/pages/sitemap.xml.ts`), `robots.txt.ts`, and
  JSON-LD publisher block stay unchanged. Tests guard the tag and the
  sitemap↔route parity.

## Must not be exposed publicly

The `public pages expose no internal…` test enforces this list:
- affiliate program status (Active, None, pending, rejected, "not yet linked");
- `rel="sponsored"` or other link plumbing explained to readers;
- application history;
- lab or pipeline state, Current Lab, GitHub or experiment status;
- analytics or ops notes (Pinterest, dashboards);
- HISHO Labs internal operations.

Allowed: the publisher name "HISHO Labs", and the material-connection
disclosure. `/affiliate-disclosure/` must keep naming the brands that can pay
us, which is derived from the registry.

## Files not to modify without need

- `src/lib/affiliateLinks.ts` (affiliate URLs, statuses) and
  `data/affiliate-programs.yaml`. These are the SSOT, and changes need OWNER.
- `src/content/articles/*.md`: the content is final for this phase, and
  there is to be no fact changes without re-verification.
- `src/layouts/BaseLayout.astro` head, `sitemap.xml.ts`, `robots.txt.ts`,
  `astro.config.mjs`, `src/site.ts`.
- `scripts/referral-guard.mjs`, and the affiliate and exclusivity tests in
  `tests/site-contract.test.mjs`. Extend them, never weaken them.
- `public/media/vnext/*` stills and `media-src/vnext/hero-loop-original.mp4`
  (OWNER assets). Never re-encode over a master.
- `AGENTS.md`, `CLAUDE.md`.

## Tests (all green at `2c3ac0e`)

- `npm test`: 59/59.
- `npm run build`: 22 pages, no warnings. If you see "Duplicate id"
  warnings, they come from a stale `.astro/` cache; `rm -rf .astro` clears them.
- `npm run check:site`: PASS. Hero media shipped 1, brand media shipped 0.
- Lighthouse 12 (local, headless Chromium without H.264): 100/100/100/100 on
  `/` (mobile and desktop), `/beehiiv-vs-substack/`, and `/affiliate-disclosure/`
  (mobile). CLS 0 everywhere.
- The brand-band slot was verified end to end with a temporary registration
  (then reverted): no `src` before view, plays on scroll, pause shown, and
  under reduced motion no source and a poster only.

## Action boundaries

| Action | Status |
| --- | --- |
| Visual integration, QA fixes, and re-encodes from masters on this branch; push to this branch | GREEN |
| Reading OWNER Drive video metadata and downloads (read-only) | GREEN |
| Choosing which clip goes in which slot when OWNER hasn't said | OWNER_APPROVAL_REQUIRED |
| Article fact changes, new visual assets, a redesign, affiliate registry changes | OWNER_APPROVAL_REQUIRED |
| Merging to `main`, Cloudflare production deploy, DNS/domain/Search Console changes | PROHIBITED |
| Writing to OWNER Drive, any paid API or new SaaS, social publishing | PROHIBITED |

Leave unrelated local changes alone and reuse the existing registry, tests,
and check scripts. This contract does not authorize merge, deployment,
account access, paid use, or any external write.

## Report back

Verdict (`FINALIZED` / `REPAIRED` / `HOLD`); what went into each slot, with
its provenance; findings by severity with file:line; commit SHAs; test,
check, and Lighthouse output; anything unverified (a real iOS device, the
second video's location) marked `UNVERIFIED`.

**Stop** after reporting. Don't merge and don't deploy.
