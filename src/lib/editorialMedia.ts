/**
 * Editorial card images for the homepage "Decisions creators are making now"
 * rail.
 *
 * Every image is an approved vNext asset in `public/media/vnext/` (OWNER,
 * commit 156f278). Sources are never altered; they are imported so the build
 * emits right-sized AVIF/WebP. Nothing is hotlinked. The card's media box is a
 * fixed 16:10, the images' own ratio, so there is no layout shift.
 *
 * Mapping note: the site has no YouTube-growth article. The creator-growth
 * image goes on beehiiv vs MailerLite, whose question is literally "growth
 * platform or low-cost sender?"; the AI voice image goes on the ElevenLabs
 * guide.
 */
import newsletter01 from "../../public/media/vnext/article-newsletter-01.jpg";
import newsletter02 from "../../public/media/vnext/article-newsletter-02.jpg";
import aiVoice from "../../public/media/vnext/article-ai-voice.jpg";
import creatorGrowth from "../../public/media/vnext/article-creator-growth.jpg";

const vnextProvenance = "Approved vNext editorial asset added by OWNER in commit 156f278 (2026-09-26).";

export type EditorialImage = {
  image: ImageMetadata;
  /** CSS object-position, so a crop can keep the subject at every breakpoint. */
  focus?: string;
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
  image?: EditorialImage;
};

export const editorialCards: EditorialCard[] = [
  {
    slug: "beehiiv-alternatives",
    kicker: "Newsletter",
    decision: "Leaving beehiiv? Start from the reason you want to switch, then pick the tool built for it.",
    image: { image: newsletter01, focus: "40% 50%", provenance: `article-newsletter-01.jpg. ${vnextProvenance}`, approved: true }
  },
  {
    slug: "beehiiv-vs-substack",
    kicker: "Newsletter",
    decision: "Who owns your growth, and what the revenue share costs once readers start paying.",
    image: { image: newsletter02, provenance: `article-newsletter-02.jpg. ${vnextProvenance}`, approved: true }
  },
  {
    slug: "beehiiv-vs-mailerlite",
    kicker: "Audience growth",
    decision: "A newsletter you want to grow and monetize, or a simple sender that stays cheap.",
    image: { image: creatorGrowth, focus: "45% 50%", provenance: `article-creator-growth.jpg. ${vnextProvenance}`, approved: true }
  },
  {
    slug: "elevenlabs-for-short-form-video",
    kicker: "AI voice",
    decision: "The license rule that decides which plan you need once a Short is monetized.",
    image: { image: aiVoice, focus: "40% 50%", provenance: `article-ai-voice.jpg. ${vnextProvenance}`, approved: true }
  }
];

export function approvedCardImage(card: EditorialCard): EditorialImage | null {
  return card.image?.approved ? card.image : null;
}
