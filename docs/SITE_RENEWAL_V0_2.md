# Creator Growth Tools — Renewal v0.2 (Impact / Modernity / Brand Lift)

Status: `CLAUDE_CANDIDATE_READY / CODEX_REVIEW_PENDING / NOT_MERGED / NOT_DEPLOYED`
Branch: `feat/creator-growth-site-renewal-v0-2`
Base: `feat/creator-growth-site-renewal-v0-1` @ `dd1a654255207d19a350da9d91870a1eacdb70d0`
Date: 2026-09-07

v0.1 was reviewed as trustworthy but "too plain, too static, too disclosure-forward,
not memorable enough". v0.2 keeps every trust mechanism v0.1 introduced and changes
what the reader meets first. Company-side strategy SSOT is unchanged:
`HISHO_OS/Projects/PinterestGrowthEngine/OVERSEAS_AFFILIATE_STRATEGY_V2.md` and
`WEBSITE_IA_REVIEW_V2.md`.

## Design direction — "the desk"

One direction, chosen and committed to rather than offered as options.

A comparison desk, not a blog and not a landing page. The site opens on a single
dark, cinematic slab carrying the question the site exists to answer, next to one
instrument that proves the site is a working comparison desk. Everything below the
slab returns to the v0.1 paper editorial system, so the contrast is an event rather
than a theme.

Three rules held the direction honest:

1. **The impact is scale, inversion and one rationed colour — not decoration.**
   No image, no web font, no gradient wash, no glassmorphism. The hero costs zero
   extra network requests, which matters because arrivals are Pinterest and
   short-form mobile traffic.
2. **The signal colour is warm gold on green-black.** Mint, violet, or an indigo
   gradient on near-black is the current generated-landing-page default; it was
   avoided deliberately. Gold on ink reads editorial and print-derived.
3. **The instrument shows real coverage.** Every figure in the hero panel is
   counted from the article collection at build time. Nothing in it is hand-typed,
   so it cannot drift from what is actually published, and it cannot become a
   fabricated metric.

## What changed

| Area | v0.1 | v0.2 |
| --- | --- | --- |
| Hero | Paper, text-only: eyebrow, headline, paragraph, empty presenter slot | Dark full-bleed stage, display headline at `clamp(2.6rem, 6.6vw, 4.5rem)`, one gold accent word, paper-on-ink primary CTA plus a secondary route |
| Headline | "Creator tools, checked against the evidence." (method-led) | "Which creator tool is *actually* worth paying for?" (reader-question-led) |
| Visual hook | None | Coverage instrument: the real head-to-head, articles covering both, last verified date, per-tool coverage counts — all derived |
| Position 2 on the page | Verification strip, including "Affiliate relationships, disclosed" | "Why these comparisons are different" — method, not trust plea |
| Trust copy | 4 principles + 4-item verification strip + closing trust band | 3 method columns + one dated fact-check stamp |
| Disclosure on homepage | In the hero paragraph, in the verification strip, and in the closing band | One complete statement in a quiet closing band, plus the standing footer statement and the unchanged per-article labels |
| Presenter slot | Registry + component + doc, rendering nothing | Removed |
| "Since 2026" | In the hero eyebrow | Removed |

## How disclosure emphasis was reduced without weakening compliance

Reduced: the phrase "which links earn us a commission" is out of the hero; the
affiliate count is out of the top strip; disclosure now appears once on the
homepage, in a low-emphasis closing band.

Unchanged: `/affiliate-disclosure/` in the header nav and the footer; the standing
footer statement on every page; the per-article `sponsored nofollow noopener`
labelling; `affiliate-programs.yaml` and `affiliateLinks.ts` untouched. `check:site`
still reports 8 affiliate links correctly labelled as sponsored.

Two contract tests now enforce the split directly: one asserts the homepage still
links the disclosure page and still states that some links are affiliate links; one
asserts the homepage ships no media stand-ins, no testimonials or logo walls, and no
hand-typed audience figures.

## Shiori decision

**Omitted from v0.2**, and the speculative architecture removed with it.

`presenterAssets` was an empty array, so `PresenterSlot` rendered nothing on both the
homepage and every article page: structure that shipped no pixels. No approved
presenter asset exists in this repository (`public/` holds a favicon and the Pinterest
pin PNGs only), and generating one is an OWNER decision, not a website change. Per the
v0.2 instruction, the slot is deleted rather than left speculative. The rule it
protected — no stand-in media, no fabricated presenter — is now asserted as a test
against the homepage itself, so removing the component did not remove the guarantee.

Re-introducing Shiori later means registering a real approved asset and designing
around it, which is a smaller change than v0.1's slot implied.

## Not done

No merge, no deploy, no Cloudflare build trigger, no domain or DNS change, no
affiliate application, no paid tooling, no new dependency, no fabricated screenshot,
metric, or social proof, and no new speculative component.

## Validation

- `npm test` — 41/41 pass (was 40; one presenter test replaced by two contract tests)
- `npx tsc --noEmit` — clean
- `npm run build` — 19 pages
- `npm run check:site` — PASS; 18 sitemap URLs resolving, 8 affiliate links correctly
  labelled sponsored, 8 plain, 19 pages checked
- `git diff --check` — clean
- Rendered check in headless Chromium at 390x844 (iPhone) and 1280x900:
  horizontal overflow 0px at both widths

## Codex handoff — bounded adversarial review

Scope: this branch's diff against `dd1a654` only. Read-only review. Do not merge,
deploy, or trigger a build.

Answer each, with evidence from the diff or a rendered page:

1. Does the homepage now create a stronger first impression than v0.1?
2. Does it still avoid generic AI-template aesthetics? Name any tell you find.
3. Is affiliate/disclosure still compliant but less dominant? Verify compliance is
   genuinely intact, not merely quieter.
4. Does the site feel more current?
5. Is there a clear "wow / interesting" factor, and is it doing honest work?
6. Is the mobile experience improved? Note: 21 links on the mobile homepage compute
   under 24px tall — mostly inline prose and nav links, a pre-existing v0.1
   condition. Assess whether it needs fixing now.
7. Did this overcorrect into flashy or gimmicky design?
8. Is truthfulness preserved? Confirm every hero figure is derived, not typed.
9. Were unnecessary speculative systems added? Was removing the presenter slot right?
10. Is merge readiness improved compared with v0.1?

Return `GO` or `REPAIR_REQUIRED` with specific findings.
