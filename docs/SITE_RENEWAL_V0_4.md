# Creator Growth Tools — Renewal v0.4 (Truth repairs, a11y, hero media slot)

Status: `CANDIDATE_READY / CODEX_REVIEWED_AND_REPAIRED / CHATGPT_REVIEW_PENDING / NOT_MERGED / NOT_DEPLOYED`
Branch: `feat/creator-growth-site-renewal-v0-4`
Base: `feat/creator-growth-site-renewal-v0-3` @ `20a16e5`
Date: 2026-09-08

v0.4 is the first pass run on the OWNER's own PC. That single change of
environment is what this version is about: Codex and the local Shiori library
were reachable for the first time, and both immediately falsified something
v0.3 had recorded as settled.

v0.3 is preserved untouched on `origin`. This branch does not track it and
cannot push to it.

## Model orchestration actually used

| Role | Model | Reachable | What it did |
| --- | --- | --- | --- |
| Creative direction, implementation | Claude Opus 5 | yes | Everything in this document |
| Bounded subagent | Codex GPT-5.6 Sol | yes | v0.3 code review, Shiori inventory attempt, adversarial review of this branch |

Two Codex limitations were found and are stated here so no result is
misattributed:

- **Codex has no network access.** Every `curl` returned exit 7 / HTTP 000, so
  Codex could not verify a single external fact. The eight MailerLite/beehiiv
  facts were re-verified by **Claude Code**, not Codex.
