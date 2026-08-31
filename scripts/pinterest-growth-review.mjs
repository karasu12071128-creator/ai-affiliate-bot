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

// A manually published Pin can be evidenced by a Pinterest short link before the numeric
// platform ID is observed. The unresolved state stays explicit instead of being invented.
const IDENTITY_STATUSES = new Set(["RESOLVED", "SHORTLINK_ONLY_NOT_RESOLVED"]);

// When the numeric Pin ID is unresolved the URL is the only platform evidence, so it must
// at least be a Pinterest URL. This does not prove the Pin renders the expected content.
const PIN_URL_HOSTS = new Set(["pin.it", "pinterest.com", "www.pinterest.com"]);

function isPinterestPinUrl(value) {
  if (typeof value !== "string" || !value) return false;
  let url;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  return PIN_URL_HOSTS.has(url.hostname) || url.hostname.endsWith(".pinterest.com");
}

function isObservedNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateMetrics(metrics, label) {
  assert(metrics && typeof metrics === "object", `${label}: metrics object is required`);
  for (const [key, value] of Object.entries(metrics)) {
    assert(value === null || isObservedNumber(value), `${label}: invalid metric ${key}`);
    if (key.endsWith("_rate") && value !== null) assert(value <= 1, `${label}: metric ${key} must be between 0 and 1`);
  }
  if (isObservedNumber(metrics.impressions)) {
    for (const key of ["saves", "pin_clicks", "outbound_clicks"]) {
      if (isObservedNumber(metrics[key])) assert(metrics[key] <= metrics.impressions, `${label}: ${key} cannot exceed impressions`);
    }
    for (const [rateKey, countKey] of [["save_rate", "saves"], ["outbound_click_rate", "outbound_clicks"]]) {
      if (isObservedNumber(metrics[rateKey])) {
        assert(metrics.impressions > 0 && isObservedNumber(metrics[countKey]), `${label}: ${rateKey} requires positive impressions and ${countKey}`);
        const expected = metrics[countKey] / metrics.impressions;
        assert(Math.abs(metrics[rateKey] - expected) < 1e-9, `${label}: ${rateKey} does not match observed counts`);
      }
    }
  }
}

function checkUtm(pin) {
  const destination = new URL(pin.destination_url);
  const url = new URL(pin.utm_url);
  assert(url.origin === destination.origin && url.pathname === destination.pathname, `${pin.pin_id}: utm_url must preserve destination origin and path`);
  assert(!url.hash && !destination.hash, `${pin.pin_id}: destination URLs must not contain fragments`);
  assert(url.searchParams.get("utm_source") === "pinterest", `${pin.pin_id}: invalid utm_source`);
  assert(url.searchParams.get("utm_medium") === "organic_pin", `${pin.pin_id}: invalid utm_medium`);
  assert(url.searchParams.get("utm_campaign") === pin.article_slug, `${pin.pin_id}: utm_campaign must match article_slug`);
  assert(url.searchParams.get("utm_content") === pin.pin_id, `${pin.pin_id}: utm_content must match pin_id`);
  assert([...url.searchParams.keys()].length === 4, `${pin.pin_id}: utm_url must contain only the four approved UTM parameters`);
  assert(!destination.search, `${pin.pin_id}: destination_url must remain clean`);
}

