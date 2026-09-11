#!/usr/bin/env node
/**
 * Post-build verification for the static site.
 *
 * Checks the built output in dist/ for the things that break silently:
 *   - internal links that 404
 *   - sitemap entries with no built page, and built pages missing from the sitemap
 *   - outbound product links whose rel attribute misstates the relationship
 *   - pages missing a single h1, or with a heading level skip
 *   - images without alt text
 *
 * Read-only. Exits non-zero on any failure so it can gate a deploy.
 * Usage: npm run build && npm run check:site
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  registryIndex,
  isOperatorIdentity,
  isRegisteredAffiliate,
  unregisteredVendorLink,
  looksLikeReferral
} from "./referral-guard.mjs";

// `.pathname` returns "/C:/..." on Windows, so this resolved to a path that
// never exists and the check exited "dist/ not found" immediately after a
// successful build — reporting nothing while appearing to run.
// SITE_DIST exists so the contract test can run this script against a fixture
// directory. Without it the test could only assert that certain strings appear
// in this file, which is what let a previous version stay green while the
// detector it named was dead code.
//
// A gate that silently verifies the wrong directory is worse than no gate: a
// stale SITE_DIST inherited from the environment would let `check:site` report
// PASS for output nobody is shipping. So the override always announces itself,
// and the directory actually inspected is printed on every run.
const defaultDist = fileURLToPath(new URL("../dist", import.meta.url));
const dist = process.env.SITE_DIST ? resolve(process.env.SITE_DIST) : defaultDist;
if (dist !== defaultDist) {
  console.warn(`  NOTE: SITE_DIST override in effect — checking ${dist}, NOT the repository's dist/.`);
}

if (!existsSync(dist)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(2);
}

const failures = [];
const notes = [];

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else out.push(path);
  }
  return out;
}

const files = walk(dist);
const htmlFiles = files.filter((path) => path.endsWith(".html"));

/** Route a built HTML file serves, e.g. dist/about/index.html -> /about/ */
function routeOf(path) {
  const rel = "/" + relative(dist, path).replace(/\\/g, "/");
  if (rel.endsWith("/index.html")) return rel.slice(0, -"index.html".length);
  return rel;
}

const routes = new Set(htmlFiles.map(routeOf));
const assets = new Set(files.map((path) => "/" + relative(dist, path).replace(/\\/g, "/")));

// --------------------------------------------------------------- internal links

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const from = routeOf(path);
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    // "//host/path" is protocol-relative and therefore EXTERNAL. Treating it as
    // an internal path reported it as a broken link, which is a wrong diagnosis
    // for a link that resolves fine in a browser; the outbound checks below are
    // the ones that should judge it.
    if (/^(https?:|mailto:|#|\/\/)/.test(href)) continue;
    const target = href.split("#")[0].split("?")[0];
    if (!target.startsWith("/")) {
      failures.push(`${from}: relative href "${href}" — use an absolute path`);
      continue;
    }
    if (routes.has(target) || assets.has(target)) continue;
    failures.push(`${from}: broken internal link -> ${target}`);
  }
}

// -------------------------------------------------------------------- sitemap

const sitemapPath = join(dist, "sitemap.xml");
if (!existsSync(sitemapPath)) {
  failures.push("dist/sitemap.xml is missing");
} else {
  const sitemap = readFileSync(sitemapPath, "utf8");
  const origin = (sitemap.match(/<loc>(https?:\/\/[^/]+)/) ?? [])[1] ?? "";
  const listed = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(origin, ""))
  );

  for (const route of listed) {
    if (!routes.has(route)) failures.push(`sitemap lists ${route} but no page was built for it`);
  }
  // 404 is intentionally excluded from the sitemap.
  for (const route of routes) {
    if (route === "/404.html") continue;
    if (!listed.has(route)) failures.push(`built page ${route} is missing from the sitemap`);
  }
  notes.push(`sitemap: ${listed.size} URLs, all resolving`);
}

// ------------------------------------------------------- outbound link labelling

// An affiliate link must be rel="sponsored ..."; a plain official-site link
// must not be. Both errors are disclosure defects, in opposite directions.
//
// The affiliate URLs are read out of the registry rather than hardcoded here.
// They were hardcoded to beehiiv, so the moment a second program went live this
// check would have classified its correct sponsored link as a plain link and
// failed the build for the opposite of the real reason. Comments are stripped
// first so a commented-out URL cannot register as live.
const registrySource = readFileSync(
  fileURLToPath(new URL("../src/lib/affiliateLinks.ts", import.meta.url)),
  "utf8"
)
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, " ");

