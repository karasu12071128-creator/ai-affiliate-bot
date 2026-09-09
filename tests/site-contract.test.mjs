import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// `new URL(...).pathname` yields "/C:/..." on Windows, so join() produced
// "C:\C:\..." and every test in this file threw ENOENT on the operator's PC
// while passing in Linux CI. fileURLToPath is the portable conversion.
const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFileSync(join(root, relative), "utf8");

/**
 * These tests protect the contracts that make the site's trust claims true.
 * They read source, not the build output, so they run without a build step
 * and fail on the commit that breaks the contract rather than at deploy time.
 */

function declaredCategoryKeys() {
  const source = read("src/lib/categories.ts");
  return [...source.matchAll(/^\s{4}key: "([a-z0-9-]+)",$/gm)].map((match) => match[1]);
}

function declaredEvidenceGrades() {
  const source = read("src/lib/evidence.ts");
  const block = source.match(
    /export const evidenceGrades: \[EvidenceGrade, \.\.\.EvidenceGrade\[\]\] = \[([^\]]+)\]/
  );
  assert.ok(block, "evidenceGrades array must be present in src/lib/evidence.ts");
  return [...block[1].matchAll(/"([a-z-]+)"/g)].map((match) => match[1]);
}

function articles() {
  const dir = join(root, "src/content/articles");
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .map((name) => {
      const raw = readFileSync(join(dir, name), "utf8");
      const frontmatter = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      assert.ok(frontmatter, `${name} must start with frontmatter`);
      return { name, frontmatter: frontmatter[1] };
    });
}

function field(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*"?([^"\\n]+)"?\\s*$`, "m"));
  return match ? match[1].trim() : null;
}

test("every article declares a category that exists in the registry", () => {
  const keys = declaredCategoryKeys();
  assert.ok(keys.length > 0, "category registry must not be empty");

  for (const article of articles()) {
    const category = field(article.frontmatter, "category");
    assert.ok(category, `${article.name} must declare a category`);
    assert.ok(
      keys.includes(category),
      `${article.name} declares category "${category}", which is not in src/lib/categories.ts`
    );
  }
});

test("every article declares a known evidence grade", () => {
  const grades = declaredEvidenceGrades();
  assert.deepEqual(grades, ["official-sources", "hands-on", "not-yet-tested"]);

  for (const article of articles()) {
    const evidence = field(article.frontmatter, "evidence");
    assert.ok(evidence, `${article.name} must declare an evidence grade`);
    assert.ok(
      grades.includes(evidence),
      `${article.name} declares evidence "${evidence}", which is not a known grade`
    );
  }
});

test("no article claims hands-on evidence without saying what was exercised", () => {
  // The hands-on grade is the site's strongest claim. It may only be used with
  // a testedNote naming what was actually done in a real account, so the grade
  // can never be a bare assertion of experience.
  for (const article of articles()) {
    if (field(article.frontmatter, "evidence") !== "hands-on") continue;
    const note = field(article.frontmatter, "testedNote");
    assert.ok(
      note && note.length > 0,
      `${article.name} claims hands-on evidence but has no testedNote`
    );
  }
});

