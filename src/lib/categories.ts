/**
 * Topic taxonomy for Creator Growth Tools.
 *
 * This is the single registry for categories. `src/content/config.ts` derives
 * its `category` enum from `categoryKeys` below, so a category cannot be used
 * in an article's frontmatter unless it is declared here.
 *
 * `state` is an honest status, not a marketing label:
 *   - "live"    — the site publishes in this category today.
 *   - "planned" — declared editorial direction with nothing published yet.
 *
 * A category index page is generated only for categories that actually have
 * articles (see `src/pages/topics/[category].astro`). A planned category is
 * listed on the homepage rail as planned and links nowhere, because shipping
 * an empty index page dressed as coverage is the exact padding an affiliate
 * reviewer is looking for.
 */

export type CategoryState = "live" | "planned";

export type Category = {
  key: string;
  name: string;
  /** Shown on the topic rail and as the category index dek. */
  description: string;
  state: CategoryState;
};

export const categories = [
  {
    key: "newsletter-email",
    name: "Newsletter & email",
    description:
      "Publishing and email marketing platforms for creators who send to a list — the category we currently publish in.",
    state: "live"
  },
  {
    key: "faceless-creation",
    name: "Faceless creation",
    description:
      "Tools for creators who publish without appearing on camera: scripting, voice, stock, editing, and scheduling.",
    state: "planned"
  },
  {
    key: "ai-video",
    name: "AI video",
    description:
      "Generation, editing, and repurposing tools for short-form video production.",
    state: "planned"
  },
  {
    key: "ai-voice",
    name: "AI voice",
    description: "Text-to-speech and voice tooling used in narration and short-form video.",
    state: "planned"
  },
  {
    key: "creator-automation",
    name: "Creator automation",
    description:
      "Workflow and distribution automation for one-person content operations.",
    state: "planned"
  }
] as const satisfies readonly Category[];

export type CategoryKey = (typeof categories)[number]["key"];

export const categoryKeys = categories.map((category) => category.key) as [
  CategoryKey,
  ...CategoryKey[]
];

const byKey = new Map<string, Category>(categories.map((category) => [category.key, category]));

export function getCategory(key: CategoryKey): Category {
  const category = byKey.get(key);
  // Unreachable through the schema, which restricts `category` to these keys.
  // Kept as a fail-closed guard so a future direct call cannot silently render
  // a topic label that does not exist in the registry.
  if (!category) {
    throw new Error(`Unknown category key: ${key}`);
  }
  return category;
}

export function categoryPath(key: CategoryKey): string {
  return `/topics/${key}/`;
}
