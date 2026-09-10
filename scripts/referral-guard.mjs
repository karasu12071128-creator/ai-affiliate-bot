/**
 * Detection of outbound links that should have been in the affiliate registry.
 *
 * WHAT IS AND IS NOT DECIDABLE — read this before extending it.
 *
 * A referral link has no reliable shape. `https://vidiq.com/hisholabs` is our
 * real vidIQ affiliate URL and is indistinguishable, as a string, from an
 * ordinary vendor page. So a shape heuristic alone cannot answer "is this a
 * referral link" for an arbitrary host, and an adversarial review confirmed the
 * old heuristic missed exactly that form.
 *
 * Two rules are used instead, and only one of them is sound:
 *
 *   1. KNOWN VENDOR HOSTS — decidable. If a link points at a host that already
 *      appears in the registry, then it must be one of the URLs registered for
 *      that host. `https://vidiq.com/anotherpartner` is caught with certainty,
 *      because we know what our vidiq.com links are supposed to be.
 *
 *   2. REFERRAL SHAPE — a heuristic, for hosts we have never registered. It
 *      catches the common accident (a `?via=` or `/ref/` URL pasted into an
 *      article) and cannot catch a bare custom path on an unknown vendor:
 *      `https://vendor.example/creatorname` is not distinguishable from any
 *      other link, and nothing here claims otherwise.
 *
 * This module is imported by both scripts/check-site.mjs and the contract test
 * so the test exercises the shipped predicates rather than asserting that
 * source strings exist — the previous test would have stayed green if the
 * detector had become dead code.
 */

/** Normalize for comparison: lowercase host, no `www.`, no trailing slash. */
function normalize(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = u.pathname.replace(/\/$/, "");
    return { host, key: `${u.protocol}//${host}${pathname}${u.search}` };
  } catch {
    return null;
  }
}

/**
 * Build the set of URLs we have deliberately registered, indexed by host.
 * Both affiliate and official URLs count: an official vendor URL is an approved
 * destination even though it carries no commission.
 */
export function registryIndex(registrySource) {
  const byHost = new Map();
  const affiliateUrls = new Set();
  for (const [, field, url] of registrySource.matchAll(/(affiliateUrl|officialUrl):\s*"([^"]+)"/g)) {
    if (field === "affiliateUrl") affiliateUrls.add(url);
    const n = normalize(url);
    if (!n) continue;
    if (!byHost.has(n.host)) byHost.set(n.host, new Set());
    byHost.get(n.host).add(n.key);
  }
  return { byHost, affiliateUrls };
}

/**
 * Rule 1. A link to a host we already do business with must be a URL we chose.
 * Returns a reason string, or null when the link is fine.
 */
export function unregisteredVendorLink(href, index) {
  const n = normalize(href);
  if (!n) return null;
  const known = index.byHost.get(n.host);
  if (!known) return null; // not a vendor we have registered; rule 2 applies
  if (known.has(n.key)) return null;
  return (
    `${href} points at ${n.host}, which is in the affiliate registry, but is not one of ` +
    `the URLs registered for it. A different path on a vendor's own domain is how a ` +
    `referral link ships with no label, no rel, and no disclosure.`
  );
}

/**
 * Rule 2. The shapes referral links commonly take, for hosts not in the
 * registry. A heuristic by construction — see the header. It is deliberately
 * not grown to chase bare custom paths, which it cannot decide.
 */
export function looksLikeReferral(url) {
  return /[?&](via|ref|aff|affiliate|partner|fpr|rfsn|irclickid|utm_source=affiliate)=|\/(ref|aff|affiliate|partner)\/|^https?:\/\/(try|go|get|link|refer|partners?)\./i.test(
    url
  );
}
