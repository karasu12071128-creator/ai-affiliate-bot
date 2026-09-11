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
 *      appears in the registry, it must be one of the URLs registered for that
 *      host. `https://vidiq.com/anotherpartner` is caught with certainty,
 *      because we know what our vidiq.com links are supposed to be.
 *
 *   2. REFERRAL SHAPE — a heuristic, for hosts we have never registered. It
 *      catches the common accident (a `?via=` or `/ref/` URL pasted into an
 *      article) and cannot catch a bare custom path on an unknown vendor:
 *      `https://vendor.example/creatorname` is not distinguishable from any
 *      other link, and nothing here claims otherwise.
 *
 * WHY NORMALIZATION IS SHARED, NOT PRIVATE.
 * The first version of this module normalized only for rule 1, while the
 * built-output checker still classified affiliate links by exact string match.
 * That gap was worse than the hole it was written to close: `.../hisholabs/`
 * with a trailing slash normalized *equal* to the registered URL, so rule 1
 * cleared it, and it was *unequal* as a string, so it was never classified as
 * an affiliate link — it would have shipped with no `rel="sponsored"` and no
 * disclosure. Both questions must be answered by the same comparison, so
 * `isRegisteredAffiliate` lives here and the checker uses it.
 *
 * Port and userinfo are deliberately NOT discarded. `https://vidiq.com:444/…`
 * and `https://user@vidiq.com/…` are different endpoints from the ones we
 * registered; treating them as equal would let a link we never approved inherit
 * our approval.
 */

/**
 * Comparison key: lowercase host without `www.`, no trailing slash, fragment
 * dropped (it never changes the destination), but port and userinfo preserved.
 * Returns null for anything unparseable.
 */
function normalize(url) {
  let u;
  try {
    // A protocol-relative href ("//vendor.com/x") is a real link in a browser
    // and must not be skipped just because it lacks a scheme.
    u = new URL(url.startsWith("//") ? `https:${url}` : url);
  } catch {
    return null;
  }
  if (!/^https?:$/.test(u.protocol)) return null;
  // A trailing dot makes it a fully-qualified name that resolves to the same
  // host in a browser, so "vidiq.com." must not read as a different vendor.
  const host = u.hostname.toLowerCase().replace(/\.$/, "").replace(/^www\./, "");
  const port = u.port && u.port !== (u.protocol === "https:" ? "443" : "80") ? `:${u.port}` : "";
  const userinfo = u.username || u.password ? `${u.username}:${u.password}@` : "";
  const pathname = u.pathname.replace(/\/$/, "");
  return { host, key: `${u.protocol}//${userinfo}${host}${port}${pathname}${u.search}` };
}

/**
 * Build the set of URLs we have deliberately registered, indexed by host.
 * Both affiliate and official URLs count: an official vendor URL is an approved
 * destination even though it carries no commission.
 */
export function registryIndex(registrySource, sourceLinksSource = "") {
  const byHost = new Map();
  const affiliateUrls = new Set();
  const affiliateKeys = new Set();
  const citationKeys = new Set();
  const add = (url) => {
    const n = normalize(url);
    if (!n) return null;
    if (!byHost.has(n.host)) byHost.set(n.host, new Set());
    byHost.get(n.host).add(n.key);
    return n;
  };

  for (const [, field, url] of registrySource.matchAll(/(affiliateUrl|officialUrl):\s*"([^"]+)"/g)) {
    const n = add(url);
    if (field === "affiliateUrl") {
      affiliateUrls.add(url);
      if (n) affiliateKeys.add(n.key);
    }
  }

  // Declared citations. An `official-sources` article promises its facts are
  // quoted or linked, and the only honest way to link a vendor's pricing or help
  // page is to link that vendor's own domain on a path that is not a referral.
  // Permitting them by declaration keeps the host rule's teeth — nothing
  // undeclared reaches a vendor host — while making the evidence trail checkable
  // instead of a promise in prose. See src/lib/sourceLinks.ts.
  for (const [, url] of sourceLinksSource.matchAll(/url:\s*"([^"]+)"/g)) {
    const n = add(url);
    if (n) citationKeys.add(n.key);
  }

  return { byHost, affiliateUrls, affiliateKeys, citationKeys };
}

/**
 * Our own domain, judged by host rather than by substring. A substring test
 * treated `https://vidiq.com/hisholabs#hisholabs.com` as an operator link, which
 * let any outbound URL exempt itself from every rule by naming our domain in a
 * fragment, query, or path.
 */
export function isOperatorIdentity(href) {
  const n = normalize(href);
  return n !== null && (n.host === "hisholabs.com" || n.host.endsWith(".hisholabs.com"));
}

/**
 * Is this link one of our affiliate URLs, in any equivalent form? This is what
 * decides whether `rel="sponsored"` is required, so it must be permissive about
 * spelling and strict about destination.
 */
export function isRegisteredAffiliate(href, index) {
  const n = normalize(href);
  return n !== null && index.affiliateKeys.has(n.key);
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
    `the URLs registered for it. A different path, port, or credential on a vendor's own ` +
    `domain is how a referral link ships with no label, no rel, and no disclosure.`
  );
}

/**
 * Rule 2. The shapes referral links commonly take, for hosts not in the
 * registry. A heuristic by construction — see the header. It is deliberately
 * not grown to chase bare custom paths, which it cannot decide.
 */
export function looksLikeReferral(url) {
  return /[?&](via|ref|aff|affiliate|partner|fpr|rfsn|irclickid|utm_source=affiliate)=|\/(ref|aff|affiliate|partner)\/|^(?:https?:)?\/\/(try|go|get|link|refer|partners?)\./i.test(
    url
  );
}
