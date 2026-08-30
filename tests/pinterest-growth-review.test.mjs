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
  assert.deepEqual(validateRegistry(source), { valid: true, pin_count: 1 });
  assert.deepEqual(validateReferences(source, publicationLog, boardRegistry), { valid: true, article_count: 5, board_count: 5 });
  assert.equal(source.delivery_contract.external_write_authorized, false);
  assert.equal(source.delivery_contract.automatic_retry, false);
  assert.equal(source.pins[0].approval.status, "not_authorized");
});

test("unpublished Pins cannot appear in article publication assets", () => {
  const log = clone(publicationLog);
  log.records.find((record) => record.slug === "kit-vs-beehiiv").pinterest_assets.push("pin001");
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

test("current unpublished Pin returns deterministic insufficient-data review", () => {
  const first = reviewRegistry(source);
  const second = reviewRegistry(source);
  assert.deepEqual(first, second);
  assert.equal(first.data_status, "INSUFFICIENT_DATA");
  assert.equal(first.decision, "MEASURE_MORE");
  assert.equal(first.winner_claim, "UNKNOWN");
  assert.equal(first.automatic_stop, false);
});

test("duplicate Pin IDs and duplicate delivery keys fail closed", () => {
  const registry = clone(source);
  registry.pins.push(clone(registry.pins[0]));
  assert.throws(() => validateRegistry(registry), /duplicate pin_id/);

  registry.pins[1].pin_id = "pin002";
  registry.pins[1].utm_url = registry.pins[1].utm_url.replace("pin001", "pin002");
  assert.throws(() => validateRegistry(registry), /duplicate idempotency key/);
});

test("observed zero remains distinct from unknown null", () => {
  const registry = clone(source);
  const pins = [];
  for (let index = 0; index < 10; index += 1) {
    const pin = clone(registry.pins[0]);
    pin.pin_id = `pin${String(index + 1).padStart(3, "0")}`;
    pin.delivery.idempotency_key = `delivery-${pin.pin_id}`;
    pin.utm_url = pin.utm_url.replace("pin001", pin.pin_id);
    pin.publish_status = "published";
    pin.creative_type = index < 5 ? "comparison" : "checklist";
    pin.hook = index < 5 ? "Compare before choosing" : "Save this checklist";
    pin.metrics.impressions = 100;
    pin.metrics.saves = index < 5 ? 5 : 2;
    pin.metrics.outbound_clicks = 0;
    pins.push(pin);
  }
  registry.pins = pins;
  const review = reviewRegistry(registry);
  assert.equal(review.data_status, "COMPARABLE");
  assert.equal(review.decision, "MODIFY");

  registry.pins[0].metrics.impressions = null;
  assert.equal(reviewRegistry(registry).decision, "MEASURE_MORE");
});
