# Creator Growth Tools — Credibility & Revenue Funnel Renewal v0.1

Status: `CLAUDE_CANDIDATE_READY / CODEX_REVIEW_PENDING / NOT_MERGED / NOT_DEPLOYED`
Branch: `feat/creator-growth-site-renewal-v0-1`
Base: `main` @ `a20fdd7ebcedd72fbb50953a3d2ad34e2d119345`
Date: 2026-09-07

Company-side strategy SSOT for this work is `HISHO_OS/Projects/PinterestGrowthEngine/`
in `karasu12071128-creator/ai-staff-box-house-cleaning`, in particular
`OVERSEAS_AFFILIATE_STRATEGY_V2.md` and `WEBSITE_IA_REVIEW_V2.md`. This document
is the implementation-side record. Permanent rules live in `AGENTS.md`; they are
not restated here.

---

## Part 1 — Audit

Read-only inspection of `main` @ `a20fdd7`, plus a local build. Verified baseline
before any change: `npm test` 32/32, `npm run build` 15 pages, `npx tsc --noEmit`
exit 0.

The starting site was **not** a gradient AI-SaaS clone. Its editorial content —
the link-kind discipline, the disclosure page, the methodology page — was already
better than most sites in this category. The weaknesses were narrower and more
specific than "it looks generic".

| # | Area | Verdict | Finding |
| ---: | --- | --- | --- |
| 1 | Visual quality | `REPLACE` | Competent but templated. `Inter` was named in the font stack and never loaded, so the site rendered in the default system UI face. Uniform 8px-radius bordered cards in 3-column grids; a gradient rounded-square brand mark — the single most generic "AI startup" signifier on the page. No typographic voice of its own. |
| 2 | AI-template risk | `REPLACE` | Card-grid + gradient-chip + one-accent-green is the shape a reviewer has seen a thousand times. Nothing identified the site as a specific publication. |
| 3 | Trust weaknesses | `ADD` | **No contact page and no contact route anywhere on the site** — privacy policy stated outright "this site does not currently publish a public contact address". **No named operator**: "a small independent publication", no publisher, no person, no company. |
| 4 | Affiliate-review weaknesses | `MODIFY` | Nothing on-page said what an article's claims were built on. `AffiliateDisclosure.astro` hedged — "contains affiliate links **or may be updated with affiliate links after program approval**" — which is vague where a reviewer wants precision, and rendered identically on pages that had no affiliate link at all. |
| 5 | Information architecture | `ADD` | No taxonomy field of any kind. A faceless-creator or AI-video article could not be filed. Confirms the `WEBSITE_IA_REVIEW_V2.md` finding that this is the top blocker. |
| 6 | Revenue funnel | `MODIFY` (partly `HOLD`) | 4 of 8 articles set `primaryProduct: "kit"`, so both CTAs point at a `rejected_reapply_later` program that pays nothing. Documented as F-01 on `feat/content-audit-20260902`; **not fixed here** — it is an editorial decision (see "What was deliberately not changed"). |
| 7 | Homepage | `REPLACE` | H1 "Newsletter software, checked against the evidence" narrowed the whole site to one category, contradicting `site.ts`'s own broader description. |
| 8 | Article design | `MODIFY` | Sound structure; no evidence signal, no category, no publisher in JSON-LD. |
| 9 | Legal / disclosure placement | `KEEP` + `MODIFY` | Placement (above the fold, before the body) was already right. The wording was not accurate per-page. |
| 10 | Mobile UX | `MODIFY` | No horizontal overflow; hero was tall enough that the primary action sat well below the fold on a 390px viewport — bad for Pinterest and short-form arrivals. |
| 11 | Performance | `KEEP` | Static Astro, one tiny first-party script, no framework runtime. Nothing to fix; the constraint to protect. |
| 12 | Shiori integration | `ADD` (slot only) | No approved presenter asset exists in the repo, and the repo tracks no media beyond pin PNGs. Anything rendered would have been invented. |
| 13 | HISHO Labs relationship | `ADD` | No connection stated anywhere, despite `hisholabs.com` being live and `contact@hisholabs.com` being an OWNER-approved address already published there. |
| 14 | Must stay | `KEEP` | Site name and `site.ts` scope; all 8 articles; flat `/{slug}/` URLs; `affiliateLinks.ts` rel discipline; `data/affiliate-programs.yaml`; the pin assets and Pinterest scripts. |
| 15 | Should change | — | Items 1–5, 7–10, 12–13 above. |
| 16 | Must NOT be touched | `HOLD` | Rename, rebrand, domain migration, article deletion, affiliate enum extension ahead of approval, any deploy, any affiliate application. |

