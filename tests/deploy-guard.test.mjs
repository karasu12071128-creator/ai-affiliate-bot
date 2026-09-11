/**
 * The deploy guard's contract, including the parts it cannot keep.
 *
 * A push to `main` in this repo deploys to production with no gate in between.
 * The guard adds friction on the obvious forms. These tests pin both halves:
 * what it refuses, and what it demonstrably lets through — because a guard
 * whose limits are not written down gets mistaken for a boundary, and that
 * mistake is more dangerous than having no guard at all.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { decide } from "../scripts/hooks/deploy-guard.mjs";

const bash = (command) => ({ tool_name: "Bash", tool_input: { command } });

test("the obvious ways to deploy are refused", () => {
  for (const cmd of [
    "git push origin main",
    'git push origin "main"',
    "git push --force origin main",
    "git push -f origin main",
    "git push origin master",
    "git push origin HEAD:main",
    'sh -c "git push origin main"',
    "npx wrangler deploy",
    "netlify deploy --prod",
    "vercel --prod",
    "npm publish",
    "gh release create v1",
    "gh pr merge 3"
  ]) {
    assert.ok(decide(bash(cmd)), `${cmd} must be refused`);
  }
});

test("ordinary work is not blocked", () => {
  for (const cmd of [
    "npm test",
    "npm run build",
    "npm run check:site",
    "git status",
    "git add -A",
    'git commit -m "content: fix a typo"',
    "git push origin feat/my-branch",
    "git fetch origin",
    "npx tsc --noEmit"
  ]) {
    assert.equal(decide(bash(cmd)), null, `${cmd} must stay allowed`);
  }
});

test("a denied phrase quoted as data does not trip the guard", () => {
  // A guard that fires when you grep for the thing it blocks is a guard people
  // switch off.
  assert.equal(decide(bash('grep -rn "git push origin main" docs/')), null);
  assert.equal(decide(bash("echo 'git push origin main'")), null);
});

test("KNOWN BYPASSES: these reach production and are not fixed", () => {
  // Recorded, not repaired. Each one is a way a person or a script actually
  // reaches production past this guard. They are listed so that nobody reads
  // the guard as enforcement.
  //
  // `git push` with no arguments is the most important of them, because it is
  // the form an ordinary person types when the branch already tracks
  // origin/main. A guard that stops the explicit spelling and waves through the
  // habitual one is friction, and only friction.
  //
  // If any of these starts being refused, the guard grew a pattern: update the
  // threat model in deploy-guard.mjs rather than assuming it became a boundary.
  const knownBypasses = [
    "git push",
    "B=main; git push origin $B",
  ];
  // git push origin HEAD:main and sh -c "git push origin main" are both refused — the word `main` appears in the
  // refspec — so it is asserted in the refused set above, not here. Checked by
  // running it, not by reading the regex.
  for (const cmd of knownBypasses) {
    assert.equal(
      decide(bash(cmd)),
      null,
      `${cmd} is a KNOWN bypass and must remain documented as one`
    );
  }
});

test("the refusal explains itself and admits it can be worked around", () => {
  const verdict = decide(bash("git push origin main"));
  assert.match(verdict.reason, /OWNER action/);
  assert.match(
    verdict.reason,
    /friction rather than a boundary/,
    "the refusal must not imply it is enforcement"
  );
});

test("a malformed payload allows rather than crashing the session", () => {
  assert.equal(decide(undefined), null);
  assert.equal(decide({}), null);
  assert.equal(decide({ tool_name: "Bash" }), null);
  assert.equal(decide({ tool_name: "Read", tool_input: { command: "git push origin main" } }), null);
});
