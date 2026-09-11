import type { ProductKey } from "./affiliateLinks";

/**
 * Declared source links.
 *
 * WHY THIS EXISTS.
 * `scripts/check-site.mjs` refuses any outbound link to a host that appears in
 * the affiliate registry unless it is one of the URLs registered for that host.
 * That rule catches an unregistered referral URL shipping with no label and no
 * disclosure, which is the accident worth preventing.
 *
 * But it also caught something legitimate: citing a vendor's own documentation.
 * An `official-sources` article promises its facts are "quoted or linked", and
 * the only honest way to link a vendor's pricing page or help article is to link
 * the vendor's domain on a path that is deliberately not a referral.
 *
 * So citations are permitted — but only when declared here. The guard keeps its
 * teeth (nothing undeclared reaches a vendor host) and the evidence trail becomes
 * machine-checked rather than a promise in prose. A source we cite is a source we
 * have written down, with the date we read it.
 *
 * RULES, enforced by `tests/site-contract.test.mjs`:
 *   - No entry here may be an affiliate URL. A citation must never earn.
 *   - Every entry carries `readOn`, because a vendor page is only evidence as of
 *     a date, and a price read a year ago is not a current fact.
 *   - Adding a URL here is an editorial act, not a formality: it asserts that the
 *     page was actually read on that date.
 */
export type SourceLink = {
  /** Exact URL as it appears in the article. */
  url: string;
  /** Which registry product's domain this cites. */
  product: ProductKey;
  /** What the page is, for a reader of this file. */
  title: string;
  /** ISO date the page was read. */
  readOn: string;
};

export const sourceLinks: SourceLink[] = [
  {
    url: "https://elevenlabs.io/pricing",
    product: "elevenlabs",
    title: "ElevenLabs pricing",
    readOn: "2026-09-11"
  },
  {
    url: "https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform",
    product: "elevenlabs",
    title: "Can I publish the content I generate on the platform?",
    readOn: "2026-09-11"
  },
  {
    url: "https://elevenlabs.io/docs/help-center/product/mobile-apps/eleven-labs-for-ios-and-android/how-do-credits-work-on-the-eleven-labs-ios-or-android-app",
    product: "elevenlabs",
    title: "How do credits work on the ElevenLabs iOS or Android app?",
    readOn: "2026-09-11"
  },
  {
    url: "https://elevenlabs.io/docs/help-center/account/general/do-i-use-quota-on-every-generation",
    product: "elevenlabs",
    title: "Do I use quota on every generation?",
    readOn: "2026-09-11"
  }
];

export const sourceLinkUrls: ReadonlySet<string> = new Set(sourceLinks.map((link) => link.url));
