#!/usr/bin/env node
/**
 * Site stop check — Stop hook for the website repo.
 *
 * SILENCE MEANS THE CONTRACT TESTS PASSED — and nothing else.
 * That invariant is the whole value of the hook and it is easy to lose: a
 * version of the company repo's equivalent once exited silently when its test
 * directory was missing, so deleting the suite looked exactly like a green run.
 * Every path that does not end in a passing suite speaks here, including the
 * ones that look like nothing happened.
 *
 * It runs `npm test` (the contract suite), not the full build. The suite reads
 * source rather than `dist/`, so it is fast and needs no build step — and the
 * contracts it enforces are the ones that matter before a change is pushed:
 * affiliate `rel`, disclosure, evidence grades, declared sources, no
 * site-wide exclusivity claim. `npm run build && npm run check:site` remains a
 * separate, deliberate pre-merge step; this hook does not replace it and says so.
 */
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const TIMEOUT_MS = 120_000;

const DID_NOT_RUN = (cause) =>
  `site check: DID NOT RUN — ${cause}. This is not a pass. ` +
  "Run `npm test` before relying on the result.";

/** Returns the suite's files, or a reason. Never throws, never returns an empty list silently. */
export function collectTests(testsDir) {
  let entries;
  try {
    entries = readdirSync(testsDir);
  } catch (err) {
    return {
      files: [],
      reason:
        err.code === "ENOENT"
          ? `the tests directory is missing (${path.relative(ROOT, testsDir) || testsDir})`
          : `the tests directory could not be read (${err.code ?? "unknown error"})`
    };
  }
  const files = entries.filter((n) => n.endsWith(".test.mjs")).map((n) => path.join(testsDir, n));
  return files.length > 0
    ? { files, reason: null }
    : { files, reason: "the tests directory contains no .test.mjs files" };
}

/** Turn a finished spawnSync result into the one message to show, or null if green. */
export function describe(run) {
  if (run.status === 0) return null;

  if (run.error || run.status === null) {
    const timedOut = run.error?.code === "ETIMEDOUT" || run.signal === "SIGTERM";
    return DID_NOT_RUN(
      timedOut
        ? `the suite exceeded its ${TIMEOUT_MS / 1000}s budget`
        : run.error?.code === "ENOBUFS"
          ? "the runner produced more output than the buffer holds"
          : `the runner did not complete (${run.error?.code ?? run.signal ?? "unknown cause"})`
    );
  }

  const lines = String(run.stdout ?? "").split("\n");
  const failing = lines
    .filter((l) => /^not ok |^✖ /.test(l.trim()))
    .map((l) => l.trim().replace(/^(not ok \d+ - |✖ )/, ""))
    .slice(0, 6);
  const total = lines.filter((l) => /^not ok /.test(l.trim())).length;

  return (
    `site check: ${total || "some"} contract test(s) failing` +
    (failing.length ? ` — ${failing.join("; ")}` : "") +
    (total > failing.length ? ` (+${total - failing.length} more)` : "") +
    ". Run `npm test` for detail. Note this hook does not run the build or check:site."
  );
}

export function check(testsDir = path.join(ROOT, "tests")) {
  const { files, reason } = collectTests(testsDir);
  if (reason) return DID_NOT_RUN(reason);

  return describe(
    spawnSync(process.execPath, ["--test", ...files], {
      cwd: ROOT,
      encoding: "utf8",
      timeout: TIMEOUT_MS,
      // The default 1 MB buffer is smaller than a verbose failing run, and an
      // overflow sets status to null — which describe() would otherwise have to
      // read as a failing suite.
      maxBuffer: 32 * 1024 * 1024
    })
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const message = check();
  if (message) process.stdout.write(JSON.stringify({ systemMessage: message }));
}
