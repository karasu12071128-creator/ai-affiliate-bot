import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { buildBufferDraftRequest, executeBufferPlan } from "../automation/buffer-pinterest/buffer-adapter.mjs";

function parseArgs(argv) {
  const args = { pinId: "pin001", dueAt: null, imageUrl: null, channelId: null, boardServiceId: null };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index + 1];
    if (argv[index] === "--pin") args.pinId = value;
    else if (argv[index] === "--due-at") args.dueAt = value;
    else if (argv[index] === "--image-url") args.imageUrl = value;
    else if (argv[index] === "--channel-id") args.channelId = value;
    else if (argv[index] === "--board-service-id") args.boardServiceId = value;
  }
  return args;
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));
  const pin = registry.pins.find((candidate) => candidate.pin_id === args.pinId);
  if (!pin) throw new Error(`unknown pin: ${args.pinId}`);

  if (!args.imageUrl || !args.channelId || !args.boardServiceId || !args.dueAt) {
    const missing = [
      !args.imageUrl && "PUBLIC_STABLE_IMAGE_URL",
      !args.channelId && "BUFFER_PINTEREST_CHANNEL_ID",
      !args.boardServiceId && "BUFFER_PINTEREST_BOARD_SERVICE_ID",
      !args.dueAt && "OWNER_APPROVED_DUE_AT"
    ].filter(Boolean);
    const result = {
      status: "BLOCKED_CONFIGURATION_INCOMPLETE",
      pin_id: pin.pin_id,
      missing,
      secret_required_later: "BUFFER_API_KEY",
      external_write_attempted: false,
      automatic_retry: false
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return result;
  }

  const request = buildBufferDraftRequest({
    pin,
    channelId: args.channelId,
    boardServiceId: args.boardServiceId,
    publicImageUrl: args.imageUrl,
    dueAt: args.dueAt
  });
  const result = await executeBufferPlan({ pin, request });
  process.stdout.write(`${JSON.stringify({ ...result, request_preview: request }, null, 2)}\n`);
  return result;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