- **Codex cannot read `G:\`** (Google Drive for Desktop). It reported the whole
  Shiori Drive library as `UNVERIFIABLE`. Claude Code read it directly; the
  inventory below is Claude Code's.

Codex's code review and adversarial review are genuinely Codex's, and its
findings drove most of this version.

## What v0.3 had recorded that turned out not to hold

### 1. Two QA harnesses were silently doing nothing on Windows

`new URL("..", import.meta.url).pathname` returns `/C:/Users/...` on Windows.
Joining that produced `C:\C:\Users\...`, a path that never exists.

- `tests/site-contract.test.mjs` — **11 of 43 tests threw `ENOENT`**, including
  every check that enforces the site's honesty contracts: derived hero figures,
  lab status rules, affiliate labelling, sitemap parity, category registry.
- `scripts/check-site.mjs` — exited `dist/ not found` immediately after a
  successful build.

Both passed in the Linux container where they were written, so v0.3's recorded
`npm test 43/43` and `check:site PASS` were true there and false here. Fixed
with `fileURLToPath`. Running for real: **45/45**, and `check:site` reports 18
sitemap URLs, 8 sponsored + 8 plain links, 19 pages.

This is the finding with the longest reach: the tests that guarantee the site
tells the truth were not running on the machine the site is built from.

### 2. Three unsupported claims were shipping

Found by Codex's review of the v0.3 tree.

| Claim | Reality | Fix |
| --- | --- | --- |
| Hero panel: "The comparison most people arrive for", `aria-label="Most-read comparison"` | `public/analytics.js` dispatches a local event and **stores and transmits nothing**. The site holds no readership data at all. | Claim removed. After Codex showed a coverage superlative would describe the four-key product registry rather than real coverage, the kicker was reduced to a plain derived count. See the repair table below. |
| `lab.ts`: "The cohort is published and being measured" | `data/pinterest-pin-experiments.json` holds **1 published pin and 15 drafts**; the only observation is 4 impressions. | Restated: one pin is out, the rest are not, and a single pin cannot be compared against anything. |
| H1 promises "creator tool" | All eight articles are newsletter/email; one live category, four planned. | First fixed in the eyebrow only; after Codex showed the `<title>` still travelled unqualified, the H1 and title were narrowed to "newsletter tool". See the repair table below. |

### 3. The Shiori decision had been made on a false premise

v0.3 recorded `SHIORI_NOT_NEEDED` on the grounds that **"no candidate assets
exist. `TOP_CANDIDATES` is an empty set."** That was a container with no PC or
Drive access, not an empty library.

## Shiori — re-decided as `NEW_ASSET_REQUIRED`

Claude Code read the Drive directly. Codex assessed the local copies visually.

**What actually exists**

| Location | Contents |
| --- | --- |
| `G:\マイドライブ\HISHO_Labs\Shiori\01_RAW_FLOW` | 8 MP4, 18.94 MB |
| `00_CHARACTER`, `02_ASSET_LIBRARY`, `03_PROJECTS`, `04_MASTERS`, `05_PUBLISHED` | empty |
| Local `Videos\HISHO_Labs\Shiori\Short001` | the same 8 clips plus 6 derived working cuts and 16 PNGs |

`catalog.json` gives every clip as **720×1280 portrait, 8s, 24fps, h264, audio
present**, `quality_status: "RAW"`, `reuse_status: "UNKNOWN"`, with `wardrobe`,
`environment`, and `shot_type` all `null`.

**Why not `USE_EXISTING`.** Codex ranked five candidates and marked all five
"needs work"; none is usable as-is. The library is portrait-only at 720×1280,
below a landscape hero's requirement; no clip has a text-safe side to place a
headline against; every candidate has a loop seam (push-in, head turn, gaze
move); and the catalog itself calls the material RAW with reuse undetermined.
Cropping one into a landscape hero would ship a low-resolution portrait as a
background it was never framed for — a decorative portrait, which the brief
explicitly prohibits.

**Why not `SHIORI_NOT_NEEDED`.** The material exists and the character is
defined. The blocker is fitness for this specific use, not absence.

**Decision: `NEW_ASSET_REQUIRED`.** Per the brief, no media was generated. The
OWNER is producing one asset in Google Flow. Required spec:

- 16:9 landscape, 1920×1080 or better
- 6–8 seconds, seamless silent loop
- subject to the right; clean text-safe area on the left
- business-casual, creator-studio setting, low clutter, shallow depth
- subtle movement only, stable face across the loop
- no embedded text, captions, or platform UI
- silent master plus a poster still at the same framing

The existing 9:16 clips stay where they are as vertical short-form source.
Nothing was moved, renamed, deleted, or overwritten.

## The hero media slot, and why it is not the v0.1 presenter slot again

v0.1 shipped `PresenterSlot.astro` over an empty `presenterAssets` array. It
rendered an empty box in the page flow — structure producing no pixels — and
v0.2 deleted it correctly.

`src/lib/heroMedia.ts` is a different shape. The stage is already a finished
design: `.stage-field` draws a hairline grid and one pool of light in CSS, at
zero network cost, and that is what ships today. A registered asset does not
add a region; it repaints an existing one, and the grid becomes a scrim over
footage. With the registry empty there is no container, no placeholder, and no
reserved gap — only the CSS field, which is the v0.3 design unchanged.

Constraints, enforced by contract tests rather than by convention:

- an asset renders only when `approved` is true;
- every registered asset declares `provenance` and a `poster`;
- the homepage's one permitted `<video>` may not name a file — `src` and
  `poster` must be bound from the registry, so media cannot reach the page
  without passing these checks;
- `prefers-reduced-motion: reduce` drops the video and leaves the poster;
- the scrim, not the footage, carries copy contrast, and it flips direction
  from the asset's declared `subjectSide`.

## Accessibility and mobile

| Issue | Evidence | Fix |
| --- | --- | --- |
| Focus ring invisible on both dark sections | ring was `var(--ink)` on `--stage-ink` | inverted to the signal colour on stage, pillars, lab |
| Matchup link's accessible name was "Kit beehiiv" | "vs" is `aria-hidden` | explicit `aria-label` |
| `ComparisonTable` had no caption, no header scopes | `ComparisonTable.astro` | caption, `scope="col"`, row headers. **Currently unreferenced — delete it at the next review if still unused.** |
| Header links 0.72rem with 2px padding | under a finger-sized target at 390px | own vertical padding, 0.78rem |
| Pillars two-up at 620px, blurb 0.79rem | cramped copy and tap area | one per row below 620px, blurb 0.9rem |
| Build pillar: 1 of 4 equal columns with nothing behind it | `href: null` | stays a non-link as the contract requires, now carries a visible "Not open yet" flag so the rail reads as a roadmap, not a broken nav |

## Validation

- `npm test` — **45/45** (43 existing, now actually executing, plus 3 new; one
  pre-existing test tightened)
- `npm run check:site` — **PASS**, now including 19 pages scanned for
  unsupported popularity claims and a hero-media outcome check
- `npx tsc --noEmit` — clean
- `npm run build` — 19 pages
- `npm run check:site` — **PASS**; 18 sitemap URLs resolving, 8 sponsored + 8
  plain, 19 pages
- `git diff --check` — clean
- Built output confirms: 0 readership claims, `data-media="false"`, no `<video>`
  shipped with the registry empty

## Codex adversarial review, and the repair pass

Codex GPT-5.6 Sol reviewed this branch read-only and returned **HOLD** with six
must-fix findings. This is the first time the gate has actually run: v0.2 and
v0.3 both recorded it as outstanding because no Codex runtime was reachable.

Five findings were accepted in full. One was answered with a different fix than
Codex proposed, and the disagreement is recorded rather than quietly resolved.

| # | Codex finding | Resolution |
| --- | --- | --- |
| 1 | The broad H1 survived; only the eyebrow was qualified, so the claim still travelled unqualified in `<title>` and social previews | **Accepted.** H1 and `<title>` now say "newsletter tool", which is exactly what eight of eight articles cover. The eyebrow carries the brand's wider direction and the count of categories still in progress. |
| 2 | "the tools people shortlist", "the two most common choices", "the two most common picks" are audience-behaviour claims with no data | **Accepted.** All three rewritten. A fourth, missed by Codex and caught by the new built-output check, was found in `kit-vs-beehiiv.md` ("the core reason most people choose it"). |
| 3 | `matchupIsTopCovered` proves "top two among tracked frontmatter keys", not "our two most-covered tools" — `products` holds four registry keys while the articles discuss more tools | **Accepted, and the claim withdrawn rather than patched.** The guard is deleted. The kicker now states a plain derived count, and the instrument is relabelled "Products we track across articles" so it describes what it actually counts. |
| 4 | The new "Not open yet" flag composited to ~3.6:1, a contrast regression | **Accepted.** Group opacity cannot be undone by a child, so the flag moved to the signal colour and the pillar dimming eased from 0.62 to 0.78. Composited: `#0c1411` on `#B49863` ≈ **6.8:1**. |
| 5 | The hero contracts are source regexes, defeatable by indirection, dead matching code, or a spread entry | **Accepted, and answered structurally.** Outcome checks moved to `scripts/check-site.mjs`, which reads the built HTML: whatever media actually shipped must resolve to a file in the build, and the stage's `data-media` flag must agree with the media present. |
| 6 | The readership contract scans one source file for a phrase list; a component or constructed string ships the claim anyway | **Accepted, and answered structurally.** Every built page is now scanned for popularity/readership claims. This immediately caught the `kit-vs-beehiiv.md` claim that the source scan had missed — which is the finding's own point, demonstrated. |

### Where this version disagrees with the reviewer

Codex listed the empty hero media registry as speculative structure shipping
dead CSS before any pixels exist, and that criticism is correct on its own
terms. It is kept because the OWNER directed it explicitly: build everything
else now, integrate the asset last, do not block the candidate on media
production. The cost is `.stage-media` and scrim rules in the global stylesheet
that no current page activates. If the asset is not delivered, this registry
should be deleted rather than carried.

Codex also flagged `ComparisonTable.astro` as accessibility work applied to dead
code. That is accurate. It is left in place with a delete-by date recorded in
the file itself.

## Outstanding
- The hero asset is not delivered. The media layer is the last thing to
  integrate, after OWNER approval.
- Performance: one global stylesheet carries homepage-only rules to every
  route (29.4 KB source). Codex raised it; splitting it is a real refactor and
  was not attempted late in this pass.
- `feat/content-audit-20260902` carries the `beehiiv vs MailerLite` draft on a
  separate lineage and is not in this branch. The two lines need reconciling
  before either merges.

## Not done

No merge, deploy, Cloudflare build trigger, domain or DNS change, affiliate
application, purchase, paid API, new SaaS, new dependency, generated media, or
moved/renamed/deleted Shiori master file.
