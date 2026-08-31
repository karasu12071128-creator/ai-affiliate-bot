export type ProductKey = "kit" | "beehiiv" | "activecampaign" | "hubspot";

type AffiliateTarget = {
  product: string;
  officialUrl: string;
  affiliateUrl: string | null;
  trackingId: string | null;
  status: "not_applied" | "phase_2" | "approved" | "pending_review" | "rejected_reapply_later";
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
    status: "pending_review"
  },
  hubspot: {
    product: "HubSpot",
    officialUrl: "https://www.hubspot.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "phase_2"
  }
};

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
  return `This is the plain ${target.product} website. We have no active affiliate link for it, so this link earns us nothing.`;
}
