import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const WIDTH = 1000;
const HEIGHT = 1500;
const TEMPLATE_ID = "cgt-pin-v2";
const OUTPUT_DIR = "public/pinterest/pins/v2";
const TEMPORARY_DIR = ".tmp-pin-render-v2";

const COLORS = {
  background: "#f7f2ea",
  teal: "#0f6d63",
  navy: "#16213e",
  purple: "#5b3aa0",
  muted: "#586273",
  rule: "#cfc7bd",
  white: "#ffffff"
};

const APPROVED_CHIPS = new Set([
  "Pricing",
  "Automation",
  "Monetization",
  "Growth",
  "Workflow",
  "Creator fit",
  "Free plan"
]);

const PROTOTYPES = [
  {
    pin_id: "pin002-v2",
    template_id: TEMPLATE_ID,
    eyebrow: "COMPARE BEFORE YOU CHOOSE",
    headline: "KIT vs BEEHIIV",
    subhead: "Which platform fits your workflow?",
    chips: ["Pricing", "Automation", "Monetization", "Growth"],
    motif: "split"
  },
  {
    pin_id: "pin003-v2",
    template_id: TEMPLATE_ID,
    eyebrow: "SAVE THIS LIST",
    headline: "7 EMAIL TOOLS FOR CREATORS",
    subhead: "A shortlist before you compare in depth.",
    chips: ["Creator fit", "Workflow", "Free plan", "Automation"],
    motif: "list",
    oversizedNumber: "7"
  },
  {
    pin_id: "pin005-v2",
    template_id: TEMPLATE_ID,
    eyebrow: "START HERE",
    headline: "5 EMAIL TOOLS FOR SOLOPRENEURS",
    subhead: "5 tools worth comparing for a one-person business.",
    chips: ["Workflow", "Pricing", "Automation", "Free plan"],
    motif: "list",
    oversizedNumber: "5"
  }
];

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
    if (word.length > maxCharacters) {
      throw new Error(`headline word exceeds ${maxCharacters} characters: ${word}`);
    }

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

function readPngDimensions(buffer) {
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") {
    throw new Error("invalid PNG");
  }

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

    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolve() : reject(new Error(`browser exited ${code}: ${stderr}`));
    });
  });
}

function validatePrototype(pin) {
  if (pin.template_id !== TEMPLATE_ID) throw new Error(`${pin.pin_id}: unsupported template`);
  if (!pin.pin_id.endsWith("-v2")) throw new Error(`${pin.pin_id}: prototype id must end in -v2`);
  if (pin.chips.length !== 4) throw new Error(`${pin.pin_id}: expected four chips`);

  for (const chip of pin.chips) {
    if (!APPROVED_CHIPS.has(chip)) throw new Error(`${pin.pin_id}: unapproved chip "${chip}"`);
  }
}

function renderEyebrow(pin) {
  // Generous per-character estimate for bold uppercase Arial at this size: measured
  // clipping at 15px/char + 50 padding, so this uses a safer 18px/char + 80 padding.
  const width = Math.max(240, pin.eyebrow.length * 18 + 80);

  return `<g transform="translate(82 92)">
    <rect width="${width}" height="54" rx="27" fill="${COLORS.teal}"/>
    <text x="25" y="36" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${COLORS.white}">${escapeXml(pin.eyebrow)}</text>
  </g>`;
}

// Available headline width is the full content column (canvas minus the 82px side
// margins on both sides): 1000 - 82 - 82 = 836px. Character budgets below are sized
// with a safety margin under real measured Arial-bold-uppercase widths at each font
// size (measured empirically from rendered prototypes, not estimated in the abstract).
function renderHeadline(pin) {
  if (pin.oversizedNumber) {
    const text = pin.headline.replace(`${pin.oversizedNumber} `, "");
    const lines = wrapWords(text, 14);
    if (lines.length > 3) throw new Error(`${pin.pin_id}: headline exceeds three lines`);

    return `<g transform="translate(82 150)">
      <text x="0" y="150" font-family="Arial, sans-serif" font-size="185" font-weight="900" fill="${COLORS.purple}">${escapeXml(pin.oversizedNumber)}</text>
      ${textLines(lines, 0, 235, 92, `font-family="Arial, sans-serif" font-size="78" font-weight="900" fill="${COLORS.navy}"`)}
    </g>`;
  }

  const lines = wrapWords(pin.headline, 10);
  if (lines.length > 3) throw new Error(`${pin.pin_id}: headline exceeds three lines`);

  return `<g transform="translate(82 230)">
    ${textLines(lines, 0, 0, 120, `font-family="Arial, sans-serif" font-size="110" font-weight="900" fill="${COLORS.navy}"`)}
  </g>`;
}

