import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
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
  const registry = read("src/lib/affiliateLinks.ts");
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
});

test("the homepage ships no fabricated media, metrics, or social proof", () => {
  const home = read("src/pages/index.astro");

  // v0.2 removed the empty presenter slot rather than shipping structure that
  // renders nothing. The rule it protected still holds and is asserted here
  // directly: the homepage carries no stand-in media and no borrowed authority.
  assert.doesNotMatch(home, /<img|<video|<picture/, "homepage must ship no media stand-ins");
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
