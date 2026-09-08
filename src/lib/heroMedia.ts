/**
 * Hero media layer.
 *
 * The homepage stage is a finished design without any media: `.stage-field`
 * draws a hairline grid and one pool of light in CSS, costing zero requests.
 * This module lets an approved motion asset sit *behind* that field, so the
 * grid becomes a scrim over footage rather than the whole background.
 *
 * WHY THIS IS NOT THE v0.1 PRESENTER SLOT
 * ---------------------------------------
 * v0.1 shipped `PresenterSlot.astro` backed by an empty `presenterAssets`
 * array. It rendered an empty box in the page flow — structure that produced
 * no pixels — and v0.2 correctly deleted it.
 *
 * This is a different shape of thing. The stage is fully designed and fully
 * rendered whether or not an asset exists here. An empty registry is not a
 * hole in the layout; it is the CSS field alone, which is the design that
 * ships today. A registered asset does not add a new region, it repaints an
 * existing one. Nothing here can render an empty container.
 *
 * RULES
 * -----
 * 1. An asset appears on the site only after OWNER approval. `approved` is
 *    not a formality — an asset with `approved: false` is never rendered.
 * 2. Every asset states its own provenance. We do not ship media whose origin
 *    we cannot describe on the record.
 * 3. A poster still is mandatory. It is what mobile, reduced-motion, and slow
 *    connections actually see, so it is part of the asset, not an extra.
 * 4. The stage must remain readable with the media removed. Copy contrast is
 *    carried by the scrim, never by the footage.
 */

export type HeroMedia = {
  /** Stable id, used in the catalog and in the publication record. */
  id: string;
  /** Path under `public/`, served from the site origin. */
  src: string;
  /** Poster still at the same framing. Shown before play, on reduced motion, and on slow links. */
  poster: string;
  /** Intrinsic pixel size of the source. Used to reserve aspect ratio and avoid layout shift. */
  width: number;
  height: number;
  /**
   * Which side of the frame the subject occupies. The stage copy is placed on
   * the opposite side, so this drives the scrim direction rather than being
   * decorative metadata.
   */
  subjectSide: "left" | "right";
  /** Where the asset came from, on the record. */
  provenance: string;
  /** OWNER sign-off. Nothing renders without this. */
  approved: boolean;
};

/**
 * Empty until the OWNER delivers and approves the 16:9 hero asset.
 *
 * The existing 9:16 Flow clips in the Shiori library are deliberately NOT
 * registered here. They are portrait 720x1280 raw captures held as vertical
 * short-form source; cropping one into a landscape hero would ship a low
 * resolution, seam-looping portrait as a background it was never framed for.
 * They stay where they are, untouched.
 */
export const heroMediaLibrary: HeroMedia[] = [];

/** The asset the stage should render, or `null` to render the CSS field alone. */
export function activeHeroMedia(): HeroMedia | null {
  return heroMediaLibrary.find((asset) => asset.approved) ?? null;
}
