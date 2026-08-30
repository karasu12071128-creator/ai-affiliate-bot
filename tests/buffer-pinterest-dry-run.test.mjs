import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildBufferDraftRequest, executeBufferPlan } from "../automation/buffer-pinterest/buffer-adapter.mjs";

const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));

function approvedPin() {
  const pin = structuredClone(registry.pins[0]);
  pin.approval.status = "approved";
  return pin;
}

function requestFor(pin) {
  return buildBufferDraftRequest({
    pin,
    channelId: "fixture-channel",
    boardServiceId: "fixture-board",
    publicImageUrl: "https://example.invalid/pin001.png",
    dueAt: "2026-09-01T03:00:00Z"
  });
}

test("request body is deterministic and creates a Buffer draft only", () => {
  const pin = approvedPin();
  const first = requestFor(pin);
  const second = requestFor(pin);
  assert.deepEqual(first, second);
  assert.equal(first.body.variables.input.saveToDraft, true);
  assert.equal(first.body.variables.input.metadata.pinterest.url, pin.utm_url);
  assert.equal(first.secret_name, "BUFFER_API_KEY");
});

test("current Pin approval blocks every provider call", async () => {
  const pin = structuredClone(registry.pins[0]);
  let calls = 0;
  const result = await executeBufferPlan({
    pin,
    request: requestFor({ ...pin, approval: { status: "approved" } }),
    provider: { async createDraft() { calls += 1; } }
  });
  assert.equal(result.status, "BLOCKED_NOT_AUTHORIZED");
  assert.equal(calls, 0);
});

test("dry run previews the approved request without network access", async () => {
  const pin = approvedPin();
  let calls = 0;
  const result = await executeBufferPlan({
    pin,
    request: requestFor(pin),
    provider: { async createDraft() { calls += 1; } }
  });
  assert.equal(result.status, "DRY_RUN_OK");
  assert.equal(result.provider_calls, 0);
  assert.equal(calls, 0);
  assert.equal(result.business_success_assumed, false);
});

test("duplicate receipt blocks a second call", async () => {
  const pin = approvedPin();
  const request = requestFor(pin);
  const result = await executeBufferPlan({
    pin,
    request,
    externalWriteAuthorized: true,
    liveConfirmation: "OWNER_APPROVED_BUFFER_DRAFT",
    priorReceipts: new Set([request.idempotency_key]),
    provider: { async createDraft() { throw new Error("must not run"); } }
  });
  assert.equal(result.status, "BLOCKED_DUPLICATE");
  assert.equal(result.provider_calls, 0);
});

test("ambiguous external failure is recorded once without retry", async () => {
  const pin = approvedPin();
  let calls = 0;
  const result = await executeBufferPlan({
    pin,
    request: requestFor(pin),
    externalWriteAuthorized: true,
    liveConfirmation: "OWNER_APPROVED_BUFFER_DRAFT",
    provider: { async createDraft() { calls += 1; throw new Error("timeout"); } }
  });
  assert.equal(result.status, "AMBIGUOUS_EXTERNAL_RESULT");
  assert.equal(result.provider_calls, 1);
  assert.equal(result.automatic_retry, false);
  assert.equal(calls, 1);
});
