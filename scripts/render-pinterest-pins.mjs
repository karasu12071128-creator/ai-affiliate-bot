import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const WIDTH = 1000;
const HEIGHT = 1500;
const TEMPLATE_ID = "cgt-pin-v1";

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(value, maxCharacters) {
  const words = value.trim().split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function textLines(lines, x, startY, lineHeight, attributes) {
  return lines
    .map((line, index) => `<text x="${x}" y="${startY + index * lineHeight}" ${attributes}>${escapeXml(line)}</text>`)
    .join("\n");
}

export function renderPinSvg(pin) {
  if (pin.template_id !== TEMPLATE_ID) throw new Error(`${pin.pin_id}: unsupported template`);
  const visual = pin.visual_copy;
  if (!visual?.eyebrow || !visual?.headline || !visual?.supporting) throw new Error(`${pin.pin_id}: visual_copy is incomplete`);
  const headline = wrapWords(visual.headline, 18);
  const supporting = wrapWords(visual.supporting, 37);
  if (headline.length > 4) throw new Error(`${pin.pin_id}: headline exceeds four lines`);
  if (supporting.length > 4) throw new Error(`${pin.pin_id}: supporting copy exceeds four lines`);

  const isChecklist = pin.creative_type === "checklist";
  const accent = isChecklist ? "#167d6b" : "#3357c7";
  const checklistItems = visual.checklist_items ?? ["Audience fit", "Workflow", "Cost and effort", "Room to grow"];
  const comparisonCards = visual.comparison_cards ?? [
    { label: "OPTION A", detail: "Fit your actual workflow" },
    { label: "OPTION B", detail: "Use evidence, not hype" }
  ];
  if (isChecklist && checklistItems.length !== 4) throw new Error(`${pin.pin_id}: checklist requires four items`);
  if (!isChecklist && comparisonCards.length !== 2) throw new Error(`${pin.pin_id}: comparison requires two cards`);
  const motif = isChecklist
    ? `<g transform="translate(90 970)">
        ${checklistItems.map((item, index) => `
          <rect x="0" y="${index * 92}" width="820" height="68" rx="4" fill="#ffffff" stroke="#d8ddd8"/>
          <rect x="20" y="${index * 92 + 18}" width="32" height="32" rx="3" fill="none" stroke="${accent}" stroke-width="5"/>
          <text x="74" y="${index * 92 + 47}" font-family="Arial, sans-serif" font-size="31" font-weight="700" fill="#202427">${escapeXml(item)}</text>`).join("")}
      </g>`
    : `<g transform="translate(90 1000)">
        <rect width="390" height="210" rx="6" fill="#ffffff" stroke="#d8ddd8"/>
        <rect x="430" width="390" height="210" rx="6" fill="#ffffff" stroke="#d8ddd8"/>
        <text x="32" y="63" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="${accent}">COMPARE</text>
        <text x="462" y="63" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="${accent}">COMPARE</text>
        <text x="32" y="125" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#202427">${escapeXml(comparisonCards[0].label)}</text>
        <text x="462" y="125" font-family="Arial, sans-serif" font-size="34" font-weight="800" fill="#202427">${escapeXml(comparisonCards[1].label)}</text>
        <text x="32" y="168" font-family="Arial, sans-serif" font-size="23" fill="#56606a">${escapeXml(comparisonCards[0].detail)}</text>
        <text x="462" y="168" font-family="Arial, sans-serif" font-size="23" fill="#56606a">${escapeXml(comparisonCards[1].detail)}</text>
      </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="1000" height="1500" fill="#f4f5f0"/>
    <rect width="1000" height="32" fill="${accent}"/>
    <rect x="68" y="96" width="864" height="1308" rx="8" fill="#eef0ea" stroke="#d8ddd8" stroke-width="2"/>
    <circle cx="845" cy="175" r="46" fill="#ec6b57"/>
    <rect x="90" y="145" width="610" height="54" rx="4" fill="${accent}"/>
    <text x="118" y="182" font-family="Arial, sans-serif" font-size="24" font-weight="800" fill="#ffffff">${escapeXml(visual.eyebrow)}</text>
    ${textLines(headline, 90, 370, 105, 'font-family="Arial, sans-serif" font-size="88" font-weight="800" fill="#171a1d"')}
    ${textLines(supporting, 92, 820, 55, 'font-family="Arial, sans-serif" font-size="39" font-weight="500" fill="#46505a"')}
    ${motif}
    <line x1="90" y1="1330" x2="910" y2="1330" stroke="#c8cec7" stroke-width="2"/>
    <text x="90" y="1382" font-family="Arial, sans-serif" font-size="26" font-weight="800" fill="#202427">CREATOR GROWTH TOOLS</text>
    <text x="910" y="1382" text-anchor="end" font-family="Arial, sans-serif" font-size="23" fill="#667078">${escapeXml(pin.pin_id.toUpperCase())}</text>
  </svg>`;
}

export function readPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") throw new Error("invalid PNG");
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function locateChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {}
  }
  throw new Error("Chrome or Edge was not found; set CHROME_PATH");
}

function runBrowser(executable, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: ["ignore", "ignore", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`browser exited ${code}: ${stderr}`)));
  });
}

export async function main() {
  const registry = JSON.parse(await readFile("data/pinterest-pin-experiments.json", "utf8"));
  const outputDir = path.resolve("public/pinterest/pins");
  const temporaryDir = path.resolve(".tmp-pin-render");
  await mkdir(outputDir, { recursive: true });
  await mkdir(temporaryDir, { recursive: true });
  const browser = await locateChrome();
  const rendered = [];

  try {
    for (const pin of registry.pins) {
      const svgPath = path.join(temporaryDir, `${pin.pin_id}.svg`);
      const pngPath = path.join(outputDir, `${pin.pin_id}.png`);
      await writeFile(svgPath, renderPinSvg(pin), "utf8");
      await runBrowser(browser, [
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        `--window-size=${WIDTH},${HEIGHT}`,
        `--screenshot=${pngPath}`,
        pathToFileURL(svgPath).href
      ]);
      const dimensions = readPngDimensions(await readFile(pngPath));
      if (dimensions.width !== WIDTH || dimensions.height !== HEIGHT) {
        throw new Error(`${pin.pin_id}: expected ${WIDTH}x${HEIGHT}, got ${dimensions.width}x${dimensions.height}`);
      }
      rendered.push({ pin_id: pin.pin_id, image_asset: pin.image_asset, ...dimensions });
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }

  process.stdout.write(`${JSON.stringify({ template_id: TEMPLATE_ID, rendered_count: rendered.length, external_calls: 0, rendered }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();
