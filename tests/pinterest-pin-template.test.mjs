import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { readPngDimensions, renderPinSvg } from "../scripts/render-pinterest-pins.mjs";

const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));

test("initial batch is five articles by two creative types", () => {
  assert.equal(registry.pins.length, 10);
  const byArticle = new Map();
  for (const pin of registry.pins) {
    const types = byArticle.get(pin.article_slug) ?? [];
    types.push(pin.creative_type);
    byArticle.set(pin.article_slug, types);
  }
  assert.equal(byArticle.size, 5);
  for (const types of byArticle.values()) assert.deepEqual(types.sort(), ["checklist", "comparison"]);
});

test("single template renders deterministic 1000x1500 SVG source", () => {
  for (const pin of registry.pins) {
    const first = renderPinSvg(pin);
    const second = renderPinSvg(pin);
    assert.equal(first, second);
    assert.match(first, /width="1000" height="1500"/);
    assert.doesNotMatch(first, /undefined|null/);
  }
});

test("PNG header reader rejects malformed input and reads exact dimensions", () => {
  assert.throws(() => readPngDimensions(Buffer.from("not-png")), /invalid PNG/);
  const fixture = Buffer.alloc(24);
  fixture.write("PNG", 1, "ascii");
  fixture.writeUInt32BE(1000, 16);
  fixture.writeUInt32BE(1500, 20);
  assert.deepEqual(readPngDimensions(fixture), { width: 1000, height: 1500 });
});

test("all ten local Pin assets exist at the registry path with exact dimensions", async () => {
  for (const pin of registry.pins) {
    const buffer = await readFile(`public${pin.image_asset}`);
    assert.deepEqual(readPngDimensions(buffer), { width: 1000, height: 1500 });
  }
});
