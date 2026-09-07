# Presenter Slot

Status: `SLOT_DEFINED / NO_ASSET_REGISTERED / NOTHING_RENDERS`

The design system reserves a region for an optional presenter asset — a short
silent loop or a still of a host figure — in two places:

| Slot | Where | Component |
| --- | --- | --- |
| `homepage-hero` | Below the homepage hero copy, above the verification strip | `PresenterSlot.astro` |
| `article-intro` | Below the article metadata line, above the disclosure | `PresenterSlot.astro` |

## Why the slot exists but is empty

The site can carry a distinctive visual identity later without a redesign, so
the layout, styling, and accessibility handling are built now. **No asset is
registered**, and `presenterAssets` in `src/lib/presenterAssets.ts` is an empty
array, so `PresenterSlot.astro` renders nothing at all — no placeholder box,
no stock stand-in, no grey rectangle.

That is deliberate, for three reasons:

1. **There is no approved asset.** No presenter media exists in this
   repository, and this repository tracks no media beyond the Pinterest pin
   PNGs. Shipping a slot filled with something we do not have would mean
   inventing it.
2. **Asset generation is an OWNER decision, not a website change.** Reuse of a
   `SHIORI_UTILITY` host asset is governed by the company-side asset policy
   (`HISHO_OS/Projects/Shiori/UTILITY_ASSET_POLICY.md` in the company repo),
   which is reuse-first: an asset should serve 10+ future videos before it is
   generated. Deciding to spend generation credit for one website hero is
   exactly the one-off spend that policy exists to prevent.
3. **A character must not cost the site its credibility.** The site's job is to
   support affiliate program applications and reader trust. A presenter is
   worth adding only where it makes the page clearer or more memorable — never
   as decoration, and never at a density that makes a software review site read
   as a character page.

## What registering an asset requires

Add one entry to `presenterAssets`. Every field is mandatory except `poster`
(video only):

- `slot` — which of the two regions it fills. One asset per slot.
- `src` / `type` — the file under `public/`, and whether it is video or image.
- `alt` — a real description, not the character's name. Screen-reader users get
  the same information sighted users do.
- `caption` — states what the asset is, so it can never be mistaken for a
  product screenshot or evidence of hands-on use.
- `provenance` — `source`, `license`, `verifiedDate`. Required by the company
  asset policy before publication; an asset whose provenance cannot be
  established is not usable.

Constraints that hold whatever is registered:

- **Silent, muted, looping, `preload="none"`.** No autoplay with sound, no
  audio track that starts on load.
- **No layout shift.** Give the asset intrinsic dimensions or a fixed aspect
  ratio before it loads.
- **Never load-bearing.** The page must convey everything it needs to with the
  slot empty — which is exactly how it ships today.
- **One slot at a time.** Both slots filled at once is a character page, not a
  review site.

`tests/site-contract.test.mjs` asserts that the registry stays empty and the
component stays conditional, so an accidental placeholder cannot reach
production without that test being changed deliberately.
