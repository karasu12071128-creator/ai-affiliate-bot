import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { EXPECTED_HEIGHT, EXPECTED_WIDTH, buildPublishPackage, main } from "../scripts/pinterest-publish-package.mjs";

const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));

function pin(id) {
  return structuredClone(registry.pins.find((candidate) => candidate.pin_id === id));
}

const goodImage = { file: "public/pinterest/pins/pin002.png", exists: true, bytes: 1, width: EXPECTED_WIDTH, height: EXPECTED_HEIGHT, dimensions_ok: true };

test("the publish package script performs no external action", async () => {
  const source = await readFile(
    fileURLToPath(new URL("../scripts/pinterest-publish-package.mjs", import.meta.url)),
    "utf8",
  );
  for (const forbidden of ["fetch(", "https://api", "PINTEREST_APP", "access_token", "node:https"]) {
    assert.ok(!source.includes(forbidden), `must not reference ${forbidden}`);
  }
});

test("pin002 is ready for a manual publish with no blockers", async () => {
  const packet = await main(["--pin", "pin002", "--quiet"]);
  assert.equal(packet.pin_id, "pin002");
  assert.equal(packet.publish_status, "draft");
  assert.deepEqual(packet.blockers, []);
  assert.equal(packet.image_check.dimensions_ok, true);
  assert.equal(packet.image_check.width, EXPECTED_WIDTH);
  assert.equal(packet.image_check.height, EXPECTED_HEIGHT);
  assert.equal(packet.link_check.parameter_count, 4);
  assert.equal(packet.link_check.utm_content, "pin002");
  assert.equal(packet.link_check.utm_campaign, "kit-vs-beehiiv");
  assert.equal(packet.external_actions.pinterest_api_call, false);
  assert.equal(packet.external_actions.credential_used, false);
});

test("Pinterest field limits are respected", async () => {
  const packet = await main(["--pin", "pin002", "--quiet"]);
  assert.ok(packet.owner_paste_fields.title_length > 0 && packet.owner_paste_fields.title_length <= 100);
  assert.ok(packet.owner_paste_fields.description_length > 0 && packet.owner_paste_fields.description_length <= 500);
});

test("an already published Pin is reported as a blocker instead of being re-offered", () => {
  const packet = buildPublishPackage(pin("pin001"), goodImage);
  assert.ok(packet.blockers.includes("already-published"));
});

test("an approval scoped to something other than a manual publish is a blocker", () => {
  const candidate = pin("pin002");
  candidate.approval = { status: "approved", scope: "buffer_draft" };
  assert.ok(buildPublishPackage(candidate, goodImage).blockers.includes("approval-scope-not-manual:buffer_draft"));

  const enabledDelivery = pin("pin002");
  enabledDelivery.delivery.mode = "buffer_draft_authorized";
  assert.ok(buildPublishPackage(enabledDelivery, goodImage).blockers.includes("delivery-mode-not-disabled"));
});

test("an unknown Pin fails loudly", async () => {
  await assert.rejects(() => main(["--pin", "pin999", "--quiet"]), /unknown pin: pin999/);
});
