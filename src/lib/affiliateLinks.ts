export type ProductKey =
  | "kit"
  | "beehiiv"
  | "activecampaign"
  | "hubspot"
  | "elevenlabs"
  | "vidiq"
  | "aistudios";

/**
 * `status` is the state of the *program*. `affiliateUrl` is what the site can
 * actually link. They are not the same thing, and conflating them left the site
 * unable to describe a real relationship truthfully:
 *
 *   `approved_link_pending` — the program is live and we will earn on it, but
 *   the referral URL is not stored in this repository. Nothing on the site
 *   links it, so nothing may be marked `sponsored`; the disclosure page must
 *   not report it as "no relationship" either.
 *
 * Only `affiliateUrl` decides `rel="sponsored"`. Only `status` decides what we
 * tell readers about the commercial relationship.
 */
type AffiliateStatus =
  | "not_applied"
  | "phase_2"
  | "approved"
  | "approved_link_pending"
  | "pending_review"
  | "rejected"
  | "rejected_reapply_later";

type AffiliateTarget = {
  product: string;
  officialUrl: string;
  affiliateUrl: string | null;
  trackingId: string | null;
  status: AffiliateStatus;
};

export const affiliateTargets: Record<ProductKey, AffiliateTarget> = {
  kit: {
    product: "Kit",
    officialUrl: "https://kit.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "rejected_reapply_later"
  },
  beehiiv: {
    product: "beehiiv",
    officialUrl: "https://www.beehiiv.com/",
    affiliateUrl: "https://www.beehiiv.com/?via=5v0uGdI",
    trackingId: "5v0uGdI",
    status: "approved"
  },
  activecampaign: {
    product: "ActiveCampaign",
    officialUrl: "https://www.activecampaign.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "rejected"
  },
  hubspot: {
    product: "HubSpot",
    officialUrl: "https://www.hubspot.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "phase_2"
  },
  elevenlabs: {
    product: "ElevenLabs",
    officialUrl: "https://elevenlabs.io/",
    // Active per OWNER confirmation 2026-09-10, but the referral URL is not in
    // this repository. Inventing one would send readers through a link we
    // cannot verify, so the site links nothing until the exact URL is supplied.
    affiliateUrl: null,
    trackingId: null,
    status: "approved_link_pending"
  },
  vidiq: {
    product: "vidIQ",
    officialUrl: "https://vidiq.com/",
    // Custom referral path supplied by OWNER 2026-09-10. The domain responds;
    // the path itself returned HTTP 429 to an automated request and was not
    // independently opened.
    affiliateUrl: "https://vidiq.com/hisholabs",
    trackingId: null,
    status: "approved"
  },
  aistudios: {
    product: "AI Studios",
    officialUrl: "https://www.aistudios.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "pending_review"
  }
};

/** Single source for the content schema's product enum, so the two cannot drift. */
export const productKeys = Object.keys(affiliateTargets) as [ProductKey, ...ProductKey[]];

// Splitting "has a URL" from "has a relationship" made a contradiction expressible: a
// target could carry a commission URL — which renders rel="sponsored" — while its status
// told the disclosure page there was no relationship at all. Nothing bound the two fields,
// so bind them here. This runs at module load, which means a violation fails the build
// rather than reaching a reader.
for (const [key, target] of Object.entries(affiliateTargets)) {
  if (target.affiliateUrl !== null && target.status !== "approved") {
    throw new Error(
      `affiliateLinks: ${key} carries an affiliateUrl but its status is "${target.status}". ` +
        `Only an approved program may have a live link, because a link is what marks a page sponsored.`
    );
  }
  if (target.status === "approved" && target.affiliateUrl === null) {
    throw new Error(
      `affiliateLinks: ${key} is approved but has no affiliateUrl. Use "approved_link_pending" ` +
        `if the referral URL is not stored here, so the disclosure page can say so.`
    );
  }
}

export function getAffiliateHref(product: ProductKey): string {
  const target = affiliateTargets[product];
  return target.affiliateUrl ?? target.officialUrl;
}

export function getAffiliateLabel(product: ProductKey): string {
  return `Go to ${affiliateTargets[product].product}`;
}

export function isAffiliateLink(product: ProductKey): boolean {
  return affiliateTargets[product].affiliateUrl !== null;
}

/**
 * Whether a commercial relationship exists at all, regardless of whether the
 * site currently has a link for it. The disclosure page reports this; only
 * `isAffiliateLink` may drive `rel="sponsored"`.
 */
export function hasAffiliateProgram(product: ProductKey): boolean {
  const status = affiliateTargets[product].status;
  return status === "approved" || status === "approved_link_pending";
}

export function getLinkKind(product: ProductKey): "Affiliate link" | "Official site" {
  return isAffiliateLink(product) ? "Affiliate link" : "Official site";
}

// Only a real affiliate link may be marked rel="sponsored". Marking an ordinary
// official-site link as sponsored would misstate the relationship to readers and crawlers.
export function getAffiliateRel(product: ProductKey): string {
  return isAffiliateLink(product) ? "sponsored nofollow noopener" : "nofollow noopener";
}

export function getAffiliateStatusNote(product: ProductKey): string {
  const target = affiliateTargets[product];
  if (target.affiliateUrl) {
    return "This is an approved affiliate link. We may earn a commission at no additional cost to you.";
  }
  if (target.status === "approved_link_pending") {
    return `We have an affiliate relationship with ${target.product}, but no referral link is live on this site yet, so this link earns us nothing.`;
  }
  return `This is the plain ${target.product} website. We have no active affiliate link for it, so this link earns us nothing.`;
}