---

## Part 2 — Design direction

One direction, not five mockups: **a small print review section, not a SaaS
landing page.**

Three constraints, each with a reason, all enforced in `src/styles/global.css`:

1. **Zero web fonts, three type voices.** An old-style serif (`Iowan Old Style`
   → `Charter` → `Georgia`) for editorial voice, the system grotesque for
   interface, and mono for anything that is *evidence* — dates, grades,
   identifiers. This is the single largest change in how the site reads, and it
   costs 0 bytes and 0 network requests. That matters specifically because this
   site's traffic thesis is mobile discovery from Pinterest and short-form video.
2. **Rules, not boxes.** Hairlines and vertical rhythm carry the hierarchy.
   Numbered entries (`01`, `02`, `03`) replace the card grid on every list. A
   uniform bordered card grid is the strongest "generated" tell there is; a
   sequenced, numbered list is the cheapest honest signal that an editor ordered
   the page.
3. **Rationed colour.** One accent for actions, one mark colour used *only* for
   verification signals. The gradient brand chip is replaced by a typographic
   monogram. Nothing on the site is coloured decoratively.

Motion is limited to a short hero rise and link/button transitions, all inside
`@media (prefers-reduced-motion: no-preference)`. No autoplay, no scroll effects,
no added JavaScript.

The palette keeps the existing green/gold family rather than replacing it, so the
site stays visually continuous with the already-published Pin assets.

---

## Part 3 — What was implemented

### Trust and operator identity

