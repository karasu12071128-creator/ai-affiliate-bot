export type ProductKey = "kit" | "beehiiv" | "activecampaign" | "hubspot";

type AffiliateTarget = {
  product: string;
  officialUrl: string;
  affiliateUrl: string | null;
  trackingId: string | null;
  status: "not_applied" | "phase_2" | "approved";
};

export const affiliateTargets: Record<ProductKey, AffiliateTarget> = {
  kit: {
    product: "Kit",
    officialUrl: "https://kit.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "not_applied"
  },
  beehiiv: {
    product: "beehiiv",
    officialUrl: "https://www.beehiiv.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "not_applied"
  },
  activecampaign: {
    product: "ActiveCampaign",
    officialUrl: "https://www.activecampaign.com/",
    affiliateUrl: null,
    trackingId: null,
    status: "not_applied"
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
  return affiliateTargets[product].affiliateUrl ? `Visit ${affiliateTargets[product].product}` : `Visit ${affiliateTargets[product].product} official site`;
}
