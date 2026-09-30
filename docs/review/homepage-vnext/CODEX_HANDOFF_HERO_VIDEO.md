# Codex handoff — vNext hero video review & repair

## Repository and branch

- Repository: `karasu12071128-creator/ai-affiliate-bot`
- Branch: `claude/creator-growth-home-vnext-m1y5m8` (work and push here only)
- Base: `main` @ `2441d06`
- Commit under review: `89eda2e` (hero video). Earlier vNext commits on the
  branch: `0ab1bba` (homepage), `156f278` (OWNER assets), `9d81714` (asset
  integration).

## Goal

The OWNER picked an 8-second Google Flow clip as the vNext homepage hero.
Claude Code integrated it. **Review and repair that integration**, don't
redesign it. The page layout, copy, and the clip itself are OWNER decisions
and out of scope.

## Rules to follow

Read these rather than a copy here: `AGENTS.md`, `CLAUDE.md` (HISHO Labs
root), `docs/SITE_RENEWAL_VNEXT_HOME.md` ("Hero video" section has the
source, encode settings, and rollback).

## Inspect first

- `src/lib/heroMedia.ts`: registry entry `vnext-hero-loop-v1`, `activeHeroMedia`
- `src/pages/index.astro`: `.hero-visual` block and the inline script at the end
- `src/styles/home.css`: `.hero-visual[data-media="true"]`, `.stage-media`,
  `.hero-motion-toggle`, the reduced-motion block, and the `max-width: 620px` block
- `tests/site-contract.test.mjs`: "the hero clip ships muted, looping, inline,
  pausable, and within budget"
- `scripts/check-site.mjs`: hero media section
- Assets: `public/media/vnext/hero-loop.mp4`, `hero-loop-poster.jpg`,
  `media-src/vnext/hero-loop-original.mp4` (master, sha256 starts `135aa3e9`)

## Review scope (in)

1. **Asset integrity:** the master in `media-src/` matches the recorded sha256;
   the web copy is 8.00 s, 1280x720, 24 fps, has no audio stream, and has
   faststart (`moov` before `mdat`). The poster is the final frame.
2. **Optimization:** is CRF 26 / 590 KB the right trade? Is it visibly
   degraded? Is a WebM or smaller mobile rendition justified? (The claim that
   it is not is recorded in the doc; challenge it with numbers if you disagree.)
3. **Mobile playback/fallback:** iOS Safari autoplay needs `muted` +
   `playsinline`; confirm. Low Power Mode or autoplay refusal must leave the
   poster with no dead control. Check the 4:3 crop at 70% at 390 and 430 px.
4. **Accessibility:** `role="img"` + label on `.hero-media-frame` (the video
   itself is `aria-hidden`); the pause/play button's name and `aria-pressed`;
   focus visibility; WCAG 2.2.2. Reduced motion must stop playback **and** the
   download, not only hide the video.
5. **Performance:** LCP, CLS, TBT, and transfer. Known limit: the local
   Lighthouse and Playwright Chromium has no H.264 decoder, so the recorded
   numbers measure the poster path and exclude decode cost. Verify in
   H.264-capable Chrome or Safari if you can.
6. **Test validity:** the new contract test fails when `muted` or the toggle is
   removed (mutation-checked); look for gaps, e.g. poster/src existence in the
   build is covered by `check:site`.
7. **No unintended route/SEO change:** diff `2441d06..HEAD` for `sitemap.xml.ts`,
   `robots.txt.ts`, `BaseLayout.astro` head, canonical, and the Search Console tag.
8. **Production safety:** nothing deploys; `media-src/` is not in the build
   output; no new dependency in `package.json`.

## Out of scope

Page design, copy, navigation, article content, the choice of clip, the
clip's loop seam (frame 191 → frame 0 is a hard cut, as generated), pricing
or affiliate links, and Pinterest.

## Acceptance criteria

- `npm test`, `npm run build`, `npm run check:site` all pass.
- No horizontal overflow at 390, 430, or 1440 px; the hero frame is never
  blank (playing, can't decode, reduced motion).
- The pause control appears only while the clip plays and works with a mouse
  and with the keyboard.
- Lighthouse a11y/SEO/best practices stay 100. Performance stays ≥ 90 on
  mobile, and any real regression is explained.
- Any repair is minimal, tested, and committed with a clear message.

## Checks before pushing

`git diff --stat 2441d06..HEAD` reviewed; no secrets or credentials in the
diff; `AGENTS.md`/`CLAUDE.md` untouched; `package.json` dependencies unchanged.
Leave unrelated local changes alone, and reuse the existing registry and
check scripts rather than adding new systems.

## Action boundaries

| Action | Status |
| --- | --- |
| Review, local build/test, fixes on this branch, push to this branch | GREEN |
| Re-encoding the web copy from the master in `media-src/` (keep the master unchanged) | GREEN |
| Changing the clip choice, adding new visual assets, redesign | OWNER_APPROVAL_REQUIRED |
| Merge to `main`, Cloudflare deploy, DNS/domain/Search Console changes | PROHIBITED |
| Writing to the OWNER's Google Drive, any paid API or new SaaS | PROHIBITED |

This handoff does not authorize merge, deployment, account access, paid use,
or any external write.

## Report back

Verdict (`PASS` / `REPAIRED` / `HOLD`); findings by severity with
file:line; repairs made with their commit SHAs; test, check, and Lighthouse
output; anything you could not verify (e.g. a real iOS device) marked
`UNVERIFIED`.

**Stop** after reporting. Don't merge and don't deploy.
