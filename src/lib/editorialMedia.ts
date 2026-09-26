/**
 * Editorial card images for the homepage "Decisions creators are making now"
 * rail.
 *
 * ARTICLE_CARD_IMAGE_REQUIRED
 * ---------------------------
 * No approved editorial image exists for any article yet. The Pinterest pins in
 * `public/pinterest/pins/` are text-led distribution graphics, not editorial
 * art, and are not reused here. Until an image is approved, each card renders
 * a CSS composition keyed by `motif` (no request, no copyright exposure) and
 * carries `data-asset-required="ARTICLE_CARD_IMAGE_REQUIRED"` in the built
 * HTML so the gap is greppable before production.
 *
 * To ship an image: add `image` to the entry with its intrinsic size,
 * provenance, and `approved: true`. Images are served from `public/`, never
 * hotlinked. The card's media box is a fixed 16:10, so the swap causes no
 * layout shift.
 */

export type CardMotif = "alternatives" | "versus" | "scale" | "voice";

export type EditorialImage = {
  /** Path under `public/`. */
  src: string;
  width: number;
  height: number;
  /** Where the image came from, on the record. */
  provenance: string;
  /** OWNER sign-off. Nothing renders without this. */
  approved: boolean;
};

export type EditorialCard = {
  /** Article slug; the card links to `/${slug}/`. */
  slug: string;
  /** Short category label shown above the title. */
  kicker: string;
  /** The decision the article settles, in one line. Replaces the SEO description on the card. */
  decision: string;
  motif: CardMotif;
  image?: EditorialImage;
};

export const editorialCards: EditorialCard[] = [
  {
    slug: "beehiiv-alternatives",
    kicker: "Newsletter",
    decision: "Leaving beehiiv? Start from the reason you want to switch, then pick the tool built for it.",
    motif: "alternatives"
  },
  {
    slug: "beehiiv-vs-substack",
    kicker: "Newsletter",
    decision: "Who owns your growth, and what the revenue share costs once readers start paying.",
    motif: "versus"
  },
  {
    slug: "beehiiv-vs-mailerlite",
    kicker: "Email",
    decision: "A newsletter you want to grow and monetize, or a simple sender that stays cheap.",
    motif: "scale"
  },
  {
    slug: "elevenlabs-for-short-form-video",
    kicker: "AI voice",
    decision: "The license rule that decides which plan you need once a Short is monetized.",
    motif: "voice"
  }
];

export function approvedCardImage(card: EditorialCard): EditorialImage | null {
  return card.image?.approved ? card.image : null;
}
