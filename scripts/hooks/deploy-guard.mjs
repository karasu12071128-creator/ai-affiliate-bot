#!/usr/bin/env node
/**
 * Deploy guard for the website repo — PreToolUse hook.
 *
 * WHY THIS REPO NEEDS ONE AT ALL.
 * A push to `main` here triggers a Cloudflare Pages production deploy. There is
 * no staging step and no approval gate between the push and the live site. The
 * company repo has had a safety hook since 2026-09-10; this repo, the one that
 * can actually change what the public sees, had none.
 *
 * WHAT IT IS — AND IS NOT.
 * This is FRICTION, not a security boundary, and the distinction is not
 * pedantry. It matches the text of a command. It does not resolve variables,
 * follow aliases, evaluate subshells, or understand git. Every one of these
 * walks straight past it:
 *
 *     B=main; git push origin $B
 *     git push            # when the branch already tracks origin/main
 *
 * The last one matters most, because it is the one an ordinary person types.
 * A guard that stops `git push origin main` and waves through `git push` is
 * worth having only if nobody mistakes it for protection. It is here to make an
 * automated loop, or a tired operator, pause on the obvious form — nothing more.
 *
 * The binding protection is, and remains, OWNER approval. If real enforcement is
 * wanted, it belongs in GitHub branch protection on `main`, which this file
 * cannot substitute for. That is a deliberate gap, recorded rather than papered
 * over: see docs/AUTOMATION_RUNBOOK.md.
 *
 * Reads are never blocked. Exit 0 always; the decision travels as JSON on stdout.
 */
import { pathToFileURL } from "node:url";

/**
 * Commands that put something in front of the public, or spend money.
 * Accident coverage, not an exhaustive boundary — see the header.
 */
const DENIED = [
  {
    // Any push whose arguments name main/master directly.
    re: /\bgit\s+push\b[^|;&]*\b(main|master)\b/i,
    why: "pushing to main deploys this site to production"
  },
  {
    re: /\bgit\s+push\b[^|;&]*--force\b|\bgit\s+push\b[^|;&]*\s-f\b/i,
    why: "force-pushing this repo can rewrite what is deployed"
  },
  {
    re: /\b(wrangler|netlify|vercel|surge|firebase)\b[^|;&]*(?:\b(?:deploy|publish)\b|--prod\b)/i,
    why: "deploying by hand bypasses the build that verifies the site"
  },
  {
    re: /\bnpm\s+publish\b|\b(pnpm|yarn|bun)\s+publish\b/i,
    why: "this project is not a package and publishing one is not intended"
  },
  {
    re: /\bgh\s+(release\s+create|pr\s+merge)\b/i,
    why: "releasing or merging a PR here reaches production"
  }
];

function decide(payload) {
  const tool = payload?.tool_name ?? "";
  if (tool !== "Bash" && tool !== "PowerShell") return null;
  const cmd = String(payload?.tool_input?.command ?? "");

  // `echo 'git push origin main'` is data; `git push origin "main"` is the
  // command. What separates them is the program being run, not the quoting —
  // so a reader's arguments are treated as text, and everything else has its
  // quotes stripped so quoting a word cannot hide it.
  const startsWithReader =
    /^\s*(?:echo|printf|cat|grep|rg|sed|awk|jq|less|head|tail|type|Select-String|Write-Output|Write-Host)\b/i.test(cmd);
  const inspected = startsWithReader
    ? cmd.replace(/'[^']*'/g, " ").replace(/"[^"]*"/g, " ")
    : cmd.replace(/["']/g, "");

  for (const { re, why } of DENIED) {
    if (re.test(inspected)) {
      return {
        reason:
          `Refused: ${why}. This is an OWNER action.\n` +
          "If the OWNER has approved this deploy, they can run it themselves, or you can ask them to " +
          "confirm in this session and then use a form this guard does not match — which is possible, " +
          "and is why this guard is friction rather than a boundary."
      };
    }
  }
  return null;
}

async function main() {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;

  let verdict = null;
  try {
    verdict = decide(JSON.parse(raw));
  } catch {
    // Malformed payload allows. Failing closed on an unrecognised shape would
    // break the session on the next harness change, and since this is an
    // accident guard rather than a boundary, failing open costs less. Recorded
    // as a known limitation, not an oversight.
    verdict = null;
  }

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: verdict ? "deny" : "allow",
        ...(verdict ? { permissionDecisionReason: verdict.reason } : {})
      }
    })
  );
}

export { decide, DENIED };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
