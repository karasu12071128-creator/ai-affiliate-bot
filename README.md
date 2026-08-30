# Creator Growth Tools

Lightweight Astro MVP for an English SaaS affiliate experiment focused on newsletter, email marketing, and audience growth tools.

## MVP Scope

- 1 static site
- 5 commercial/editorial articles
- 25 Pinterest pin concepts
- 3 initial affiliate candidates: Kit, beehiiv, ActiveCampaign
- No database, Docker, crawler, local image generation, or heavy frontend framework

## Local Commands

```bash
npm install
npm run dev
npm run build
npm test
npm run growth:review
npm run buffer:dry-run
```

`growth:review` validates the Pinterest experiment registry and returns an
evidence-bounded `KEEP / MODIFY / MEASURE_MORE` review. The existing 10-Pin
checkpoint must be reached before directional winners are reported.

`buffer:dry-run` builds and validates a Buffer Pinterest draft request without
making a network call. External delivery remains disabled until the image,
channel, Board, credential, due time, and one-Pin OWNER approval are provided.

## Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Astro
- Node version: 20 or newer

Do not connect a production domain, change DNS, or submit affiliate/payment/tax information without human approval.
