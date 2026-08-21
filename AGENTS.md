# AGENTS.md

## Scope

This repository is the only working target for the Creator Growth Tools MVP. Do not modify other repositories.

## MVP Guardrails

- Keep the site static and lightweight.
- Use Astro, TypeScript, Markdown, and static generation.
- Do not add Docker, databases, crawlers, local LLMs, local image generation, or heavy client JavaScript.
- Do not invent affiliate links, affiliate IDs, product screenshots, pricing, customer counts, or first-hand product experience.
- Keep affiliate links centralized in `src/lib/affiliateLinks.ts` and affiliate program facts in `data/affiliate-programs.yaml`.
- Use `VERIFY_BEFORE_PUBLISH` when official information is unclear or likely to change.

## Human Approval Gates

Human approval is required before:

- Domain purchase
- DNS changes
- Affiliate applications
- Tax, payment, or personal information submission
- Affiliate terms acceptance
- Bulk Pinterest posting
