# Creator Growth Tools vNext — final media size report

Measured from the final review branch on 2026-10-01. `media-src/` files are provenance masters and are not deployed.

## Video delivery

| Role | Public asset | Display size | Duration | Public bytes | Loading |
| --- | --- | ---: | ---: | ---: | --- |
| Primary homepage hero | `public/media/vnext/hero-loop.mp4` | 1280×720 | 8.00 s | 589,833 B (576.0 KiB) | `preload="metadata"`; above the fold |
| Hero poster | `public/media/vnext/hero-loop-poster.jpg` | 1280×720 | — | 32,037 B (31.3 KiB) | Painted behind the video |
| Secondary brand guide | `public/media/shiori-hero-16x9.mp4` | 1920×1080 | 16.00 s loop derived from an 8.00 s master | 916,283 B (894.8 KiB) | No source or request until the section nears the viewport |
| Brand guide poster | `public/media/shiori-hero-16x9.jpg` | 1920×1080 | — | 79,183 B (77.3 KiB) | Painted behind the video |

Both public MP4 files are H.264, silent, faststart, and decode without errors. The secondary loop is the prior site V1 asset: its 8-second source is played forward and then backward to avoid the original cut at the loop point.

## Preserved masters

| File | Dimensions | Duration | Bytes | SHA-256 |
| --- | ---: | ---: | ---: | --- |
| `media-src/vnext/hero-loop-original.mp4` | 1280×720 | 8.00 s | 1,892,812 B | `135AA3E95A7343E2ADA0F5076CE0396CE38B7D4AA93C52166C4A9A735F10BB42` |
| `media-src/vnext/brand-guide-original.mp4` | 1920×1080 | 8.00 s | 2,584,798 B | `7AFFF86203C4F1439BE0F4CA35B0606320B8FAA197BDFF113103D6F4D5FF3027` |

The local brand master is byte-identical to `G:\マイドライブ\siori\SHIORI_MASTER_ASSETSwebsite\SHIORI_WEBSITE_HERO_16x9_V1.mp4.mp4`. The Drive original was read and copied without modification.

## Approved editorial source assets

These source files are imported through Astro. The homepage serves responsive AVIF/WebP derivatives rather than the large PNG/JPEG sources.

| Asset | Dimensions | Source bytes |
| --- | ---: | ---: |
| `hero-key-visual.png` | 1600×1000 | 1,382,491 B |
| `shiori-mascot.png` | 1024×1536 | 1,287,486 B |
| `article-newsletter-01.jpg` | 1600×1000 | 229,627 B |
| `article-newsletter-02.jpg` | 1600×1000 | 325,677 B |
| `article-ai-voice.jpg` | 1600×1000 | 225,283 B |
| `article-creator-growth.jpg` | 1600×1000 | 228,213 B |

## Measured transfer

Sequential Lighthouse 12.8.2 on the built local site measured the homepage at 811 KiB on mobile and 758 KiB on desktop. The secondary 894.8 KiB video was absent from initial requests and loaded only after the brand section entered the observer margin. Under `prefers-reduced-motion: reduce`, neither MP4 was requested and both poster backgrounds remained present.
