# Site Audit — 2026-09-02

Read-only audit run during the HISHO Labs overnight build. Codex ran the first pass
(sandboxed); Claude Code re-verified every finding first-hand against the repo source and the
local production build. **No site code was changed. No deploy, no merge.**

Baseline: `main` @ `a20fdd7`, worktree clean, up to date with `origin/main`.

## Verification (local, real environment)

| Check | Result |
| --- | --- |
| `npm test` | PASS — 32 / 32 |
| `npm run build` | PASS — 15 pages, "Complete!" |
| `npx tsc --noEmit` | PASS — exit 0, no diagnostics |
| `dist/` pages | 15 HTML (8 articles + 7 static) |
| `dist/sitemap.xml` | 14 URLs (6 static + 8 articles); no orphans, no draft/private leak; 404 correctly absent |
| Custom 404 | `src/pages/404.astro` builds to `dist/404.html` |
| Nav (`Header.astro`) | 4 links — `/articles/`, `/editorial-methodology/`, `/about/`, `/affiliate-disclosure/` — all resolve to built pages |
| Affiliate disclosure page | Present, accurate; explicitly names beehiiv as the only active affiliate; states Kit/ActiveCampaign links "earn us nothing" |
| `affiliateLinks.ts` | Only `beehiiv` has a non-null `affiliateUrl`; `getAffiliateRel` returns `sponsored nofollow noopener` only for real affiliate links, `nofollow noopener` otherwise — verified in `dist/kit-review/index.html` (Kit CTA renders `rel="nofollow noopener"`, label "Go to Kit", link kind "Official site") |

The site's link-labelling system ("Affiliate link" vs "Official site" on every outbound link)
is working and honest. There is **no disclosure or rel-attribute defect.**

## Findings

| ID | Severity | Area | Evidence | Suggested minimal fix (for a later OWNER-approved round) |
| --- | --- | --- | --- | --- |
| F-01 | MEDIUM (strategic) | Funnel / editorial | `src/content/articles/best-email-marketing-for-solopreneurs.md:9`, `best-email-marketing-tools-for-creators.md:9`, `kit-review.md:9`, `kit-vs-beehiiv.md:9` all set `primaryProduct: "kit"`; `ArticleLayout.astro` renders top+bottom CTAs from `primaryProduct`, so 4 of 8 articles send their primary CTA to `https://kit.com/` — a program that is `rejected_reapply_later` and pays nothing. The 4 article bodies also editorially recommend Kit ("Kit is the best place to start", etc.). | NOT a mechanical fix. This is an editorial + monetization-alignment decision for OWNER. Options in the note below. |
| F-02 | LOW | SEO | `BaseLayout.astro:13` appends `" — " + site.name` to every `<title>`. Several article `title` + description strings are already near/over the ~60-char / ~155-char snippet norms, so the appended site name pushes them past the fold in SERPs. Examples: `kit-review.md` title (66 chars before suffix), `best-email-marketing-for-solopreneurs.md` description (216 chars). | Trim the longest `title`/`description` frontmatter values by hand, or drop the site-name suffix on article pages only. Content-only, no layout change. |
| F-03 | LOW | Internal telemetry | Kit CTAs render `data-event="affiliate_click"` even though the Kit link is not an affiliate link (`dist/kit-review/index.html`). User-facing labelling is still correct ("Official site"); only the analytics event name is imprecise, which could inflate a raw "affiliate_click" count. | Optionally emit `data-event="outbound_click"` when `isAffiliateLink(product)` is false. One-line change in `ArticleLayout.astro`; defer until analytics review needs it. |

### Dismissed

- **Codex H-001 "build verification failed"** — Codex's sandbox denied `.astro/content.d.ts`
  writes. Re-run in the real environment: `npm run build` completes, 15 pages. Not a real
  issue.
- **Codex "git fetch failed"** — sandbox permission on `.git/FETCH_HEAD`. A real
  `git fetch origin` from Claude confirms `main` is level with `origin/main` at `a20fdd7`.

## F-01 — options for OWNER (no action taken)

The 4 Kit-primary articles are internally consistent (they recommend Kit, and the CTA goes to
Kit, honestly labelled). The misalignment is strategic: paid traffic from Pinterest lands on
articles whose main CTA cannot convert to commission.

1. **Leave as-is.** The articles are honest and useful; Kit may be re-approved later
   (`rejected_reapply_later`), at which point the CTAs already point the right way.
2. **Add a secondary beehiiv CTA / callout** to the Kit-primary articles (e.g. "Prefer a
   newsletter-first platform? See our beehiiv review") without changing the Kit
   recommendation. Small, honest, keeps editorial integrity.
3. **Re-point `primaryProduct` to `beehiiv`** on the two roundup articles
   (`best-email-marketing-for-solopreneurs`, `best-email-marketing-tools-for-creators`) only
   if their body recommendation is also revised to match — a full editorial rewrite, not an
   overnight change. `kit-review` and `kit-vs-beehiiv` should keep Kit as primary (a Kit
   review with a beehiiv CTA is incoherent).

Recommended: option 2 as the smallest funnel improvement that respects the no-fake-experience
and affiliate-neutrality rules. Needs OWNER sign-off before implementation.

## No fixes implemented

Nothing here met the "small, factual, verifiable, mechanical" bar for an unattended change.
F-01 needs editorial judgement; F-02/F-03 are low and touch shared layout/frontmatter better
batched with OWNER review.
