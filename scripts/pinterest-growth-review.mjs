import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const CREATIVE_TYPES = new Set([
  "comparison",
  "ranking",
  "number_hook",
  "checklist",
  "problem_solution",
  "how_to",
  "ui_mockup",
  "typography",
  "abstract",
  "human_lifestyle"
]);

const ALLOWED_DECISIONS = new Set(["KEEP", "MODIFY", "STOP", "MEASURE_MORE"]);

function isObservedNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function checkUtm(pin) {
  const url = new URL(pin.utm_url);
  assert(url.searchParams.get("utm_source") === "pinterest", `${pin.pin_id}: invalid utm_source`);
  assert(url.searchParams.get("utm_medium") === "organic_pin", `${pin.pin_id}: invalid utm_medium`);
  assert(url.searchParams.get("utm_content") === pin.pin_id, `${pin.pin_id}: utm_content must match pin_id`);
  assert(!new URL(pin.destination_url).search, `${pin.pin_id}: destination_url must remain clean`);
}

export function validateRegistry(registry) {
  assert(registry?.schema_version === "1.1", "registry schema_version must be 1.1");
  assert(Array.isArray(registry.pins), "registry pins must be an array");
  assert(registry.delivery_contract?.external_write_authorized === false, "external write must remain disabled");
  assert(registry.delivery_contract?.automatic_retry === false, "automatic retry must remain disabled");

  const ids = new Set();
  const idempotencyKeys = new Set();
  for (const pin of registry.pins) {
    assert(typeof pin.pin_id === "string" && pin.pin_id, "pin_id is required");
    assert(!ids.has(pin.pin_id), `duplicate pin_id: ${pin.pin_id}`);
    ids.add(pin.pin_id);
    assert(CREATIVE_TYPES.has(pin.creative_type), `${pin.pin_id}: unsupported creative_type`);
    assert(typeof pin.main_hypothesis === "string" && pin.main_hypothesis.trim(), `${pin.pin_id}: main_hypothesis is required`);
    assert(pin.approval?.status === "not_authorized" || pin.approval?.status === "approved", `${pin.pin_id}: invalid approval status`);
    assert(typeof pin.delivery?.idempotency_key === "string" && pin.delivery.idempotency_key, `${pin.pin_id}: idempotency key is required`);
    assert(!idempotencyKeys.has(pin.delivery.idempotency_key), `${pin.pin_id}: duplicate idempotency key`);
    idempotencyKeys.add(pin.delivery.idempotency_key);
    assert(ALLOWED_DECISIONS.has(pin.result?.decision), `${pin.pin_id}: invalid result decision`);
    assert(Array.isArray(pin.analytics_snapshots), `${pin.pin_id}: analytics_snapshots must be an array`);
    let previousObservedAt = null;
    let previousPinterest = null;
    for (const snapshot of pin.analytics_snapshots) {
      assert(typeof snapshot.observed_at === "string" && !Number.isNaN(Date.parse(snapshot.observed_at)), `${pin.pin_id}: invalid snapshot observed_at`);
      assert(snapshot.source === "manual" || snapshot.source === "api" || snapshot.source === "unavailable", `${pin.pin_id}: invalid snapshot source`);
      if (previousObservedAt) assert(snapshot.observed_at > previousObservedAt, `${pin.pin_id}: snapshots must be chronological`);
      if (snapshot.window === "cumulative" && snapshot.pinterest) {
        for (const key of ["impressions", "saves", "pin_clicks", "outbound_clicks"]) {
          assert(isObservedNumber(snapshot.pinterest[key]), `${pin.pin_id}: invalid cumulative ${key}`);
          if (previousPinterest) assert(snapshot.pinterest[key] >= previousPinterest[key], `${pin.pin_id}: cumulative ${key} cannot decrease`);
        }
        previousPinterest = snapshot.pinterest;
      }
      previousObservedAt = snapshot.observed_at;
    }
    checkUtm(pin);
  }
  return { valid: true, pin_count: registry.pins.length };
}

export function validateReferences(registry, publicationLog, boardRegistry) {
  const articles = new Map(publicationLog.records.map((record) => [record.slug, record]));
  const boards = new Map(boardRegistry.boards.map((board) => [board.id, board]));
  for (const pin of registry.pins) {
    const article = articles.get(pin.article_slug);
    assert(article, `${pin.pin_id}: missing article publication record`);
    const board = boards.get(pin.board_id);
    assert(board, `${pin.pin_id}: missing board`);
    assert(board.name === pin.board, `${pin.pin_id}: board name mismatch`);
    if (pin.publish_status !== "published") {
      assert(!article.pinterest_assets.includes(pin.pin_id), `${pin.pin_id}: unpublished Pin must not be in article publication assets`);
    } else {
      assert(typeof pin.platform_identity?.pinterest_pin_id === "string" && pin.platform_identity.pinterest_pin_id, `${pin.pin_id}: published Pin requires platform ID`);
      assert(typeof pin.platform_identity?.pin_url === "string" && pin.platform_identity.pin_url, `${pin.pin_id}: published Pin requires platform URL`);
      assert(typeof pin.platform_identity?.verified_at === "string" && !Number.isNaN(Date.parse(pin.platform_identity.verified_at)), `${pin.pin_id}: published Pin requires verification time`);
    }
  }
  return { valid: true, article_count: articles.size, board_count: boards.size };
}

