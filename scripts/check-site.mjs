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
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// `.pathname` returns "/C:/..." on Windows, so this resolved to a path that
// never exists and the check exited "dist/ not found" immediately after a
// successful build — reporting nothing while appearing to run.
const dist = fileURLToPath(new URL("../dist", import.meta.url));

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
    if (/^(https?:|mailto:|#)/.test(href)) continue;
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
const affiliateHosts = [/beehiiv\.com\/\?via=/];
let sponsored = 0;
let plainOutbound = 0;

for (const path of htmlFiles) {
  const html = readFileSync(path, "utf8");
  const from = routeOf(path);
  for (const match of html.matchAll(/<a\b([^>]*\bhref="https?:\/\/[^"]+"[^>]*)>/g)) {
    const attrs = match[1];
    const href = (attrs.match(/href="([^"]+)"/) ?? [])[1] ?? "";
    if (href.includes("hisholabs.com")) continue; // operator identity link
    const rel = (attrs.match(/rel="([^"]*)"/) ?? [])[1] ?? "";
    const isAffiliate = affiliateHosts.some((pattern) => pattern.test(href));

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
    }
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

// ------------------------------------------------------------------- report

notes.push(`pages checked: ${htmlFiles.length}`);

for (const note of notes) console.log(`  ${note}`);

if (failures.length > 0) {
  console.error(`\nFAIL — ${failures.length} problem(s):`);
  for (const failure of failures) console.error(`  - ${failure}`);
  process.exit(1);
}

console.log("\nPASS — links, sitemap, link labelling, and page structure all check out.");