test("only products with a real affiliate link are marked sponsored", () => {
  const source = read("src/lib/affiliateLinks.ts");
  // getAffiliateRel must remain keyed off isAffiliateLink, never off status or
  // a hardcoded product list. Mislabelling either direction is a disclosure defect.
  assert.match(
    source,
    /export function getAffiliateRel\(product: ProductKey\): string \{\s*return isAffiliateLink\(product\)\s*\?\s*"sponsored nofollow noopener"\s*:\s*"nofollow noopener";/,
    "getAffiliateRel must derive rel from isAffiliateLink only"
  );
  assert.match(
    source,
    /return affiliateTargets\[product\]\.affiliateUrl !== null;/,
    "isAffiliateLink must test for a real affiliate URL"
  );
});

test("the affiliate registry matches the affiliate program data file", () => {
  // Comments are stripped before any of the matching below. Reading them was a
  // real hole: a target could carry a live commission URL while a nearby comment
  // containing `affiliateUrl: null` satisfied every check in this test.
  const registry = read("src/lib/affiliateLinks.ts")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
  const yaml = read("data/affiliate-programs.yaml");

  // Every product with an affiliate URL in the registry must be approved in the
  // data file, and every approved program must have an affiliate URL. A drift
  // in either direction would put a live commission link on an unapproved
  // program, or hide one that is approved.
  const registryLinked = [...registry.matchAll(/^\s{2}(\w+): \{[\s\S]*?\n\s{2}\}/gm)]
    .filter((match) => !/affiliateUrl: null/.test(match[0]))
    .map((match) => match[1]);

  const yamlApproved = [...yaml.matchAll(/- product: "([^"]+)"[\s\S]*?approval_status: "([^"]+)"/g)]
    .filter(([, , status]) => status === "approved")
    .map(([, product]) => product.toLowerCase());

  assert.deepEqual(
    registryLinked.map((key) => key.toLowerCase()).sort(),
    yamlApproved.sort(),
    "products carrying an affiliate URL must be exactly the approved programs"
  );

  // `approved_link_pending` exists so a live program with no stored referral URL
  // can be disclosed honestly. It must never become a way to ship a commission
  // link that the check above would otherwise have to match against "approved":
  // in both files, that status requires the absence of a URL.
  const yamlPending = [...yaml.matchAll(/- product: "([^"]+)"[\s\S]*?approval_status: "([^"]+)"[\s\S]*?affiliate_link: ([^\r\n]+)/g)]
    .filter(([, , status]) => status === "approved_link_pending");
  for (const [, product, , link] of yamlPending) {
    assert.equal(
      link.trim(),
      "null",
      `${product} is approved_link_pending, so its affiliate_link must stay null`
    );
  }

  const registryPending = [...registry.matchAll(/^\s{2}(\w+): \{[\s\S]*?\n\s{2}\}/gm)]
    .filter((match) => /status: "approved_link_pending"/.test(match[0]));
  for (const match of registryPending) {
    assert.match(
      match[0],
      /affiliateUrl: null/,
      `${match[1]} is approved_link_pending, so it must carry no affiliateUrl`
    );
  }

  // The two files must describe the same set of products, or one of them is
  // silently omitting a commercial relationship.
  const registryProducts = [...registry.matchAll(/^\s{4}product: "([^"]+)",$/gm)].map((m) => m[1].toLowerCase());
  const yamlProducts = [...yaml.matchAll(/- product: "([^"]+)"/g)].map((m) => m[1].toLowerCase());
  assert.deepEqual(
    registryProducts.sort(),
    yamlProducts.sort(),
    "the registry and the program data file must cover the same products"
  );
});

test("no article claims a site-wide affiliate exclusivity it cannot keep", () => {
  // Five articles said beehiiv was "the only product on this site we earn a
  // commission from". That was true with one program and became false the moment
  // a second went live — a false disclosure, shipped by a registry change that
  // never touched the articles. Page-scoped wording ("in this review", "on this
  // list", "in this article") stays true as the program set changes; site-scoped
  // wording cannot, so it is banned outright.
  const exclusivity =
    /(?:only|one)\s+(?:\w+\s+){0,2}(?:product|platform|tool|relationship)[^.]{0,80}?(?:we\s+(?:earn|hold)|affiliate)|our only active affiliate[^.]{0,60}/gi;

  // A claim is fine when it is scoped to what the reader is looking at. It is
  // only unsafe when it speaks for the whole site, because the registry can
  // gain a program without anyone opening this file.
  const pageScoped = /\b(?:on this list|in this (?:article|review|comparison|list|guide)|compared here|on this page|of the (?:two )?products (?:compared here|in this review))\b/i;

  for (const article of articles()) {
    const body = read(`src/content/articles/${article.name}`).replace(/^---[\s\S]*?\n---/, "");
    for (const [hit] of body.matchAll(exclusivity)) {
      assert.ok(
        pageScoped.test(hit),
        `${article.name} claims affiliate exclusivity without scoping it to the page: "${hit.trim()}". ` +
          "Say \"in this review\" / \"on this list\" instead — a site-wide claim goes false the moment a second program goes live."
      );
    }
  }
});

test("a live affiliate URL cannot exist without an approved program", () => {
  // The registry splits "has a URL" (drives rel=sponsored) from "has a program"
  // (drives disclosure copy). Nothing bound them, so a pending_review target with
  // a URL would have rendered a sponsored link while the disclosure page told
  // readers there was no relationship. The invariant is enforced at module load
  // so a violation fails the build; this asserts the guard is still there.
  const registry = read("src/lib/affiliateLinks.ts");
  assert.match(
    registry,
    /for \(const \[key, target\] of Object\.entries\(affiliateTargets\)\)/,
    "the registry must validate its own targets at module load"
  );
  assert.match(
    registry,
    /target\.affiliateUrl !== null && target\.status !== "approved"/,
    "a non-approved program carrying an affiliate URL must throw"
  );
  assert.match(
    registry,
    /target\.status === "approved" && target\.affiliateUrl === null/,
    "an approved program with no URL must throw rather than silently disclose nothing"
  );
});

test("the built-output link check derives affiliate URLs from the registry", () => {
  // These were hardcoded to beehiiv. A second live program would have had its
  // correct sponsored link classified as a plain link and failed the build.
  const script = read("scripts/check-site.mjs");
  assert.match(
    script,
    /affiliateLinks\.ts/,
    "check-site must read the affiliate registry rather than hardcode hosts"
  );
  assert.doesNotMatch(
    script,
    /const affiliateHosts = \[/,
    "the hardcoded affiliate host list must not come back"
  );
});

test("the homepage ships no fabricated media, metrics, or social proof", () => {
  const home = read("src/pages/index.astro");

  // v0.2 removed the empty presenter slot rather than shipping structure that
  // renders nothing. The rule it protected still holds: the homepage carries no
  // stand-in media and no borrowed authority.
  //
  // v0.4 admits exactly one exception — the hero media layer — and constrains
  // it so it cannot become a stand-in. Still images stay banned outright, and
  // the one permitted <video> may not name a file: its src and poster must be
  // bound from the approved registry, so media cannot reach the page without
  // passing the checks asserted in the next test.
  assert.doesNotMatch(home, /<img|<picture/, "homepage must ship no image stand-ins");

  const videoTags = home.match(/<video[\s\S]*?\/>/g) ?? [];
  assert.ok(videoTags.length <= 1, "homepage may carry at most one media layer");
  for (const tag of videoTags) {
    assert.match(tag, /src=\{heroMedia\.src\}/, "hero video src must come from the registry");
    assert.match(tag, /poster=\{heroMedia\.poster\}/, "hero video poster must come from the registry");
    assert.doesNotMatch(tag, /src="/, "hero video must not hard-code a file path");
  }
  if (videoTags.length === 1) {
    assert.match(
      home,
      /activeHeroMedia\(\)/,
      "the media layer must be gated on the approved-asset lookup"
    );
  }
  assert.doesNotMatch(
    home,
    /testimonial|as seen (in|on)|trusted by|logo(s)?-?(wall|cloud)|★|customers say/i,
    "homepage must carry no testimonials, logo walls, or borrowed authority"
  );

  // Every figure shown in the hero instrument must be counted from the article
  // collection, never hand-typed. A bare digit in JSX text would be a literal.
  assert.match(home, /coverageCount|matchupCovered|articles\.length/, "hero figures must be derived");
  assert.doesNotMatch(
    home,
    />\s*[0-9][0-9,.]*\s*(\+|k|K|m|M)?\s*(readers|users|subscribers|reviews|visitors)/,
    "no hand-typed audience or volume figures"
  );
});

test("hero media can only ship as an approved, attributed asset", () => {
  const media = read("src/lib/heroMedia.ts");

  // Rendering is gated on the approval flag, not merely on an asset existing.
  assert.match(
    media,
    /heroMediaLibrary\.find\(\(asset\) => asset\.approved\)/,
    "only an approved asset may be selected for render"
  );

  // Every registered asset states where it came from and ships a poster. The
  // poster is what reduced-motion and slow connections actually see, so an
  // asset without one is incomplete rather than merely unpolished.
  const entries = [...media.matchAll(/\{[^{}]*?\bsrc:\s*"[^"]+"[\s\S]*?\}/g)];
  for (const [entry] of entries) {
    assert.match(entry, /poster:\s*"[^"]+"/, "a registered hero asset must declare a poster");
    assert.match(entry, /provenance:\s*"[^"]+"/, "a registered hero asset must declare provenance");
    assert.match(entry, /approved:\s*(true|false)/, "a registered hero asset must state approval");
  }

  // The stage must stay legible with the footage gone: the copy contrast comes
  // from the scrim, and reduced motion drops the video entirely.
  const css = read("src/styles/global.css");
  assert.match(css, /prefers-reduced-motion: reduce\)[\s\S]{0,200}\.stage-media\s*\{\s*display:\s*none/,
    "reduced motion must drop the hero video and leave the poster");
});

test("the homepage claims no readership it does not measure", () => {
  // Comments are stripped first: this contract is about what reaches the
  // reader, and a source comment explaining why a claim was removed must not
  // itself trip the check.
  const home = read("src/pages/index.astro")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");

  // public/analytics.js dispatches a local event and stores nothing, so the
  // site holds no traffic data. Any popularity or readership claim on the
  // homepage would therefore be unsupported.
  assert.doesNotMatch(
    home,
    /most[- ](read|popular|viewed|visited)|most people (arrive|read|visit)|#1|top[- ]rated|best[- ]selling/i,
    "homepage must not rank anything by readership it cannot measure"
  );

  const analytics = read("public/analytics.js");
  assert.doesNotMatch(
    analytics,
    /localStorage|sessionStorage|fetch\(|navigator\.sendBeacon|XMLHttpRequest/,
    "analytics must remain local-only; a readership claim needs a real store first"
  );
});

test("affiliate disclosure stays reachable from the homepage", () => {
  const home = read("src/pages/index.astro");
  // v0.2 reduced disclosure's visual dominance. It must not have reduced its
  // presence: the homepage still links the disclosure page, and the footer
  // (rendered on every page) still carries the standing affiliate statement.
  assert.match(home, /\/affiliate-disclosure\//, "homepage must link the affiliate disclosure page");
  assert.match(
    home,
    /affiliate links/i,
    "homepage must state that some outbound links are affiliate links"
  );

  const footer = read("src/components/Footer.astro");
  assert.match(footer, /affiliate/i, "footer must carry the standing affiliate statement");
});

test("lab entries state a status and claim no results", () => {
  const lab = read("src/lib/lab.ts");

  // The Lab shows work in progress. An entry that implied a finished outcome,
  // or carried a performance figure, would break the same evidence rule the
  // articles are held to — so both are asserted against the source directly.
  const entries = [...lab.matchAll(/status:\s*"(running|building|unverified)"/g)];
  const titles = [...lab.matchAll(/^\s{4}title:/gm)];
  assert.ok(titles.length > 0, "the lab must carry at least one entry");
  assert.equal(
    entries.length,
    titles.length,
    "every lab entry must declare an explicit status"
  );

  const entryBody = lab.slice(lab.indexOf("export const labEntries"));
  assert.doesNotMatch(
    entryBody,
    /\b\d+(\.\d+)?\s*(%|x|×)|\b\d[\d,]*\s*(views|clicks|impressions|subscribers|followers|hours saved)/i,
    "lab entries must carry no metric, rate, or performance figure"
  );
  assert.doesNotMatch(
    entryBody,
    /\b(proven|guaranteed|best-in-class|industry-leading|10x)\b/i,
    "lab entries must not overclaim"
  );
});

test("a pillar with nothing published is not presented as a destination", () => {
  const home = read("src/pages/index.astro");
  // The v0.1 failure was shipping structure that led nowhere. A pillar without
  // a href must render as a plain element, never as a link.
  assert.match(home, /href:\s*null/, "an unpublished pillar must carry href: null");
  assert.match(
    home,
    /pillar\.href \?/,
    "the pillar must branch on href so an empty pillar is not a link"
  );
});

test("every static route in the sitemap has a page that builds it", () => {
  const sitemap = read("src/pages/sitemap.xml.ts");
  const paths = [...sitemap.matchAll(/^\s{4}"(\/[a-z0-9/-]*)",?$/gm)].map((match) => match[1]);
  assert.ok(paths.includes("/"), "sitemap must list the homepage");

  const pageForPath = (path) => {
    if (path === "/") return "src/pages/index.astro";
    const slug = path.replace(/^\/|\/$/g, "");
    return [`src/pages/${slug}.astro`, `src/pages/${slug}/index.astro`];
  };

  for (const path of paths) {
    const candidates = [pageForPath(path)].flat();
    const found = candidates.some((candidate) => {
      try {
        read(candidate);
        return true;
      } catch {
        return false;
      }
    });
    assert.ok(found, `sitemap lists ${path} but no page builds it (looked for ${candidates.join(", ")})`);
  }
});

test("every nav link points at a route the sitemap publishes", () => {
  const sitemap = read("src/pages/sitemap.xml.ts");
  const published = new Set(
    [...sitemap.matchAll(/^\s{4}"(\/[a-z0-9/-]*)",?$/gm)].map((match) => match[1])
  );

  for (const file of ["src/components/Header.astro", "src/components/Footer.astro"]) {
    const hrefs = [...read(file).matchAll(/href="(\/[a-z0-9/-]*)"/g)].map((match) => match[1]);
    assert.ok(hrefs.length > 0, `${file} must contain navigation links`);
    for (const href of hrefs) {
      assert.ok(published.has(href), `${file} links to ${href}, which the sitemap does not publish`);
    }
  }
});
