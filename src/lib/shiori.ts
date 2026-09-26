/**
 * Shiori — the site's navigator.
 *
 * Shiori (栞, "bookmark") marks where a reader should start. She is small and
 * supporting: a pointer beside the hero's decision panel, never the hero.
 *
 * SHIORI_MASCOT_ASSET_REQUIRED
 * ----------------------------
 * There is no approved mascot illustration yet. The photoreal presenter clip in
 * `heroMedia.ts` is a different asset for a different layout and is not reused
 * here. Until an illustration is approved, `ShioriGuide.astro` renders a quiet
 * bookmark mark in Shiori's pale pink — no stock person, no borrowed character.
 *
 * To ship the illustration: set `shioriMascot` to an asset with its intrinsic
 * size, provenance, and `approved: true`. The slot's box is fixed in CSS, so
 * the swap causes no layout shift.
 */

export type ShioriAsset = {
  /** Path under `public/`. SVG or a small WebP/PNG. */
  src: string;
  width: number;
  height: number;
  /** Where the illustration came from, on the record. */
  provenance: string;
  /** OWNER sign-off. Nothing renders without this. */
  approved: boolean;
};

export const shioriMascot: ShioriAsset | null = null;

export function activeShioriMascot(): ShioriAsset | null {
  return shioriMascot?.approved ? shioriMascot : null;
}
