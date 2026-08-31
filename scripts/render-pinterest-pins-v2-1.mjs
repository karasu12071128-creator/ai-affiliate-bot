import { spawn } from "node:child_process";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const WIDTH = 1000;
const HEIGHT = 1500;
const TEMPLATE_ID = "cgt-pin-v2";
const OUTPUT_DIR = "public/pinterest/pins/v2_1";
const TEMPORARY_DIR = ".tmp-pin-render-v2-1";

const COLORS = {
  background: "#f7f2ea",
  teal: "#0f6d63",
  navy: "#16213e",
  purple: "#5b3aa0",
  muted: "#586273",
  rule: "#cfc7bd",
  white: "#ffffff"
};

const PROTOTYPES = [
  {
    pin_id: "pin002-v2.1",
    template_id: TEMPLATE_ID,
    eyebrow: "COMPARE BEFORE YOU CHOOSE",
    headline: "KIT vs BEEHIIV",
    subhead: "Which platform fits your workflow?",
    motif: "comparison",
    comparison: [
      {
        product: "KIT",
        accent: COLORS.teal,
        rows: [
          { label: "BEST FOR", value: "Creator businesses", weight: "800", size: 22 },
          { label: "FREE PLAN", value: "Up to 10,000 subscribers", note: "Limited automations", weight: "500", size: 20 }
        ]
      },
      {
        product: "BEEHIIV",
        accent: COLORS.purple,
        rows: [
          { label: "BEST FOR", value: "Newsletter businesses", weight: "800", size: 22 },
          { label: "FREE PLAN", value: "Up to 2,500 subscribers", note: "Unlimited sends", weight: "500", size: 20 }
        ]
      }
    ],
    layout: {
      headlineY: 226,
      subheadY: 512,
      ruleY: 562,
      motifY: 650
    }
  },
  {
    pin_id: "pin003-v2.1",
    template_id: TEMPLATE_ID,
    eyebrow: "SAVE THIS LIST",
    headline: "7 EMAIL TOOLS FOR CREATORS",
    subhead: "A shortlist before you compare in depth.",
    motif: "product-list",
    oversizedNumber: "7",
    rows: [
      { product: "KIT", descriptor: "Creator funnels" },
      { product: "BEEHIIV", descriptor: "Newsletter growth" },
      { product: "ACTIVECAMPAIGN", descriptor: "Advanced automation" },
      { product: "MAILERLITE", descriptor: "Budget-friendly" },
      { product: "FLODESK", descriptor: "Visual brands" },
      { product: "SUBSTACK", descriptor: "Simple publishing" },
      { product: "GHOST", descriptor: "Full ownership" }
    ],
    layout: {
      subheadY: 600,
      ruleY: 650,
      motifY: 728
    }
  },
  {
    pin_id: "pin005-v2.1",
    template_id: TEMPLATE_ID,
    eyebrow: "START HERE",
    headline: "5 EMAIL TOOLS FOR SOLOPRENEURS",
    subhead: "5 tools worth comparing for a one-person business.",
    motif: "product-list",
    oversizedNumber: "5",
    rows: [
      { product: "KIT", descriptor: "Creator funnels" },
      { product: "ACTIVECAMPAIGN", descriptor: "Lead pipelines" },
      { product: "BEEHIIV", descriptor: "Newsletter business" },
      { product: "MAILERLITE", descriptor: "Budget-friendly" },
      { product: "FLODESK", descriptor: "Visual brands" }
    ],
    layout: {
      subheadY: 682,
      ruleY: 732,
      motifY: 812
    }
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
      throw new Error(`word exceeds ${maxCharacters} characters: ${word}`);
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
  if (!pin.pin_id.endsWith("-v2.1")) throw new Error(`${pin.pin_id}: prototype id must end in -v2.1`);

  if (pin.motif === "comparison") {
    if (pin.comparison.length !== 2) throw new Error(`${pin.pin_id}: expected two comparison cards`);
    return;
  }

  if (pin.motif === "product-list") {
    if (String(pin.rows.length) !== pin.oversizedNumber) {
      throw new Error(`${pin.pin_id}: row count does not match oversized number`);
    }
    return;
  }

  throw new Error(`${pin.pin_id}: unsupported motif "${pin.motif}"`);
}

function renderEyebrow(pin) {
  const width = Math.max(240, pin.eyebrow.length * 18 + 80);

  return `<g transform="translate(82 92)">
    <rect width="${width}" height="54" rx="27" fill="${COLORS.teal}"/>
    <text x="25" y="36" font-family="Arial, sans-serif" font-size="22" font-weight="800" fill="${COLORS.white}">${escapeXml(pin.eyebrow)}</text>
  </g>`;
}

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

  return `<g transform="translate(82 ${pin.layout.headlineY})">
    ${textLines(lines, 0, 0, 120, `font-family="Arial, sans-serif" font-size="110" font-weight="900" fill="${COLORS.navy}"`)}
  </g>`;
}

