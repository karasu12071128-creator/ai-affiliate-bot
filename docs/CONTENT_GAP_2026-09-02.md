# Content Gap Analysis — 2026-09-02

Run during the HISHO Labs overnight build. Purpose: find the few articles genuinely missing
from the Pinterest -> article -> beehiiv funnel, without mass generation. Max 2 recommended.
No drafts were written — see "Why no drafts tonight" at the end.

## Existing articles (8)

| Slug | Archetype | primaryProduct |
| --- | --- | --- |
| `beehiiv-review` | Review | beehiiv |
| `beehiiv-alternatives` | Alternatives | beehiiv |
| `beehiiv-vs-substack` | X vs Y | beehiiv |
| `best-newsletter-platforms` | Ranking | beehiiv |
| `kit-review` | Review | kit |
| `kit-vs-beehiiv` | X vs Y | kit |
| `best-email-marketing-for-solopreneurs` | Ranking | kit |
| `best-email-marketing-tools-for-creators` | Ranking | kit |

Coverage today: beehiiv is reviewed, has an alternatives page, one head-to-head (Substack),
and sits in two rankings. Kit has a review, one head-to-head (beehiiv), and leads two
rankings.

## Genuine gaps (beehiiv-relevant, Pinterest-searchable, honest without primary hands-on)

| Gap | Why it matters | Overlap risk |
| --- | --- | --- |
| **beehiiv vs Ghost** | Ghost is the main "own your platform / membership site" alternative people weigh against beehiiv. No existing head-to-head. High Pinterest intent ("ghost vs beehiiv", "newsletter membership site"). | Low — `beehiiv-vs-substack` covers a different rival; `beehiiv-alternatives` only lists Ghost. |
| **beehiiv vs MailerLite** | MailerLite is the budget/simple-sender that Pinterest DIY/small-biz readers compare against a growth platform. No existing head-to-head. | Low. |
| beehiiv for [use case] (e.g. "for a paid newsletter", "for a local business") | Long-tail intent, natural beehiiv fit. | Medium — rankings partly cover this; would need a distinct angle. |
| "How to start a newsletter in 2026" (top-of-funnel guide) | Very high Pinterest volume; beehiiv fits as the recommended platform. | Medium — risks becoming a thin ranking variant; only worth it as a genuine step-by-step, not a listicle. |

## Recommended (max 2)

### 1. `beehiiv vs Ghost: Which Fits a Creator Who Wants to Own the Platform?`

- **Search / reader intent:** someone choosing between a hosted newsletter growth platform
  (beehiiv) and a self-hostable publishing + membership platform (Ghost); they care about
  ownership, membership/paid tiers, and total cost.
- **Archetype:** X vs Y — short answer -> methodology -> biggest difference -> pricing ->
  review consensus per product -> use-case comparison -> verdict -> FAQ (per
  `EDITORIAL_PLAYBOOK.md`).
- **Interlinks:** `beehiiv-review`, `beehiiv-alternatives`, `best-newsletter-platforms`,
  `beehiiv-vs-substack`.
- **How beehiiv fits:** honest — beehiiv wins for growth tooling / ad network / speed to
  start; Ghost wins for full ownership / self-hosting / integrated membership site. CTA to
  beehiiv is natural for the "want to start growing now" reader; Ghost link is "Official
  site" (no affiliate).
- **Required primary sources (must be OBSERVED before drafting):**
  - `https://ghost.org/pricing/` — current Ghost(Pro) tiers + self-host framing
  - `https://ghost.org/` feature framing (membership, memberships vs newsletters)
  - `https://www.beehiiv.com/pricing` — already in `RESEARCH_SNAPSHOT_2026-08-31.md`
  - G2 / Capterra recurring themes for Ghost (praise/complaints), per evidence hierarchy
- **Status:** `DRAFT_BLOCKED_EVIDENCE` — no verified Ghost snapshot exists. Needs a
  `RESEARCH_SNAPSHOT_2026-09-xx.md` with OBSERVED official Ghost pricing/features + a review
  consensus pass.

### 2. `beehiiv vs MailerLite: Growth Platform or Low-Cost Email Sender?`

- **Search / reader intent:** budget-conscious creator / small business deciding between a
  cheap, simple email sender (MailerLite) and a newsletter growth platform (beehiiv).
- **Archetype:** X vs Y, same structure.
- **Interlinks:** `beehiiv-review`, `beehiiv-alternatives`, `best-email-marketing-for-solopreneurs`,
  `best-newsletter-platforms`.
- **How beehiiv fits:** honest — MailerLite wins on price and automation-for-sending
  simplicity; beehiiv wins on growth (recommendation network, referral program, monetization).
  Natural beehiiv CTA for the "want to grow an audience, not just send" reader.
- **Required primary sources (must be OBSERVED before drafting):**
  - `https://www.mailerlite.com/pricing` — current free tier + paid tiers + subscriber bands
  - `https://www.mailerlite.com/features` — automation, sites, what's included per tier
  - `https://www.beehiiv.com/pricing` — already verified 2026-08-31
  - G2 / Capterra recurring themes for MailerLite
- **Status:** `DRAFT_BLOCKED_EVIDENCE` — no verified MailerLite snapshot. Same requirement.

## Not recommended now

- **Kit-side expansion** (more Kit comparisons / rankings): Kit pays nothing
  (`rejected_reapply_later`); adding Kit-primary content grows the F-01 funnel misalignment.
  Hold until Kit is re-approved or an OWNER decision on F-01.
- **"How to start a newsletter" mega-guide:** only worth it as a real step-by-step with
  screenshots we are allowed to use; otherwise it becomes a thin ranking variant, which
  `CONTENT_RULES.md` prohibits.
- **ActiveCampaign / HubSpot content:** both non-approved; no funnel value.

## Why no drafts tonight

`CONTENT_RULES.md` + `EDITORIAL_PLAYBOOK.md` require every commercial article to be built on
OBSERVED official-source facts recorded in a research snapshot, with no invented pricing,
scores, or first-hand experience. Ghost and MailerLite have no verified snapshot, and the
overnight session has no OWNER to confirm live pricing/feature facts. Writing either draft now
would mean unverifiable specifics — exactly what the rules forbid. Both are therefore
`DRAFT_BLOCKED_EVIDENCE` pending a research snapshot.

## Next step for OWNER / Codex

1. OWNER or a bounded Codex task: capture `RESEARCH_SNAPSHOT_2026-09-xx.md` with OBSERVED
   Ghost + MailerLite official pricing/feature facts (+ G2/Capterra consensus).
2. Then draft the two articles above on a feature branch, following the X-vs-Y structure, and
   run `npm test` / `build` / `tsc`.
3. Decide F-01 (Kit CTA alignment) separately — see `SITE_AUDIT_2026-09-02.md`.