- **`/contact/` (new).** Real, OWNER-approved address `contact@hisholabs.com`,
  reused from the existing HISHO Labs company site — not a new address and not
  invented. Email only; no form, because the site stores no submitted data.
  States response expectations honestly ("a few working days rather than the same
  afternoon"), and states plainly that paid placement, guest posts, and link
  insertions are refused.
- **`/how-we-test/` (new).** Nine evaluation axes, three evidence grades with
  what each requires, five rules, and an explicit list of what is never
  published. `/editorial-methodology/` is left intact and cross-linked: it covers
  where facts come from, this page covers how tools are judged.
- **Named operator throughout.** `operator` in `src/site.ts` (HISHO Labs,
  `hisholabs.com`, `contact@hisholabs.com`, Japan) surfaces in the footer
  colophon, About, homepage, and `Organization` structured data. About also
  states how AI is used in production and where the line is.
- **Evidence grades on-page.** New `evidence` frontmatter field, rendered as a
  mark at the top of every article and in every listing. All 8 existing articles
  are `official-sources` — the truthful grade — and the schema default is the
  weaker grade, so an unset field can never overstate the site's evidence. The
  `hands-on` grade requires a `testedNote`, enforced by test.
- **Privacy policy** corrected: it no longer says there is no contact address.

### Disclosure accuracy

`AffiliateDisclosure.astro` now states what is true *of that page*:

| Page condition | Rendered text |
| --- | --- |
| Renders a real affiliate CTA | "contains at least one affiliate link… commission does not decide our recommendation" |
| Renders only a non-earning official-site CTA | "contains **no** affiliate links. Every outbound link here goes straight to the product's own website and earns us nothing." |

It is driven by the CTA actually rendered (`primaryProduct`), not by the
`products` frontmatter — `products` lists what an article *discusses*, and only
the primary product gets a link. **This was caught by looking at the rendered
page, not by reading the code**: `kit-vs-beehiiv` lists beehiiv in `products`, so
a `products`-driven notice claimed an affiliate link on a page whose only link
was a non-earning Kit link. `scripts/check-site.mjs` now cross-checks the claim
against the rendered `rel="sponsored"` links in both directions.

`/affiliate-disclosure/` is now rendered from the affiliate registry, so it
cannot drift from what the links actually do.

### Information architecture

- `category` field on the article schema, keys declared once in
  `src/lib/categories.ts`, defaulting to `newsletter-email`. All 8 articles
  backfilled. **No article URL changed.**
- `/topics/` index and `/topics/[category]/` pages. A category index is generated
  **only** where articles exist, so `/topics/newsletter-email/` is the only one
  that builds today. Planned categories are named as planned and link nowhere —
  the site ships no empty index page dressed as coverage.
- Homepage H1 broadened from "Newsletter software" to "Creator tools"; the
  homepage shows live topics as blocks and names planned ones in a single line,
  so an honest roadmap does not read as an empty site.

### Funnel and measurement

- Homepage restructured around the reader's actual decision sequence: narrowing
  the field → choosing between two → examining one in detail, each entry
  carrying its evidence grade and freshness date.
- Verification strip is fully derived — article count from the collection,
  approved-program count from the affiliate registry, last-verified from article
  frontmatter. No hardcoded figure can go stale.
- F-03 from `SITE_AUDIT_2026-09-02.md` fixed: a non-affiliate CTA now emits
  `data-event="outbound_click"` instead of `affiliate_click`, so the affiliate
  click count in the funnel review is not inflated by Kit links that cannot
  convert. `public/analytics.js` handles both events.

### Shiori

`SLOT_DEFINED / NO_ASSET_REGISTERED / NOTHING_RENDERS`. See
[`PRESENTER_SLOT.md`](PRESENTER_SLOT.md). Two slots are styled and wired;
`presenterAssets` is empty, so nothing renders — no placeholder, no stand-in. A
test asserts it stays empty.

### Accessibility

Skip link, `<main id="main">`, single `h1` per page, no heading-level skips
(one real violation found and fixed on `/topics/`), focus-visible outlines, 44px
minimum touch targets, `prefers-reduced-motion` on all motion.

---

## Part 4 — Verification

All run locally on this branch:

| Check | Result |
| --- | --- |
| `npm test` | **40 / 40 PASS** (32 pre-existing + 8 new site-contract tests) |
| `npm run build` | **19 pages**, Complete |
| `npx tsc --noEmit` | exit 0, no diagnostics |
| `npm run check:site` (new) | **PASS** — 18 sitemap URLs all resolving, 0 broken internal links, 8 affiliate links all `sponsored nofollow noopener`, 8 plain outbound links none marked sponsored, 19 pages structurally clean |
| `git diff --check` | clean |
| Changed-file scope | 27 modified + 11 added; no `data/`, no `public/pinterest/`, no affiliate registry, no unrelated file |
| Rendered check (Chromium 1280px + 390px) | 6 pages, **0 horizontal overflow** |

New tests were **mutation-checked**: breaking a nav link and breaking an article
category each produced exactly one failure, confirming the tests can fail.

Not run: production deploy, Lighthouse/CWV field measurement, cross-browser
testing beyond Chromium, screen-reader testing.

---

## Part 5 — What was deliberately not changed

| Item | Why |
| --- | --- |
| **F-01: 4 Kit-primary articles** | The largest single funnel defect: 4 of 8 articles CTA to a program that pays nothing. It is an editorial decision (the article bodies recommend Kit, honestly), already analysed with three options in `SITE_AUDIT_2026-09-02.md`, and option 2 is already implemented on `feat/content-audit-20260902`. Fixing it here would have meant either rewriting article recommendations or duplicating that branch's work. **OWNER decision.** |
| `feat/content-audit-20260902` | Unmerged branch carrying a 9th article and audit docs. Not merged into this branch — separate workstream, separate review. |
| `products` enum / `affiliateTargets` | Per `WEBSITE_IA_REVIEW_V2.md`: enum extension follows program approval, never precedes it. No new program is approved. |
| `data/affiliate-programs.yaml` | The 8 proposed evaluation fields are a separate data change. Untouched here. |
| Site name, domain, article URLs, article bodies | `HOLD` per strategy. No rename, no rebrand, no migration, no deletion. |
| F-02 (SEO title lengths) | Content-only frontmatter edits, better batched with an editorial pass. |

---

## Part 6 — Codex handoff

**Recommended model:** GPT-5.6 Sol. **One review pass. Do not re-review the same
finding.**

### Repository and branch

- Repo: `karasu12071128-creator/ai-affiliate-bot`
- Branch: `feat/creator-growth-site-renewal-v0-1`
- Base: `main` @ `a20fdd7ebcedd72fbb50953a3d2ad34e2d119345`
- Diff: `git diff origin/main...feat/creator-growth-site-renewal-v0-1`

### Why this matters now

`P1` in the current sprint is the overseas affiliate revenue experiment. Only one
affiliate program is approved (beehiiv); Kit's rejection cited audience fit and
**content/site depth**. The next applications should not be made from a site that
reads as auto-generated. This branch is the credibility and funnel layer for
those applications. It is a candidate, not a decision.

### Read first, in this order

1. `AGENTS.md` — permanent guardrails for this repo.
2. This document, Parts 1–5.
3. `src/styles/global.css` — the design system; the largest single diff.
4. `src/lib/categories.ts`, `src/lib/evidence.ts`, `src/lib/presenterAssets.ts` — new contracts.
5. `src/components/AffiliateDisclosure.astro` + `src/layouts/ArticleLayout.astro` — the disclosure accuracy fix.
6. `src/pages/index.astro`, `how-we-test.astro`, `contact.astro`, `topics/`.
7. `tests/site-contract.test.mjs`, `scripts/check-site.mjs`.

### In scope for Codex

Answer each of these with evidence, not impression:

1. Does the site still read as generic or AI-generated? Name the specific element if so.
2. Is any layout still template-like?
3. Are trust signals sufficient for an affiliate program reviewer?
4. Is affiliate disclosure correct **on every page**, in both directions?
5. Any unsupported claim in new copy? Check `/how-we-test/`, `/contact/`, `/about/`, homepage.
6. Any fake or unverifiable claim — invented experience, metrics, users, credentials?
7. Does the empty presenter slot leak anything, or help/hurt credibility?
8. Is the conversion path clear: homepage → article → CTA?
9. Mobile layout at 320 / 375 / 390 px.
10. Any broken navigation or link (`npm run check:site` should catch these — verify it actually would).
11. Accessibility beyond what `check:site` asserts: focus order, contrast ratios, `.mark` colour contrast, link purpose.
12. Performance: any regression against `main`? Page weight, request count, render-blocking.
13. Content hierarchy on each new page.
14. Does this preserve current `P1` strategy (KEEP the site, no rebuild/rebrand)?
15. **Did Claude overbuild?** Any page, component, or CSS block that earns nothing.
16. **Did Claude duplicate an existing system?** Especially: does `check-site.mjs` duplicate an existing script, and does `/how-we-test/` duplicate `/editorial-methodology/`?
17. Was any domain / deploy / affiliate-application / paid-service boundary crossed?

### Bounded repairs Codex MAY make — `GREEN`

- Fix a defect it can demonstrate (broken link, wrong `rel`, inaccurate disclosure, a11y violation, layout break at a named viewport).
- Add a test that fails before its fix and passes after.
- Simplify or delete code that provably earns nothing.
- Correct a factual or grammatical error in new copy.

Preserve unrelated local changes. Reuse existing systems rather than adding new ones.

### Codex must NOT — `PROHIBITED`

- Redesign the site or propose a competing direction.
- Change business strategy, pricing, or sales terms.
- Merge to `main`, deploy, or trigger a Cloudflare Pages build.
- Apply to any affiliate program, or add a product to the `products` enum / `affiliateTargets`.
- Change the domain, DNS, or environment variables.
- Add a paid SaaS, paid API, or new dependency.
- Delete an existing article, pin asset, or historical evidence.
- Register a presenter asset, or generate media.
- Remove the Shiori slot or the `P1` strategy without review.

### Requires OWNER — `OWNER_APPROVAL_REQUIRED`

- F-01 (the Kit-primary CTA decision).
- Publishing `contact@hisholabs.com` on this second property.
- Merge to `main`.
- Production deploy.

### Expected report fields

`verdict` (`GO` / `GO_WITH_MINOR_FIXES` / `REPAIR_REQUIRED` / `BLOCK_MERGE`),
then per finding: `id`, `severity`, `area`, `file:line`, `evidence` (what was
observed, not inferred), `minimal_fix`, `repaired` (yes/no), plus
`checks_run` with actual results and `boundaries_crossed` (expected: none).

### Stop condition

Stop after one pass and one round of bounded repairs. If a finding needs an
editorial or strategic decision, report it — do not decide it. This handoff
authorizes no merge, deployment, account access, paid use, or external write.

---

## Part 7 — Deploy checklist delta

`DEPLOY_CHECKLIST.md` records the previous, already-completed deploy and is left
as historical evidence. For **this** branch, add to its section 2:

```bash
npm test            # expect 40 / 40 PASS
npm run build       # expect 19 pages, Complete
npx tsc --noEmit    # expect exit 0
npm run check:site  # expect PASS (run after build)
```

And to its section 4, additionally verify: `/contact/`, `/how-we-test/`,
`/topics/`, `/topics/newsletter-email/` all resolve; the disclosure on
`/kit-vs-beehiiv/` reads "contains no affiliate links" and on `/beehiiv-review/`
reads "contains at least one affiliate link".

Merge and deploy remain OWNER decisions. Neither is performed or authorized by
this branch.