const affiliateUrls = new Set(
  [...registrySource.matchAll(/affiliateUrl:\s*"([^"]+)"/g)].map((match) => match[1])
);

if (affiliateUrls.size === 0) {
  failures.push("no affiliate URL found in src/lib/affiliateLinks.ts — the labelling check would pass vacuously");
}
notes.push(`affiliate URLs in registry: ${affiliateUrls.size}`);

// Detection lives in referral-guard.mjs so the contract test can exercise the
// same predicates this script runs. An adversarial review found the old
// heuristic missed a bare custom path — the exact shape of our own vidIQ URL —
// so a second, decidable rule now covers every host already in the registry.
// Declared citations are read the same way and stripped the same way, so a
// commented-out source cannot silently permit a vendor-host link.
const sourceLinksSource = readFileSync(
  fileURLToPath(new URL("../src/lib/sourceLinks.ts", import.meta.url)),
  "utf8"
)
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, " ");

const vendorIndex = registryIndex(registrySource, sourceLinksSource);
notes.push(`registry vendor hosts: ${vendorIndex.byHost.size}`);
notes.push(`declared source links: ${vendorIndex.citationKeys.size}`);

// A citation on a commission domain is refused rather than silently dropped:
// the declaration was written by someone who expected it to work, and a rule
// that quietly ignores input is how a hole reopens.
for (const conflict of vendorIndex.citationConflicts) {
  failures.push(`src/lib/sourceLinks.ts: ${conflict}`);
}

let sponsored = 0;
let plainOutbound = 0;

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const from = routeOf(path);
  // Every spelling a browser follows: uppercase tags, single quotes, and an
  // unquoted attribute value. An outbound link the checker cannot see is an
  // outbound link it cannot enforce, and each of these was invisible in turn.
  // Astro emits quoted attributes, so the unquoted form only reaches here via
  // raw HTML in content — which is exactly the unreviewed path worth covering.
  for (const match of html.matchAll(
    /<a\b([^>]*\bhref\s*=\s*(?:["'](?:https?:)?\/\/[^"']+["']|(?:https?:)?\/\/[^\s>]+)[^>]*)>/gi
  )) {
    const attrs = match[1];
    const hrefMatch = attrs.match(/href\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/i) ?? [];
    const href = hrefMatch[1] ?? hrefMatch[2] ?? "";
    // Host-based, not substring. `includes("hisholabs.com")` also matched
    // https://vidiq.com/hisholabs#hisholabs.com, so an affiliate link could opt
    // itself out of every rule below by putting our own domain in its fragment.
    if (isOperatorIdentity(href)) continue;
    const relMatch = attrs.match(/rel\s*=\s*(?:["']([^"']*)["']|([^\s>]+))/i) ?? [];
    const rel = relMatch[1] ?? relMatch[2] ?? "";
    const isAffiliate = isRegisteredAffiliate(href, vendorIndex);

    if (isAffiliate) {
      sponsored += 1;
      if (!/\bsponsored\b/.test(rel)) {
        failures.push(`${from}: affiliate link ${href} is missing rel="sponsored"`);
      }
      if (!/\bnofollow\b/.test(rel) || !/\bnoopener\b/.test(rel)) {
        failures.push(`${from}: affiliate link ${href} needs nofollow and noopener`);
      }
    } else if (/data-event=/.test(attrs) || /\bnofollow\b/.test(rel)) {
      plainOutbound += 1;
      if (/\bsponsored\b/.test(rel)) {
        failures.push(
          `${from}: ${href} is marked rel="sponsored" but is not an affiliate link`
        );
      }
    } else if (looksLikeReferral(href)) {
      // A bare Markdown link is neither a CTA nor rel-tagged, so both branches
      // above skipped it entirely — a raw referral URL pasted into an article
      // shipped unlabelled and undisclosed. Anything that carries the shape of a
      // referral URL must be in the registry, which is what puts a label and a
      // rel on it.
      failures.push(
        `${from}: ${href} looks like a referral link but is not in the affiliate registry, ` +
          `so it ships with no label and no rel. Register it or link the plain vendor URL.`
      );
    }

    // Runs for every outbound link regardless of which branch above claimed it:
    // a rel-tagged link to an unregistered path on a vendor's own domain is
    // still an unregistered destination, and the shape heuristic cannot see it.
    const vendorProblem = unregisteredVendorLink(href, vendorIndex);
    if (vendorProblem && !isAffiliate) failures.push(`${from}: ${vendorProblem}`);
  }
}
notes.push(`outbound product links: ${sponsored} affiliate (sponsored), ${plainOutbound} plain`);

// ------------------------------------------- disclosure matches the real links

