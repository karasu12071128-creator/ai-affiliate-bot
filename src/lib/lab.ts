/**
 * The Lab.
 *
 * Creator Growth Tools is published by a studio that builds with these tools,
 * not only writes about them. This module carries what HISHO Labs is actually
 * working on, so the homepage can show real activity instead of claiming
 * authority in the abstract.
 *
 * Two rules, both enforced by `tests/site-contract.test.mjs`:
 *
 * 1. Every entry carries an explicit `status`. There is no state that means
 *    "finished" unless it genuinely is, and work whose result has not been
 *    verified says so on the page.
 * 2. No entry carries a performance figure, outcome, or metric. An experiment
 *    that is still running has no result to report, and inventing one here
 *    would break the same evidence rule the articles are held to.
 *
 * Adding an entry means the work exists. This is not a roadmap.
 */

export type LabStatus = "running" | "building" | "unverified";

export type LabEntry = {
  /** What is being built or tested, in the studio's own words. */
  title: string;
  /** Why it is being done. One sentence, no outcome claim. */
  premise: string;
  /** Ordered stages, shown as a chain. Empty for entries that are not pipelines. */
  chain: string[];
  status: LabStatus;
  /** Plain-language state. Must not imply a result that has not been observed. */
  statusNote: string;
};

export const labStatusLabel: Record<LabStatus, string> = {
  running: "Running",
  building: "Building",
  unverified: "Result not yet verified"
};

export const labEntries: LabEntry[] = [
  {
    title: "A reusable AI presenter workflow",
    premise:
      "Testing whether one person can produce short-form video on a repeatable pipeline rather than one-off effort.",
    chain: ["Script", "Voice", "Character", "Edit", "Short"],
    status: "unverified",
    statusNote:
      "The pipeline stages are built and run locally. The first finished short has not been verified yet, so we are not claiming it works end to end."
  },
  {
    title: "Which pin creative earns the click",
    premise:
      "Publishing a fixed cohort of pins across two creative formats to see which one moves people to the article.",
    chain: [],
    status: "running",
    statusNote:
      "One pin of the cohort is out and being measured; the rest are not published yet. A single pin cannot be compared against anything, so there is no conclusion and no format is being called."
  }
];
