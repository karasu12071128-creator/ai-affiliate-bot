import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// `new URL(...).pathname` yields "/C:/..." on Windows, so join() produced
// "C:\C:\..." and every test in this file threw ENOENT on the operator's PC
// while passing in Linux CI. fileURLToPath is the portable conversion.
const root = fileURLToPath(new URL("..", import.meta.url));

// ---------------------------------------------------------------------------
// The site-wide affiliate-exclusivity detector. Defined ONCE, because the
// coverage test below duplicated it and would therefore have stayed green with
// the real detector reverted — the third time a check in this file has proved
// something about its own copy rather than about the shipped behavior.
//
// The first version banned specific phrasings and matched nothing at all. It
// works the other way round now: a sentence that pairs an exclusivity claim
// with a commercial word and first-person framing IS a disclosure claim, and a
// disclosure claim must be scoped to what the reader is looking at. All three
// must hold — without the first-person requirement it fires on ordinary product
// prose, where "the single biggest cost" is about a vendor's pricing.
const EXCLUSIVITY = /\b(?:only|sole|solely|single|just one|no other|nothing else|none of the others)\b/i;
// A sentence can make the same claim with no exclusivity word at all:
// "beehiiv earns us a commission; every other product pays us nothing."
const OTHERS_EARN_NOTHING =
  /\b(?:every other|all other|any other|the others|the rest|everything else)\b[^.!?]*\b(?:nothing|not a (?:cent|penny)|no (?:commission|compensation|payment|money|revenue|kickback)|zero|free of|unpaid|not paid|don't|do not|doesn't|does not|never)\b/i;
const COMMERCIAL = /\b(?:commission|affiliate|earns?\s+us|we\s+earn|pays?\s+us|sponsored|referral link)\b/i;
// "this publication" is first person in everything but grammar.
const FIRST_PERSON = /\b(?:we|us|our|this (?:site|publication|newsletter|blog|review))\b/i;
const PAGE_SCOPED =
  /\b(?:on this (?:list|page)|in this (?:article|review|comparison|list|guide|roundup)|compared here|of the (?:two )?products (?:compared here|in this (?:review|article|comparison))|on this list)\b/i;