// The per-page disclosure states whether this page carries an affiliate link.
// Cross-check that claim against the links the page actually renders, in both
// directions: claiming one that is not there is as wrong as hiding one that is.
for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const from = routeOf(path);
  const disclosure = html.match(/<aside class="affiliate-disclosure[^"]*"[\s\S]*?<\/aside>/);
  if (!disclosure) continue;

  const text = disclosure[0].replace(/<[^>]+>/g, " ");
  const claimsAffiliate = /contains at least one affiliate link/.test(text);
  const claimsNone = /contains no affiliate links/.test(text);
  if (!claimsAffiliate && !claimsNone) continue; // site-wide notice, not a per-page claim

  const hasSponsored = /rel="[^"]*\bsponsored\b[^"]*"/.test(html);
  if (claimsAffiliate && !hasSponsored) {
    failures.push(`${from}: discloses an affiliate link but renders none`);
  }
  if (claimsNone && hasSponsored) {
    failures.push(`${from}: says it has no affiliate links but renders a sponsored link`);
  }
}

// -------------------------------------------------------------- accessibility

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const from = routeOf(path);

  const h1s = [...html.matchAll(/<h1\b/g)].length;
  if (h1s !== 1) failures.push(`${from}: expected exactly 1 <h1>, found ${h1s}`);

  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i] - levels[i - 1] > 1) {
      failures.push(`${from}: heading level skips h${levels[i - 1]} -> h${levels[i]}`);
      break;
    }
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/g)) {
    if (!/\balt="/.test(match[1])) failures.push(`${from}: <img> without alt text`);
  }

  if (!/lang="[a-z]{2}/.test(html)) failures.push(`${from}: <html> has no lang attribute`);
}

// ------------------------------------------- claims the site cannot support
//
// The source-level contract tests can be defeated through indirection: a
// component, a frontmatter value, or a constructed string ships the claim while
// the regex over `index.astro` still passes. This check reads the rendered HTML
// instead, which is what the reader actually receives, so there is nowhere for
// an unsupported claim to hide.
//
// public/analytics.js dispatches a local event and persists nothing, so the
// site holds no readership, popularity, or market-frequency evidence at all.

const unsupportedClaim =
  /most[- ](read|popular|viewed|visited|used|chosen)|most people (arrive|read|visit|choose|pick)|(the|two|three) most common (choice|pick|option)s?|people shortlist|#1\b|top[- ]rated|best[- ]selling|trusted by|as seen (in|on)/i;

let claimsChecked = 0;
for (const path of htmlFiles) {
  const from = routeOf(path);
  // Strip script/style so an analytics identifier can never look like copy.
  const body = readFileSync(path, "utf8")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const hit = body.match(unsupportedClaim);
  if (hit) {
    failures.push(
      `${from}: ships a popularity/readership claim the site has no data for — "${hit[0]}"`
    );
  }
  claimsChecked += 1;
}
notes.push(`pages scanned for unsupported popularity claims: ${claimsChecked}`);

// --------------------------------------------- hero media is real and approved
//
// Source tests assert the registry's shape. This asserts the outcome: whatever
// media the homepage actually shipped resolves to a file that exists in the
// build. A registry entry pointing at a missing asset would otherwise ship a
// broken hero and pass every source check.

const homepage = join(dist, "index.html");
if (existsSync(homepage)) {
  const home = readFileSync(homepage, "utf8");
  const stageMedia = [...home.matchAll(/<video\b[^>]*class="stage-media"[^>]*>/g)];
  if (stageMedia.length > 1) {
    failures.push("/: more than one hero media element shipped");
  }
  for (const [tag] of stageMedia) {
    for (const attribute of ["src", "poster"]) {
      const value = tag.match(new RegExp(`${attribute}="([^"]+)"`))?.[1];
      if (!value) {
        failures.push(`/: hero media has no ${attribute}`);
      } else if (!assets.has(value)) {
        failures.push(`/: hero media ${attribute} "${value}" is not in the build`);
      }
    }
  }
  // The stage must declare its own state honestly: media present iff flagged.
  const flagged = /<section class="stage" data-media="true"/.test(home);
  if (flagged !== stageMedia.length > 0) {
    failures.push(
      `/: stage data-media flag (${flagged}) disagrees with the media actually shipped (${stageMedia.length})`
    );
  }
  notes.push(`hero media shipped: ${stageMedia.length}`);
}

// ------------------------------------------------------------------- report

notes.push(`pages checked: ${htmlFiles.length}`);
notes.push(`directory verified: ${relative(process.cwd(), dist) || dist}`);

for (const note of notes) console.log(`  ${note}`);

if (failures.length > 0) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\nPASS — links, sitemap, link labelling, and page structure all check out.");
