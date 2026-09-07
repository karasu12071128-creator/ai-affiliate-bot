/**
 * Presenter asset registry.
 *
 * The design system reserves a slot for an optional presenter asset — a short
 * silent loop or still of a host figure (the HISHO Labs "Shiori" utility
 * asset class, or an ordinary screen-recording / diagram). The slot exists so
 * the site can carry a distinctive visual identity later without a redesign.
 *
 * It is deliberately EMPTY today:
 *
 *   - No approved presenter asset is committed to this repository, and this
 *     repository tracks no media beyond the Pinterest pin PNGs.
 *   - `SHIORI_UTILITY` reuse is governed by the company-side asset policy;
 *     generating or publishing a new asset is an OWNER decision, not a
 *     website change.
 *
 * `PresenterSlot.astro` renders nothing while this registry is empty, so the
 * site ships no placeholder, no stock stand-in, and no fabricated media.
 * Registering a real, approved, licensed asset here is the only step needed
 * to turn the slot on. See docs/PRESENTER_SLOT.md.
 */

export type PresenterAsset = {
  /** Slot this asset fills. */
  slot: "homepage-hero" | "article-intro";
  /** Path under /public. */
  src: string;
  /** Poster still for a video asset. */
  poster?: string;
  type: "video" | "image";
  /** Required. Describes the asset for readers who cannot see it. */
  alt: string;
  /** Shown under the asset. States what it is, so it is never mistaken for a product screenshot. */
  caption: string;
  /** Provenance record required by the company asset policy before publication. */
  provenance: {
    source: string;
    license: string;
    verifiedDate: string;
  };
};

export const presenterAssets: PresenterAsset[] = [];

export function getPresenterAsset(slot: PresenterAsset["slot"]): PresenterAsset | null {
  return presenterAssets.find((asset) => asset.slot === slot) ?? null;
}
