import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { reviewRegistry, validateReferences, validateRegistry } from "../scripts/pinterest-growth-review.mjs";

const source = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));
const publicationLog = JSON.parse(await readFile("data/article-publication-log.json", "utf8"));
const boardRegistry = JSON.parse(await readFile("data/pinterest-boards.json", "utf8"));

function clone(value) {
  return structuredClone(value);
}

test("current registry validates and keeps external delivery disabled", () => {
  assert.deepEqual(validateRegistry(source), { valid: true, pin_count: 16 });
  assert.deepEqual(validateReferences(source, publicationLog, boardRegistry), { valid: true, article_count: 8, board_count: 5 });
  assert.equal(source.delivery_contract.external_write_authorized, false);
  assert.equal(source.delivery_contract.automatic_retry, false);
  assert.equal(source.pins[0].approval.status, "approved");
  assert.equal(source.pins[0].approval.scope, "manual_pinterest_publish");
  assert.equal(source.pins[0].delivery.mode, "disabled");
  assert.equal(source.pins.filter((pin) => pin.publish_status === "published").length, 1);
});

test("the manually published Pin keeps an explicit unresolved platform ID", () => {
  const pin = source.pins.find((candidate) => candidate.pin_id === "pin001");
  assert.equal(pin.publish_status, "published");
  assert.equal(pin.platform_identity.pinterest_pin_id, null);
  assert.equal(pin.platform_identity.id_status, "SHORTLINK_ONLY_NOT_RESOLVED");
  assert.equal(pin.published_at, null);
  assert.equal(pin.published_at_status, "EXACT_TIME_NOT_OBSERVED");
  assert.doesNotThrow(() => validateReferences(source, publicationLog, boardRegistry));

  const registry = clone(source);
  registry.pins[0].platform_identity.pinterest_pin_id = "invented-id";
  assert.throws(() => validateReferences(registry, publicationLog, boardRegistry), /must keep pinterest_pin_id null/);

  const unknownStatus = clone(source);
  unknownStatus.pins[0].platform_identity.id_status = "GUESSED";
  assert.throws(() => validateReferences(unknownStatus, publicationLog, boardRegistry), /invalid platform identity id_status/);
});

test("a published Pin URL must be a https Pinterest URL", () => {
  for (const badUrl of ["not-a-url", "https://example.com/kit-vs-beehiiv/", "http://pin.it/2oYb3NO1V", "https://pin.it.example.com/x"]) {
    const registry = clone(source);
    registry.pins[0].platform_identity.pin_url = badUrl;
    assert.throws(
      () => validateReferences(registry, publicationLog, boardRegistry),
      /requires a https Pinterest platform URL/,
      `${badUrl} must be rejected`
    );
  }

  const good = clone(source);
  good.pins[0].platform_identity.pin_url = "https://www.pinterest.com/pin/1234567890/";
  assert.doesNotThrow(() => validateReferences(good, publicationLog, boardRegistry));
});

test("UTM URL cannot redirect away from the clean destination", () => {
  const registry = clone(source);
  registry.pins[0].utm_url = registry.pins[0].utm_url.replace("/kit-vs-beehiiv/", "/kit-review/");
  assert.throws(() => validateRegistry(registry), /preserve destination/);
});

test("destination cannot leave the registry origin", () => {
  const registry = clone(source);
  registry.pins[0].destination_url = registry.pins[0].destination_url.replace("ai-affiliate-bot.pages.dev", "example.invalid");
  registry.pins[0].utm_url = registry.pins[0].utm_url.replace("ai-affiliate-bot.pages.dev", "example.invalid");
  assert.throws(() => validateRegistry(registry), /destination origin must match registry/);
});

test("malformed and negative metrics fail closed while null remains unknown", () => {
  const registry = clone(source);
  registry.pins[0].metrics.impressions = -1;
  assert.throws(() => validateRegistry(registry), /invalid metric impressions/);
  registry.pins[0].metrics.impressions = null;
  registry.pins[0].metrics.outbound_click_rate = 1.2;
  assert.throws(() => validateRegistry(registry), /between 0 and 1/);
});

test("impossible count and rate combinations fail closed", () => {
  const registry = clone(source);
  const metrics = registry.pins[0].metrics;
  metrics.impressions = 0;
  metrics.outbound_clicks = 1;
  assert.throws(() => validateRegistry(registry), /cannot exceed impressions/);

  metrics.impressions = 100;
  metrics.outbound_clicks = 5;
  metrics.outbound_click_rate = 0.2;
  assert.throws(() => validateRegistry(registry), /does not match observed counts/);
});

test("snapshot chronology uses actual instants rather than timestamp text order", () => {
  const registry = clone(source);
  registry.pins[0].analytics_snapshots = [
    { checkpoint_day: 1, observed_at: "2026-09-01T09:00:00+09:00", source: "manual", window: "cumulative", pinterest: { impressions: 1, saves: 0, pin_clicks: 0, outbound_clicks: 0 }, site: null, affiliate: null },
    { checkpoint_day: 1, observed_at: "2026-09-01T01:00:00Z", source: "manual", window: "cumulative", pinterest: { impressions: 1, saves: 0, pin_clicks: 0, outbound_clicks: 0 }, site: null, affiliate: null }
  ];
  assert.doesNotThrow(() => validateRegistry(registry));
  registry.pins[0].analytics_snapshots[1].observed_at = "2026-09-01T00:00:00Z";
  assert.throws(() => validateRegistry(registry), /chronological/);
});

