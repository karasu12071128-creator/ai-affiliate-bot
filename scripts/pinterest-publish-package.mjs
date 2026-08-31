// Render a manual Pinterest publish package for one Pin.
//
// This script never publishes. It reads the registry, re-runs the same validation the
// growth review uses, checks the local image asset, and prints the exact fields the OWNER
// pastes into the Pinterest UI. There is no network access and no credential of any kind.

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { validateReferences, validateRegistry } from "./pinterest-growth-review.mjs";
import { readPngDimensions } from "./render-pinterest-pins.mjs";

export const EXPECTED_WIDTH = 1000;
export const EXPECTED_HEIGHT = 1500;

function blockers(pin) {
  const list = [];
  if (pin.publish_status === "published") list.push("already-published");
  if (pin.approval?.status === "approved" && pin.approval?.scope !== "manual_pinterest_publish") {
    list.push(`approval-scope-not-manual:${pin.approval?.scope ?? "none"}`);
  }
  if (pin.delivery?.mode !== "disabled") list.push("delivery-mode-not-disabled");
  return list;
}

export function buildPublishPackage(pin, imageCheck) {
  const utm = new URL(pin.utm_url);
  return {
    schema_version: 1,
    pin_id: pin.pin_id,
    experiment_id: pin.experiment_id,
    main_hypothesis: pin.main_hypothesis,
    creative_type: pin.creative_type,
    hook: pin.hook,
    publish_status: pin.publish_status,
    approval_status: pin.approval?.status ?? "not_authorized",
    owner_paste_fields: {
      board: pin.board,
      title: pin.title,
      title_length: pin.title.length,
      description: pin.description,
      description_length: pin.description.length,
      destination_link: pin.utm_url,
      image_file: `public${pin.image_asset}`,
    },
    link_check: {
      origin: utm.origin,
      path: utm.pathname,
      utm_source: utm.searchParams.get("utm_source"),
      utm_medium: utm.searchParams.get("utm_medium"),
      utm_campaign: utm.searchParams.get("utm_campaign"),
      utm_content: utm.searchParams.get("utm_content"),
      parameter_count: [...utm.searchParams.keys()].length,
    },
    image_check: imageCheck,
    blockers: blockers(pin),
    external_actions: {
      pinterest_api_call: false,
      buffer_write: false,
      credential_used: false,
    },
    after_publish_instructions: [
      "Copy the Pin URL from Pinterest and report it.",
      "Record publish_status=published and platform_identity.pin_url.",
      "Keep pinterest_pin_id null with id_status=SHORTLINK_ONLY_NOT_RESOLVED until the numeric ID is actually observed.",
      "Keep published_at null with published_at_status=EXACT_TIME_NOT_OBSERVED unless the exact time is recorded.",
      "Add the pin_id to the matching article-publication-log record.",
      "Re-run npm run growth:review and record the new published count.",
    ],
  };
}

async function checkImage(imageAsset) {
  const file = path.join("public", imageAsset.replace(/^\//u, ""));
  try {
    const info = await stat(file);
    const size = readPngDimensions(await readFile(file));
    return {
      file,
      exists: true,
      bytes: info.size,
      width: size.width,
      height: size.height,
      dimensions_ok: size.width === EXPECTED_WIDTH && size.height === EXPECTED_HEIGHT,
    };
  } catch (error) {
    return { file, exists: false, error: error.code ?? "unknown", dimensions_ok: false };
  }
}

export async function main(argv = process.argv.slice(2)) {
  const pinId = argv.includes("--pin") ? argv[argv.indexOf("--pin") + 1] : "pin002";
  const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));
  const publicationLog = JSON.parse(await readFile("data/article-publication-log.json", "utf8"));
  const boardRegistry = JSON.parse(await readFile("data/pinterest-boards.json", "utf8"));

  validateRegistry(registry);
  validateReferences(registry, publicationLog, boardRegistry);

  const pin = registry.pins.find((candidate) => candidate.pin_id === pinId);
  if (!pin) throw new Error(`unknown pin: ${pinId}`);

  const packet = buildPublishPackage(pin, await checkImage(pin.image_asset));
  if (!argv.includes("--quiet")) process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  return packet;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
