/**
 * Shiori — the site's navigator.
 *
 * Shiori (栞, "bookmark") marks where a reader should start. She is small and
 * supporting: a pointer beside the decision cards, never the hero. The hero
 * key visual already shows her, so this component is not placed in the hero.
 *
 * The source PNG (transparent, 1024x1536) is never altered; it is imported so
 * the build emits small AVIF/WebP derivatives.
 */
import shioriMascotImage from "../../public/media/vnext/shiori-mascot.png";

export type ShioriAsset = {
  image: ImageMetadata;
  /** Where the illustration came from, on the record. */
  provenance: string;
  /** OWNER sign-off. Nothing renders without this. */
  approved: boolean;
};

export const shioriMascot: ShioriAsset | null = {
  image: shioriMascotImage,
  provenance:
    "shiori-mascot.png, 1024x1536 RGBA, added by OWNER as an approved vNext visual asset in commit 156f278 (2026-09-26).",
  approved: true
};

export function activeShioriMascot(): ShioriAsset | null {
  return shioriMascot?.approved ? shioriMascot : null;
}
