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

test("the presenter slot ships no media until an asset is registered", () => {
  const registry = read("src/lib/presenterAssets.ts");
  // The slot exists so a presenter asset can be added later without a redesign.
  // Until a real, approved, licensed asset is registered, the site must ship no
  // placeholder or stand-in media through it.
  assert.match(
    registry,
    /export const presenterAssets: PresenterAsset\[\] = \[\s*\];/,
    "presenterAssets must stay empty until an approved asset is registered"
  );

  const component = read("src/components/PresenterSlot.astro");
  assert.match(
    component,
    /asset &&/,
    "PresenterSlot must render nothing when no asset is registered"
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