function renderChips(chips) {
  const rows = [
    chips.slice(0, 2),
    chips.slice(2, 4)
  ];

  return `<g transform="translate(82 790)">
    ${rows.map((row, rowIndex) => {
      let x = 0;
      return row.map((chip, chipIndex) => {
        const globalIndex = rowIndex * 2 + chipIndex;
        const width = chip.length * 17 + 46;
        const fill = globalIndex % 2 === 0 ? COLORS.white : COLORS.purple;
        const textFill = globalIndex % 2 === 0 ? COLORS.navy : COLORS.white;
        const fragment = `<rect x="${x}" y="${rowIndex * 78}" width="${width}" height="54" rx="27" fill="${fill}" stroke="${COLORS.teal}" stroke-width="3"/>
        <text x="${x + 23}" y="${rowIndex * 78 + 36}" font-family="Arial, sans-serif" font-size="25" font-weight="800" fill="${textFill}">${escapeXml(chip)}</text>`;
        x += width + 24;
        return fragment;
      }).join("\n");
    }).join("\n")}
  </g>`;
}

function renderSplitMotif() {
  return `<g transform="translate(82 985)">
    <rect x="0" y="0" width="394" height="230" rx="8" fill="${COLORS.white}" stroke="${COLORS.teal}" stroke-width="5"/>
    <rect x="442" y="0" width="394" height="230" rx="8" fill="${COLORS.white}" stroke="${COLORS.purple}" stroke-width="5"/>
    <line x1="418" y1="28" x2="418" y2="202" stroke="${COLORS.rule}" stroke-width="3"/>
    <text x="197" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="${COLORS.teal}">KIT</text>
    <text x="639" y="132" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="900" fill="${COLORS.purple}">BEEHIIV</text>
    <line x1="68" y1="168" x2="326" y2="168" stroke="${COLORS.teal}" stroke-width="8"/>
    <line x1="510" y1="168" x2="768" y2="168" stroke="${COLORS.purple}" stroke-width="8"/>
  </g>`;
}

function renderListMotif(pin) {
  const count = Number(pin.oversizedNumber);
  const barWidth = 836;
  const gap = 18;
  const rowHeight = 28;
  // Non-monotonic widths on purpose: a strictly decreasing sequence reads as a
  // ranking (1st place, 2nd place, ...), which this neutral shortlist must not imply.
  const widthVariants = [barWidth, barWidth - 40, barWidth - 20];

  return `<g transform="translate(82 975)">
    ${Array.from({ length: count }, (_, index) => {
      const y = index * (rowHeight + gap);
      const color = index % 3 === 0 ? COLORS.navy : index % 3 === 1 ? COLORS.teal : COLORS.purple;
      const width = widthVariants[index % widthVariants.length];
      return `<rect x="0" y="${y}" width="${width}" height="${rowHeight}" rx="8" fill="${color}"/>`;
    }).join("\n")}
  </g>`;
}

export function renderPinSvg(pin) {
  validatePrototype(pin);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="${COLORS.background}"/>
    <rect width="${WIDTH}" height="28" fill="${COLORS.teal}"/>
    <rect x="860" y="42" width="58" height="58" rx="8" fill="${COLORS.purple}"/>
    <rect x="888" y="70" width="58" height="58" rx="8" fill="${COLORS.teal}"/>
    ${renderEyebrow(pin)}
    ${renderHeadline(pin)}
    <text x="82" y="705" font-family="Arial, sans-serif" font-size="35" font-weight="600" fill="${COLORS.muted}">${escapeXml(pin.subhead)}</text>
    <line x1="82" y1="752" x2="918" y2="752" stroke="${COLORS.rule}" stroke-width="3"/>
    ${renderChips(pin.chips)}
    ${pin.motif === "split" ? renderSplitMotif() : renderListMotif(pin)}
    <line x1="82" y1="1328" x2="918" y2="1328" stroke="${COLORS.purple}" stroke-width="4"/>
    <text x="82" y="1388" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="${COLORS.navy}">CREATOR GROWTH TOOLS</text>
    <text x="918" y="1388" text-anchor="end" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${COLORS.muted}">${escapeXml(pin.pin_id.toUpperCase())} · V2 PROTOTYPE</text>
  </svg>`;
}

export async function main() {
  const outputDir = path.resolve(OUTPUT_DIR);
  const temporaryDir = path.resolve(TEMPORARY_DIR);
  await mkdir(outputDir, { recursive: true });
  await mkdir(temporaryDir, { recursive: true });

  const browser = await locateChrome();
  const rendered = [];

  try {
    for (const pin of PROTOTYPES) {
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

      rendered.push({
        pin_id: pin.pin_id,
        image_asset: `/pinterest/pins/v2/${pin.pin_id}.png`,
        ...dimensions
      });
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }

  process.stdout.write(`${JSON.stringify({
    template_id: TEMPLATE_ID,
    rendered_count: rendered.length,
    external_calls: 0,
    rendered
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