function renderCardValue(value, x, y, fontSize, fontWeight) {
  const lines = wrapWords(value, 26);
  return textLines(
    lines,
    x,
    y,
    fontSize + 8,
    `font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${fontWeight}" fill="${COLORS.navy}"`
  );
}

function renderComparisonCard(card, x) {
  return `<g transform="translate(${x} 0)">
    <rect x="0" y="0" width="394" height="560" rx="8" fill="${COLORS.white}" stroke="${card.accent}" stroke-width="5"/>
    <text x="197" y="82" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="900" fill="${card.accent}">${escapeXml(card.product)}</text>
    <line x1="48" y1="118" x2="346" y2="118" stroke="${card.accent}" stroke-width="8"/>
    <text x="22" y="174" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="${COLORS.muted}">${escapeXml(card.rows[0].label)}</text>
    ${renderCardValue(card.rows[0].value, 22, 210, card.rows[0].size, card.rows[0].weight)}
    <line x1="22" y1="268" x2="372" y2="268" stroke="${COLORS.rule}" stroke-width="2"/>
    <text x="22" y="326" font-family="Arial, sans-serif" font-size="16" font-weight="900" fill="${COLORS.muted}">${escapeXml(card.rows[1].label)}</text>
    ${renderCardValue(card.rows[1].value, 22, 360, card.rows[1].size, card.rows[1].weight)}
    ${card.rows[1].note ? `<text x="22" y="396" font-family="Arial, sans-serif" font-size="18" font-weight="500" font-style="italic" fill="${COLORS.muted}">${escapeXml(card.rows[1].note)}</text>` : ""}
  </g>`;
}

function renderComparisonMotif(pin) {
  return `<g transform="translate(82 ${pin.layout.motifY})">
    ${renderComparisonCard(pin.comparison[0], 0)}
    <line x1="418" y1="42" x2="418" y2="518" stroke="${COLORS.rule}" stroke-width="3"/>
    ${renderComparisonCard(pin.comparison[1], 442)}
  </g>`;
}

function renderProductRows(pin) {
  const markerColors = [COLORS.navy, COLORS.teal, COLORS.purple];
  const rowPitch = 66;

  return `<g transform="translate(82 ${pin.layout.motifY})">
    ${pin.rows.map((row, index) => {
      const y = index * rowPitch;
      const markerColor = markerColors[index % markerColors.length];

      return `<g transform="translate(0 ${y})">
        <rect x="0" y="12" width="18" height="18" rx="4" fill="${markerColor}"/>
        <text x="38" y="35" font-family="Arial, sans-serif" font-size="29" font-weight="900" fill="${COLORS.navy}">
          <tspan>${escapeXml(row.product)}</tspan><tspan fill="${COLORS.muted}" font-size="25" font-weight="500"> — ${escapeXml(row.descriptor)}</tspan>
        </text>
      </g>`;
    }).join("\n")}
  </g>`;
}

function renderMotif(pin) {
  if (pin.motif === "comparison") return renderComparisonMotif(pin);
  return renderProductRows(pin);
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
    <text x="82" y="${pin.layout.subheadY}" font-family="Arial, sans-serif" font-size="35" font-weight="600" fill="${COLORS.muted}">${escapeXml(pin.subhead)}</text>
    <line x1="82" y1="${pin.layout.ruleY}" x2="918" y2="${pin.layout.ruleY}" stroke="${COLORS.rule}" stroke-width="3"/>
    ${renderMotif(pin)}
    <line x1="82" y1="1328" x2="918" y2="1328" stroke="${COLORS.purple}" stroke-width="4"/>
    <text x="82" y="1388" font-family="Arial, sans-serif" font-size="27" font-weight="900" fill="${COLORS.navy}">CREATOR GROWTH TOOLS</text>
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
        image_asset: `/pinterest/pins/v2_1/${pin.pin_id}.png`,
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