test("published Pin requires both platform evidence and article-log sync", () => {
  const registry = clone(source);
  const log = clone(publicationLog);
  const pin = registry.pins[1];
  assert.equal(pin.pin_id, "pin002");
  pin.publish_status = "published";
  pin.platform_identity = {
    pinterest_pin_id: "fixture-pin-id",
    pin_url: "https://www.pinterest.com/pin/fixture-pin-id/",
    verified_at: "2026-09-01T09:00:00+09:00"
  };
  assert.throws(() => validateReferences(registry, log, boardRegistry), /must be synced/);
  log.records.find((record) => record.slug === pin.article_slug).pinterest_assets.push(pin.pin_id);
  assert.doesNotThrow(() => validateReferences(registry, log, boardRegistry));
});

test("unpublished Pins cannot appear in article publication assets", () => {
  const log = clone(publicationLog);
  log.records.find((record) => record.slug === "kit-vs-beehiiv").pinterest_assets.push("pin002");
  assert.throws(() => validateReferences(source, log, boardRegistry), /unpublished Pin/);
});

test("analytics snapshots are chronological and cumulative", () => {
  const registry = clone(source);
  registry.pins[0].analytics_snapshots = [
    {
      checkpoint_day: 14,
      observed_at: "2026-09-12T09:00:00+09:00",
      source: "manual",
      window: "cumulative",
      pinterest: { impressions: 10, saves: 1, pin_clicks: 1, outbound_clicks: 1 },
      site: null,
      affiliate: null
    },
    {
      checkpoint_day: 30,
      observed_at: "2026-09-28T09:00:00+09:00",
      source: "manual",
      window: "cumulative",
      pinterest: { impressions: 9, saves: 1, pin_clicks: 1, outbound_clicks: 1 },
      site: null,
      affiliate: null
    }
  ];
  assert.throws(() => validateRegistry(registry), /cannot decrease/);
});

test("one measured Pin below the checkpoint still refuses to name a winner", () => {
  const first = reviewRegistry(source);
  const second = reviewRegistry(source);
  assert.deepEqual(first, second);
  assert.equal(first.data_status, "INSUFFICIENT_DATA");
  assert.equal(first.decision, "MEASURE_MORE");
  assert.equal(first.winner_claim, "UNKNOWN");
  assert.equal(first.automatic_stop, false);
  assert.equal(first.published_pins, 1);
  assert.equal(first.measured_pins, 1);
  assert.equal(first.required_checkpoint, 10);
  assert.equal(first.next_allocation, "NO_REALLOCATION_UNTIL_CHECKPOINT");
  // A single small-sample observation must never produce a ranking.
  for (const dimension of Object.values(first.dimensions)) {
    assert.equal(dimension.ranking.status, "INSUFFICIENT_DATA");
    assert.equal(dimension.ranking.leader, null);
  }
});

test("the first pin001 observation is recorded as a small directional sample", () => {
  const pin = source.pins.find((candidate) => candidate.pin_id === "pin001");
  assert.deepEqual(pin.metrics.impressions, 4);
  assert.deepEqual(pin.metrics.pin_clicks, 2);
  assert.deepEqual(pin.metrics.saves, 1);
  assert.deepEqual(pin.metrics.outbound_clicks, 1);
  assert.deepEqual(pin.metrics.profile_visits, 2);
  assert.equal(pin.metrics.save_rate, 1 / 4);
  assert.equal(pin.metrics.outbound_click_rate, 1 / 4);
  assert.equal(pin.metrics.affiliate_clicks, null, "unobserved values stay null, never zero");
  assert.equal(pin.analytics_snapshots.length, 1);
  assert.equal(pin.analytics_snapshots[0].claim_strength, "DIRECTIONAL_SIGNAL_ONLY");
  assert.equal(pin.result.winner_status, "UNKNOWN");
});

test("duplicate Pin IDs and duplicate delivery keys fail closed", () => {
  const registry = clone(source);
  registry.pins.push(clone(registry.pins[0]));
  assert.throws(() => validateRegistry(registry), /duplicate pin_id/);

  const duplicateKeyPin = registry.pins.at(-1);
  duplicateKeyPin.pin_id = "pin999";
  duplicateKeyPin.experiment_id = "CGT-PIN-FIXTURE-999";
  duplicateKeyPin.image_asset = "/pinterest/pins/pin999.png";
  duplicateKeyPin.utm_url = duplicateKeyPin.utm_url.replaceAll("pin001", "pin999");
  assert.throws(() => validateRegistry(registry), /duplicate idempotency key/);
});

test("observed zero remains distinct from unknown null", () => {
  const registry = clone(source);
  const pins = [];
  for (let index = 0; index < 10; index += 1) {
    const pin = clone(registry.pins[0]);
    pin.pin_id = `pin${String(index + 1).padStart(3, "0")}`;
    pin.experiment_id = `fixture-${pin.pin_id}`;
    pin.image_asset = `/pinterest/pins/${pin.pin_id}.png`;
    pin.delivery.idempotency_key = `delivery-${pin.pin_id}`;
    pin.utm_url = pin.utm_url.replace("pin001", pin.pin_id);
    pin.publish_status = "published";
    pin.creative_type = index < 5 ? "comparison" : "checklist";
    pin.hook = index < 5 ? "Compare before choosing" : "Save this checklist";
    pin.metrics.impressions = 100;
    pin.metrics.saves = index < 5 ? 5 : 2;
    pin.metrics.outbound_clicks = 0;
    pin.metrics.save_rate = null;
    pin.metrics.outbound_click_rate = null;
    pin.analytics_snapshots = [];
    pins.push(pin);
  }
  registry.pins = pins;
  const review = reviewRegistry(registry);
  assert.equal(review.data_status, "COMPARABLE");
  assert.equal(review.decision, "MODIFY");

  registry.pins[0].metrics.impressions = null;
  assert.equal(reviewRegistry(registry).decision, "MEASURE_MORE");
});