function claimsSiteWideExclusivity(sentence) {
  return (
    (EXCLUSIVITY.test(sentence) || OTHERS_EARN_NOTHING.test(sentence)) &&
    COMMERCIAL.test(sentence) &&
    FIRST_PERSON.test(sentence)
  );
}
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
  // The first version of this test banned specific phrasings, which was the
  // wrong shape: it missed "sole", "nothing else", "no other", "single", and
  // even "the only one we earn a commission from", and it never actually
  // evaluated the five sentences it was written to protect — it passed because
  // it matched nothing at all.
  //
  // So it works the other way round now. Any sentence that pairs an
  // exclusivity word with a commercial word is treated as a disclosure claim,
  // and a disclosure claim must be scoped to what the reader is looking at.
  // All three must hold. Without the first-person requirement the check fires on
  // ordinary product prose — "the single biggest cost… paid subscriptions" is
  // about a vendor's pricing, not about who pays us.

  for (const article of articles()) {
    const body = read(`src/content/articles/${article.name}`).replace(/^---[\s\S]*?\n---/, "");
    // Sentence-level, because scope and claim have to travel together to be read
    // together. Markdown emphasis is stripped so **bold** claims are not missed.
    const sentences = body
      .replace(/\*\*/g, "")
      .split(/(?<=[.!?])\s+/);

    for (const sentence of sentences) {
      if (!claimsSiteWideExclusivity(sentence)) continue;
      assert.ok(
        PAGE_SCOPED.test(sentence),
        `${article.name} makes an affiliate-exclusivity claim without scoping it to the page:\n  "${sentence.trim().slice(0, 160)}"\n` +
          'Add "in this review" / "on this list" / "of the two products compared here". ' +
          "A site-wide claim goes false the moment a second program goes live, and no one edits this file when the registry changes."
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
  // The check runs once. Without freezing, the validated object stayed exported
  // and mutable, so a later assignment could restore the exact contradiction the
  // invariant exists to prevent.
  assert.match(registry, /Object\.freeze\(target\)/, "each target must be frozen after validation");
  assert.match(registry, /Object\.freeze\(affiliateTargets\)/, "the registry itself must be frozen");
});

test("a link to a vendor we already do business with must be one we registered", async () => {
  // The previous version of this test asserted that certain strings existed in
  // check-site.mjs, so it would have stayed green if the detector had become
  // dead code — and its own copy of the URL heuristic shared the detector's
  // blind spot. It now imports the shipped predicates and runs them.
  //
  // The blind spot mattered: our real vidIQ affiliate URL is
  // https://vidiq.com/hisholabs, a bare path on the vendor's own domain. Nothing
  // about that string says "referral", so no shape heuristic can catch its
  // unregistered twin. Knowing our own vendor hosts can.
  const { registryIndex, isRegisteredAffiliate, unregisteredVendorLink, looksLikeReferral } = await import(
    "../scripts/referral-guard.mjs"
  );
  // Comments are stripped exactly as scripts/check-site.mjs strips them. Reading
  // the raw file here would let a commented-out declaration permit a link in the
  // test that the real checker would refuse — the two must agree on what counts.
  const strip = (relative) =>
    read(relative).replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
  const index = registryIndex(strip("src/lib/affiliateLinks.ts"), strip("src/lib/sourceLinks.ts"));

  // Spelling equivalence, pinned. Every one of these reaches the same page in a
  // browser as our registered vidIQ affiliate URL, so every one must require
  // rel="sponsored". A trailing-slash form once cleared both rules at once and
  // would have shipped undisclosed.
  for (const equivalent of [
    "https://vidiq.com/hisholabs",
    "https://vidiq.com/hisholabs/",
    "https://www.vidiq.com/hisholabs",
    "https://VIDIQ.com/hisholabs",
    "https://vidiq.com./hisholabs",
    "https://vidiq.com:443/hisholabs",
    "https://vidiq.com/hisholabs#anything",
    "//vidiq.com/hisholabs"
  ]) {
    assert.ok(isRegisteredAffiliate(equivalent, index), `${equivalent} is our affiliate link and must be disclosed as one`);
  }

  // Different destinations that must NOT inherit that approval.
  for (const other of [
    "https://vidiq.com/hisholabs2",
    "https://vidiq.com/hisholabs/extra",
    "https://vidiq.com:444/hisholabs",
    "https://user@vidiq.com/hisholabs",
    "https://vidiq.com./anotherpartner"
  ]) {
    assert.equal(isRegisteredAffiliate(other, index), false, `${other} is a different destination`);
    assert.ok(unregisteredVendorLink(other, index), `${other} must be flagged as an unregistered vendor URL`);
  }

  assert.ok(
    unregisteredVendorLink("https://vidiq.com/anotherpartner", index),
    "a different path on a registered vendor's domain must be refused — this is how a referral link ships undisclosed"
  );
  assert.ok(unregisteredVendorLink("https://www.beehiiv.com/?via=someoneelse", index));
  assert.ok(unregisteredVendorLink("https://beehiiv.com/pricing", index));
  assert.equal(
    unregisteredVendorLink("https://vidiq.com/hisholabs", index),
    null,
    "our own registered affiliate URL must pass"
  );
  assert.equal(unregisteredVendorLink("https://vidiq.com/", index), null, "the registered official URL must pass");
  assert.equal(
    unregisteredVendorLink("https://mailerlite.com/pricing", index),
    null,
    "a vendor with no registry entry is out of this rule's scope"
  );

  // Rule 2 covers hosts we have never registered, and only by shape.
  assert.ok(looksLikeReferral("https://someone.example/?via=abc"));
  assert.ok(looksLikeReferral("https://go.vendor.example/xyz"));
  assert.equal(
    looksLikeReferral("https://vendor.example/creatorname"),
    false,
    "recorded, not fixed: a bare custom path on an unknown host is not decidable from its shape. " +
      "If this ever returns true, the heuristic grew a rule that will also fire on ordinary links."
  );

  // And nothing unregistered may be sitting in article prose right now.
  for (const article of articles()) {
    const body = read(`src/content/articles/${article.name}`);
    for (const [, url] of body.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)) {
      assert.equal(
        unregisteredVendorLink(url, index),
        null,
        `${article.name} links to ${url} on a registry host. Register it, declare it in src/lib/sourceLinks.ts, or remove it.`
      );
      if (looksLikeReferral(url)) {
        assert.ok(index.affiliateUrls.has(url), `${article.name} contains an unregistered referral URL: ${url}`);
      }
    }
  }
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

test("the built-output checker actually runs the vendor rule and the affiliate rule", async () => {
  // Codex's finding: the previous test imported the predicates and called them,
  // which proves the predicates work but not that check-site.mjs still calls
  // them. Deleting the runtime call left all 49 tests green. This runs the real
  // script against a fixture directory and reads its failures, so the wiring is
  // what is under test.
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = await import("node:fs");
  const { spawnSync } = await import("node:child_process");
  const os = await import("node:os");
  const path = await import("node:path");

  const dist = mkdtempSync(path.join(os.tmpdir(), "site-check-fixture-"));
  try {
    mkdirSync(path.join(dist, "fixture"), { recursive: true });
    writeFileSync(
      path.join(dist, "fixture", "index.html"),
      [
        "<!doctype html><html><body><h1>Fixture</h1>",
        // An unregistered path on a vendor host we do business with.
        '<a href="https://vidiq.com/anotherpartner">a</a>',
        // Our real affiliate URL with a trailing slash and no rel. Exact-string
        // classification missed this and shipped it undisclosed.
        '<a href="https://vidiq.com/hisholabs/">b</a>',
        // Protocol-relative: a working link the old anchor matcher skipped.
        '<a href="//vidiq.com/yetanother">c</a>',
        // Trailing-dot FQDN: same host in a browser, different string.
        '<a href="https://vidiq.com./hisholabs">d</a>',
        // The operator-identity skip was a substring test, so naming our own
        // domain in a fragment exempted a link from every rule below it.
        '<a href="https://vidiq.com/hisholabs#hisholabs.com">e</a>',
        // Uppercase tag and single-quoted attribute: a browser follows it, the
        // double-quote-only matcher never saw it.
        "<A HREF='https://vidiq.com/hisholabs'>f</A>",
        // Unquoted attribute value: valid HTML a browser follows, invisible to a
        // matcher that required quotes.
        "<a href=https://vidiq.com/unquotedpartner rel=nofollow>h</a>",
        // A genuine operator link must still be exempt. It carries
        // rel="sponsored" deliberately: without the identity exemption it would
        // fall into the plain-link branch and be reported as "marked sponsored
        // but not an affiliate link", so the assertion below can actually fail.
        // The previous fixture used a bare link, which produced no diagnostic
        // whether the identity check worked or not — an unreachable assertion.
        '<a href="https://hisholabs.com/about" rel="sponsored nofollow noopener">g</a>',
        "</body></html>"
      ].join("\n")
    );

    const run = spawnSync(process.execPath, [join(root, "scripts", "check-site.mjs")], {
      encoding: "utf8",
      env: { ...process.env, SITE_DIST: dist }
    });
    const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;

    assert.notEqual(run.status, 0, "the checker must fail the build on these links");
    assert.match(
      output,
      /vidiq\.com\/anotherpartner[\s\S]*?is in the affiliate registry, but is not one of/,
      "the vendor-host rule must be reached from check-site.mjs, not merely exported"
    );
    assert.match(
      output,
      /hisholabs\/ is missing rel="sponsored"/,
      "an equivalent form of our affiliate URL must still be classified as an affiliate link"
    );
    // Asserting the URL merely appears somewhere is not enough — the
    // internal-link check also named it, wrongly, as a broken path, so this
    // assertion passed even with the outbound matcher reverted. It must be the
    // vendor rule that reports it.
    assert.match(
      output,
      /\/\/vidiq\.com\/yetanother points at vidiq\.com, which is in the affiliate registry/,
      "a protocol-relative href must reach the outbound checks, not be skipped as schemeless"
    );
    assert.doesNotMatch(
      output,
      /broken internal link -> \/\/vidiq\.com/,
      "a protocol-relative href is external; calling it a broken internal path is a wrong diagnosis"
    );
    for (const [pattern, why] of [
      [/https:\/\/vidiq\.com\.\/hisholabs is missing rel="sponsored"/, "a trailing-dot FQDN reaches the same host and must be disclosed"],
      [
        /https:\/\/vidiq\.com\/hisholabs#hisholabs\.com is missing rel="sponsored"/,
        "naming our own domain in a fragment must not exempt a link from every rule"
      ]
    ]) {
      assert.match(output, pattern, why);
    }
    // The uppercase single-quoted anchor is the same URL as the plain one, so
    // count the reports rather than matching a distinct string.
    assert.equal(
      (output.match(/https:\/\/vidiq\.com\/hisholabs is missing rel="sponsored"/g) ?? []).length,
      1,
      "<A HREF='...'> is a link a browser follows and must be inspected like any other"
    );
    assert.doesNotMatch(
      output,
      /hisholabs\.com\/about is marked rel="sponsored"/,
      "a genuine operator-identity link must stay exempt from the outbound rules"
    );
    // And the exemption must be observable rather than inferred: the operator
    // link must not be counted among the outbound product links either.
    assert.match(
      output,
      /outbound product links: 4 affiliate \(sponsored\), 1 plain/,
      "four affiliate anchors and one plain unquoted anchor; the operator link is counted as neither"
    );
    assert.match(
      output,
      /vidiq\.com\/unquotedpartner points at vidiq\.com, which is in the affiliate registry/,
      "an unquoted href is valid HTML a browser follows, so it must be inspected like any other"
    );
    assert.match(output, /SITE_DIST override in effect/, "a redirected check must announce itself, never verify silently");
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});

test("the exclusivity detector covers the claim shapes a writer would actually produce", () => {
  // Pinned as data so the detector's coverage is visible and reviewable rather
  // than implied. Each of these is the same false site-wide claim in different
  // clothes; a word list is not a claim detector, which is how the first two
  // versions of this check failed.
  // Calls the shipped detector. A private copy here would keep this test green
  // while the real one was narrowed back, which is exactly what a reviewer found.
  const caught = claimsSiteWideExclusivity;

  for (const claim of [
    "beehiiv is the only product on this site we earn a commission from.",
    "beehiiv earns us a commission; every other product pays us nothing.",
    "beehiiv pays us a commission; all other products pay zero.",
    "beehiiv is our sole affiliate partner.",
    "beehiiv earns us a commission; every other product provides no compensation.",
    "Only beehiiv pays this publication a commission."
  ]) {
    assert.ok(caught(claim), `an unscoped site-wide claim must be caught: "${claim}"`);
  }

  // And ordinary prose must not trip it, or the check gets switched off.
  for (const ordinary of [
    "The only way to move a list off Substack is to export it.",
    "beehiiv's single biggest cost at scale is paid subscriptions.",
    "We link to the official pricing page for every product in this review.",
    "No other tool in this comparison publishes deliverability figures."
  ]) {
    assert.equal(caught(ordinary), false, `ordinary prose must not be flagged: "${ordinary}"`);
  }
});

test("a declared source link is a citation, never an earning link", async () => {
  // The vendor-host rule refuses any unregistered URL on a registry host. That
  // caught something legitimate — citing a vendor's own pricing or help page,
  // which an `official-sources` article has to do to keep its promise that facts
  // are quoted or linked. Citations are therefore permitted by declaration.
  //
  // The risk that creates is obvious: the declaration list becomes a way to ship
  // an unlabelled referral URL past the guard. These assertions close it.
  const { sourceLinks, sourceLinkUrls } = await import("../src/lib/sourceLinks.ts");
  const { affiliateTargets } = await import("../src/lib/affiliateLinks.ts");

  assert.ok(sourceLinks.length > 0, "the list must not be empty, or this test passes vacuously");

  const affiliateUrls = new Set(
    Object.values(affiliateTargets)
      .map((target) => target.affiliateUrl)
      .filter(Boolean)
  );

  for (const link of sourceLinks) {
    assert.ok(
      !affiliateUrls.has(link.url),
      `${link.url} is an affiliate URL and must not be declared as a source — a citation must never earn`
    );
    assert.match(
      link.readOn,
      /^\d{4}-\d{2}-\d{2}$/,
      `${link.url} needs an ISO date it was read; a vendor page is only evidence as of a date`
    );
    assert.ok(
      Object.hasOwn(affiliateTargets, link.product),
      `${link.url} names product "${link.product}", which is not in the affiliate registry`
    );
    assert.ok(link.title.trim().length > 0, `${link.url} needs a title a human can recognize`);
  }

  assert.equal(sourceLinkUrls.size, sourceLinks.length, "duplicate source URLs are a sign of a merge mistake");
});

test("a citation may not live on a host we earn commission from", async () => {
  // Both reviewers found the same escape: declaring a DIFFERENT referral path on
  // our own commission domain — try.elevenlabs.io/anotherpartner — would ship it
  // as a plain link with no rel="sponsored" and no disclosure. Blocking the exact
  // registered URL was not enough, and "does this path look like a referral" is
  // the shape question already shown to be undecidable.
  //
  // The host is decidable. A commission domain is one we declared ourselves, so
  // every link to it must be a registered URL, never a citation.
  const { registryIndex, unregisteredVendorLink, isRegisteredAffiliate, looksLikeReferral } = await import(
    "../scripts/referral-guard.mjs"
  );
  const registry = read("src/lib/affiliateLinks.ts");
  const sources = read("src/lib/sourceLinks.ts");

  const clean = registryIndex(registry, sources);
  assert.deepEqual(clean.citationConflicts, [], "the declared sources must not sit on a commission host");
  assert.ok(clean.citationKeys.size > 0, "there must be declared citations, or this test passes vacuously");
  assert.ok(clean.affiliateHosts.size > 0, "there must be affiliate hosts, or the rule has nothing to protect");

  const smuggled = "https://try.elevenlabs.io/anotherpartner";
  const attacked = registryIndex(
    registry,
    sources.replace(
      "export const sourceLinks: SourceLink[] = [",
      `export const sourceLinks: SourceLink[] = [\n  { url: "${smuggled}", product: "elevenlabs", title: "x", readOn: "2026-09-11" },`
    )
  );

  assert.equal(attacked.citationConflicts.length, 1, "declaring a source on a commission host must be refused");
  assert.match(attacked.citationConflicts[0], /commission/);
  assert.ok(
    !attacked.citationKeys.has(smuggled),
    "a refused citation must not be added to the permitted set"
  );
  assert.ok(
    isRegisteredAffiliate(smuggled, attacked) ||
      unregisteredVendorLink(smuggled, attacked) ||
      looksLikeReferral(smuggled),
    "even if declared, the URL itself must still be caught by one of the outbound rules"
  );
});