export function validateRegistry(registry) {
  assert(registry?.schema_version === "1.1", "registry schema_version must be 1.1");
  assert(Array.isArray(registry.pins), "registry pins must be an array");
  const destinationOrigin = new URL(registry.destination_origin).origin;
  assert(registry.delivery_contract?.external_write_authorized === false, "external write must remain disabled");
  assert(registry.delivery_contract?.automatic_retry === false, "automatic retry must remain disabled");

  const ids = new Set();
  const experimentIds = new Set();
  const idempotencyKeys = new Set();
  const imageAssets = new Set();
  for (const pin of registry.pins) {
    assert(typeof pin.pin_id === "string" && pin.pin_id, "pin_id is required");
    assert(!ids.has(pin.pin_id), `duplicate pin_id: ${pin.pin_id}`);
    ids.add(pin.pin_id);
    assert(typeof pin.experiment_id === "string" && pin.experiment_id, `${pin.pin_id}: experiment_id is required`);
    assert(!experimentIds.has(pin.experiment_id), `${pin.pin_id}: duplicate experiment_id`);
    experimentIds.add(pin.experiment_id);
    assert(CREATIVE_TYPES.has(pin.creative_type), `${pin.pin_id}: unsupported creative_type`);
    assert(typeof pin.main_hypothesis === "string" && pin.main_hypothesis.trim(), `${pin.pin_id}: main_hypothesis is required`);
    assert(typeof pin.hook === "string" && pin.hook.trim(), `${pin.pin_id}: hook is required`);
    assert(typeof pin.title === "string" && pin.title.length > 0 && pin.title.length <= 100, `${pin.pin_id}: title must be 1-100 characters`);
    assert(typeof pin.description === "string" && pin.description.length > 0 && pin.description.length <= 500, `${pin.pin_id}: description must be 1-500 characters`);
    assert(new URL(pin.destination_url).origin === destinationOrigin, `${pin.pin_id}: destination origin must match registry`);
    assert(typeof pin.image_asset === "string" && /^\/pinterest\/pins\/pin\d{3}\.png$/.test(pin.image_asset), `${pin.pin_id}: invalid image_asset`);
    assert(!imageAssets.has(pin.image_asset), `${pin.pin_id}: duplicate image_asset`);
    imageAssets.add(pin.image_asset);
    assert(pin.template_id === "cgt-pin-v1", `${pin.pin_id}: unsupported template_id`);
    assert(pin.scheduled_at === null || !Number.isNaN(Date.parse(pin.scheduled_at)), `${pin.pin_id}: invalid scheduled_at`);
    assert(pin.approval?.status === "not_authorized" || pin.approval?.status === "approved", `${pin.pin_id}: invalid approval status`);
    assert(typeof pin.delivery?.idempotency_key === "string" && pin.delivery.idempotency_key, `${pin.pin_id}: idempotency key is required`);
    assert(!idempotencyKeys.has(pin.delivery.idempotency_key), `${pin.pin_id}: duplicate idempotency key`);
    idempotencyKeys.add(pin.delivery.idempotency_key);
    assert(ALLOWED_DECISIONS.has(pin.result?.decision), `${pin.pin_id}: invalid result decision`);
    validateMetrics(pin.metrics, pin.pin_id);
    assert(Array.isArray(pin.analytics_snapshots), `${pin.pin_id}: analytics_snapshots must be an array`);
    let previousObservedAt = null;
    let previousPinterest = null;
    for (const snapshot of pin.analytics_snapshots) {
      assert(typeof snapshot.observed_at === "string" && !Number.isNaN(Date.parse(snapshot.observed_at)), `${pin.pin_id}: invalid snapshot observed_at`);
      assert(snapshot.source === "manual" || snapshot.source === "api" || snapshot.source === "unavailable", `${pin.pin_id}: invalid snapshot source`);
      const observedAt = Date.parse(snapshot.observed_at);
      if (previousObservedAt !== null) assert(observedAt > previousObservedAt, `${pin.pin_id}: snapshots must be chronological`);
      if (snapshot.source === "unavailable") {
        assert(snapshot.pinterest === null && snapshot.site === null && snapshot.affiliate === null, `${pin.pin_id}: unavailable snapshot cannot contain observed metrics`);
      }
      if (snapshot.window === "cumulative" && snapshot.pinterest) {
        for (const key of ["impressions", "saves", "pin_clicks", "outbound_clicks"]) {
          assert(isObservedNumber(snapshot.pinterest[key]), `${pin.pin_id}: invalid cumulative ${key}`);
          if (previousPinterest) assert(snapshot.pinterest[key] >= previousPinterest[key], `${pin.pin_id}: cumulative ${key} cannot decrease`);
        }
        previousPinterest = snapshot.pinterest;
      }
      previousObservedAt = observedAt;
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
    assert(article.status === "published", `${pin.pin_id}: target article is not published`);
    const board = boards.get(pin.board_id);
    assert(board, `${pin.pin_id}: missing board`);
    assert(board.name === pin.board, `${pin.pin_id}: board name mismatch`);
    assert(board.target_article_types.includes(article.article_type), `${pin.pin_id}: board does not accept target article type`);
    const expectedPath = `/${pin.article_slug}/`;
    assert(new URL(pin.destination_url).pathname === expectedPath, `${pin.pin_id}: destination path does not match article_slug`);
    if (pin.publish_status !== "published") {
      assert(!article.pinterest_assets.includes(pin.pin_id), `${pin.pin_id}: unpublished Pin must not be in article publication assets`);
    } else {
      const identity = pin.platform_identity ?? {};
      const idStatus = identity.id_status ?? "RESOLVED";
      assert(IDENTITY_STATUSES.has(idStatus), `${pin.pin_id}: invalid platform identity id_status`);
      if (idStatus === "RESOLVED") {
        assert(typeof identity.pinterest_pin_id === "string" && identity.pinterest_pin_id, `${pin.pin_id}: published Pin requires platform ID`);
      } else {
        assert(identity.pinterest_pin_id === null, `${pin.pin_id}: unresolved platform identity must keep pinterest_pin_id null`);
      }
      assert(isPinterestPinUrl(identity.pin_url), `${pin.pin_id}: published Pin requires a https Pinterest platform URL`);
      assert(typeof identity.verified_at === "string" && !Number.isNaN(Date.parse(identity.verified_at)), `${pin.pin_id}: published Pin requires verification time`);
      assert(article.pinterest_assets.includes(pin.pin_id), `${pin.pin_id}: published Pin must be synced to article publication assets`);
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
