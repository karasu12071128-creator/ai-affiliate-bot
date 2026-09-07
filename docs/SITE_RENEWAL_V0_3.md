# Creator Growth Tools — Renewal v0.3 (Creator Media + Experiment Lab)

Status: `CLAUDE_CANDIDATE_READY / ADVERSARIAL_REVIEW_PENDING / NOT_MERGED / NOT_DEPLOYED`
Branch: `feat/creator-growth-site-renewal-v0-3`
Base: `feat/creator-growth-site-renewal-v0-2` @ `1977576`
Date: 2026-09-07

v0.3 acts on the research conclusion that this property should not become "a prettier
affiliate blog" but should move toward **creator tools media + comparison/decision
system + experiment lab**. It continues the same task and branch lineage; nothing was
restarted.

## Model orchestration actually used

The plan named Fable 5.1 as creative lead and Codex GPT-5.6 Sol as bounded subagent.
Neither was reachable from this environment:

- **Fable 5.1** — `HTTP 429, "Fable 5.1 requires usage credits"`. Not enabled on this
  account. No credits were spent attempting it.
- **Codex GPT-5.6 Sol** — no runtime. Read-only checks: `codex` is absent from `PATH`,
  no `~/.codex` exists, and this is a remote Firecracker-backed Ubuntu 24.04 container
  (`PID 1 = process_api`, `systemd-detect-virt = docker`, hostname `vm`) with no local
  PC or Google Drive access. Nothing was installed, no login attempted, no PATH change.

Consequence: Claude Opus 5 performed creative direction, implementation, and the
adversarial QA pass. **The QA below is a Claude self-review, not a Codex review.** An
independent Codex adversarial pass remains outstanding and is the next gate.

## Design direction — "the bench"

The site is staged as a working bench rather than a magazine or a landing page. The
page alternates ink → paper → ink: the stage and the pillar rail form one dark
masthead block, the editorial middle returns to paper, and the Lab lands as a second
dark event near the foot. Two dark moments, not a dark theme.

Impact is carried by scale, inversion, one rationed signal colour, and real data
rendered as instruments — not by imagery, because none exists (see Shiori below) and
none may be generated in this pass.

## What v0.3 adds over v0.2

| Area | v0.2 | v0.3 |
| --- | --- | --- |
| Ways in | Header nav only | Four-pillar rail — Explore / Compare / Build / Lab — directly under the stage, each showing its real state |
| Proof of activity | None | `Current lab`: what the studio is building, with per-entry status and a workflow chain |
| Page rhythm | One dark event, then paper to the foot | ink → paper → ink; the Lab is a second event |
| Empty states | n/a | A pillar with nothing published is dimmed and is **not** a link |
| Mobile method band | Three columns at every width | Two columns ≤860px, one column ≤620px |

## The Lab, and why it is honest

`src/lib/lab.ts` carries two entries, both drawn from verified HISHO Labs activity:

1. **A reusable AI presenter workflow** — chain `Script → Voice → Character → Edit →
   Short`, status `Result not yet verified`. The pipeline stages exist and run
   locally; the first finished short has **not** been verified, and the entry says
   exactly that rather than implying a working end-to-end system.
2. **Which pin creative earns the click** — status `Running`. A fixed cohort is
   published and being measured; impressions are too low to separate the formats, so
   the entry states there is no conclusion and no winner.

Two contract tests enforce this: every entry must declare an explicit status, and the
entry body must contain no metric, rate, percentage, or overclaiming adjective. The
Lab is proof of method, not a results table — which is the same evidence rule the
articles are held to.

## Shiori decision — `SHIORI_NOT_NEEDED` for this pass

Inventory result: **no candidate assets exist**. `TOP_CANDIDATES` is an empty set.
The repository contains a favicon and 16 Pinterest pin PNGs (1000×1500 marketing
creatives) and no photography, video, screenshots, or character media. A local PC
inventory could not run: this container has no PC or Drive access. Nothing was moved,
renamed, deleted, or reorganised anywhere.

Shiori is therefore omitted from v0.3, and the page is designed to work without her.
Using a character here today would have meant a decorative portrait — the exact
failure mode the brief prohibits.

If OWNER later authorises generation, the asset required is:

- 6–8 second silent loop, seamless
- waist-up composition, subject off-centre for a text-safe side
- neutral modern workspace background, low clutter, shallow depth
- business-casual styling consistent with the existing character definition
- minimal head movement, no large gestures, stable face across the loop
- delivered 16:9 with a mobile-safe centre crop (9:16 usable)
- no embedded text, no captions, no platform UI
- silent master plus a poster still at the same framing

Until such an asset exists and is approved, the site ships no presenter.

## Affiliate treatment

Unchanged from v0.2 and still compliant: header nav link, footer statement on every
page, `/affiliate-disclosure/`, per-article `sponsored nofollow noopener`, registry
untouched. `check:site` reports 8 affiliate links correctly labelled sponsored and 8
plain. On the homepage disclosure remains a single quiet band near the foot, now
sitting after the Lab, so the order reads usefulness → identity → proof → trust →
disclosure. "Affiliate" is nowhere used as a brand message.

## Validation

- `npm test` — 43/43 pass (2 new Lab/pillar contract tests)
- `npx tsc --noEmit` — clean
- `npm run build` — 19 pages
- `npm run check:site` — PASS; 18 sitemap URLs resolving, 8 sponsored + 8 plain
- `git diff --check` — clean
- Rendered in headless Chromium at 390×844 and 1280×900: horizontal overflow 0px at
  both widths
- Weight: `index.html` 10,853 bytes; CSS 18,063 bytes; `analytics.js` 611 bytes
- Network: 4 requests total, **0 external-origin** (no web fonts, no third parties)
- Structure: 1 `h1`, 0 heading-level jumps, 0 images missing `alt`, 0 empty links,
  landmarks `header/main/footer` present, 5 labelled regions

## Outstanding

An independent adversarial review has not run. The 15 review questions in the brief
remain open and should be answered by a reviewer that is not the author of this
candidate.

## Not done

No merge, deploy, Cloudflare build trigger, domain or DNS change, affiliate
application, purchase, paid API, new SaaS, new dependency, generated media, deleted
content, or moved Shiori master file.