function aggregate(pins, key) {
  const groups = new Map();
  for (const pin of pins) {
    const label = pin[key];
    const current = groups.get(label) ?? { label, pins: 0, impressions: 0, saves: 0, outbound_clicks: 0, affiliate_clicks: 0 };
    current.pins += 1;
    current.impressions += pin.metrics.impressions;
    current.saves += pin.metrics.saves;
    current.outbound_clicks += pin.metrics.outbound_clicks;
    current.affiliate_clicks += isObservedNumber(pin.metrics.affiliate_clicks) ? pin.metrics.affiliate_clicks : 0;
    groups.set(label, current);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    save_rate: group.impressions > 0 ? group.saves / group.impressions : null,
    outbound_click_rate: group.impressions > 0 ? group.outbound_clicks / group.impressions : null
  }));
}

function rank(groups) {
  if (groups.length < 2 || groups.some((group) => group.outbound_click_rate === null)) {
    return { status: "INSUFFICIENT_DATA", leader: null, laggard: null };
  }
  const sorted = [...groups].sort((a, b) =>
    b.outbound_click_rate - a.outbound_click_rate || b.save_rate - a.save_rate || a.label.localeCompare(b.label)
  );
  const leader = sorted[0];
  const laggard = sorted.at(-1);
  if (leader.outbound_click_rate === laggard.outbound_click_rate && leader.save_rate === laggard.save_rate) {
    return { status: "MIXED", leader: null, laggard: null };
  }
  return { status: "DIRECTIONAL", leader: leader.label, laggard: laggard.label };
}

export function reviewRegistry(registry) {
  validateRegistry(registry);
  const checkpoint = registry.rollout.analytics_checkpoint_published_pins;
  const published = registry.pins.filter((pin) => pin.publish_status === "published");
  const measured = published.filter((pin) =>
    isObservedNumber(pin.metrics?.impressions) &&
    isObservedNumber(pin.metrics?.saves) &&
    isObservedNumber(pin.metrics?.outbound_clicks)
  );
  const dataReady = published.length >= checkpoint && measured.length === published.length;
  const dimensions = Object.fromEntries(
    ["creative_type", "hook", "article_slug", "board_id"].map((key) => {
      const groups = aggregate(measured, key);
      return [key, { groups, ranking: dataReady ? rank(groups) : { status: "INSUFFICIENT_DATA", leader: null, laggard: null } }];
    })
  );

  let decision = "MEASURE_MORE";
  let dataStatus = "INSUFFICIENT_DATA";
  let reason = `Published ${published.length}/${checkpoint} Pins at the existing analytics checkpoint; ${measured.length} have comparable metrics.`;
  if (dataReady) {
    dataStatus = "COMPARABLE";
    const totalOutboundClicks = measured.reduce((sum, pin) => sum + pin.metrics.outbound_clicks, 0);
    decision = totalOutboundClicks > 0 ? "KEEP" : "MODIFY";
    reason = totalOutboundClicks > 0
      ? "The existing 10-Pin checkpoint has comparable observations and at least one outbound click. Leaders remain directional, not causal proof."
      : "The existing 10-Pin checkpoint has comparable observations but no outbound clicks. Modify the next hypothesis before allocating more Pins.";
  }

  return {
    schema_version: "1.0",
    source_last_updated: registry.last_updated,
    data_status: dataStatus,
    decision,
    reason,
    published_pins: published.length,
    measured_pins: measured.length,
    required_checkpoint: checkpoint,
    winner_claim: dataReady ? "DIRECTIONAL_ONLY" : "UNKNOWN",
    automatic_stop: false,
    dimensions,
    next_allocation: dataReady ? "REVIEW_DIRECTIONAL_RANKINGS" : "NO_REALLOCATION_UNTIL_CHECKPOINT"
  };
}

function parseArgs(argv) {
  const args = { input: "data/pinterest-pin-experiments.json", output: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--input") args.input = argv[++index];
    else if (argv[index] === "--output") args.output = argv[++index];
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const registry = JSON.parse(await readFile(args.input, "utf8"));
  const publicationLog = JSON.parse(await readFile("data/article-publication-log.json", "utf8"));
  const boardRegistry = JSON.parse(await readFile("data/pinterest-boards.json", "utf8"));
  validateReferences(registry, publicationLog, boardRegistry);
  const review = reviewRegistry(registry);
  const rendered = `${JSON.stringify(review, null, 2)}\n`;
  if (args.output) await writeFile(args.output, rendered, "utf8");
  else process.stdout.write(rendered);
  return review;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
