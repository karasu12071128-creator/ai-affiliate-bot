# Creator Growth Tools vNext — final QA package

Captured from the built local site on 2026-10-01. This package is for OWNER review; it is not evidence of a production deployment.

## Review images

1. `1-desktop-first-viewport.jpg` — 1440×1000 first viewport
2. `2-desktop-full-homepage.jpg` — 1440px full homepage
3. `3-m390-first-viewport.jpg` — 390×844 first viewport
4. `4-m390-decision-articles.jpg` — 390×844 editorial article section
5. `5-m430-first-viewport.jpg` — 430×932 first viewport
6. `6-second-shiori-video-section.jpg` — secondary brand-guide section
7. `7-disclosure-footer.jpg` — brand guide, reader disclosure, and footer

## Browser behavior

`browser-qa.json` records the assertions from H.264-capable local Chrome:

- primary hero decoded at 1280×720 and played;
- secondary Shiori media had no `src`, request, or decoded data before scroll;
- secondary media attached its source and played at 1920×1080 near `#brand`;
- no horizontal overflow at 390, 430, or 1440px;
- `prefers-reduced-motion: reduce` removed both video sources, produced zero MP4 requests, and retained both poster backgrounds.

## Article regression

`article-regression-qa.json` covers six principal decision pages at 390px. Each returned HTTP 200 with a visible H1, evidence mark, page-specific disclosure, working CTA metadata, canonical URL, no horizontal overflow, and no internal experiment or pipeline language.

## Lighthouse 12.8.2

Runs were performed sequentially to avoid CPU contention.

| Page/profile | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Homepage desktop | 100 | 100 | 100 | 100 | 459 ms | 0 | 0 ms |
| Homepage mobile | 97 | 100 | 100 | 100 | 2,040 ms | 0 | 160 ms |
| beehiiv vs Substack mobile | 99 | 100 | 100 | 100 | 925 ms | 0 | 135 ms |
| Affiliate disclosure mobile | 100 | 100 | 100 | 100 | 1,064 ms | 0 | 60 ms |

Raw reports are the four `lighthouse-*.json` files. Media sizes and loading policy are in `file-size-report.md`.

## Environment limit

Chrome playback and iPhone-size responsive behavior were verified on Windows. A physical iPhone/Safari run was not available in this environment. The implementation uses `muted`, `playsinline`, poster backgrounds, fixed dimensions, and reduced-motion source removal to cover Safari autoplay refusal and Low Power Mode without leaving an empty frame.
