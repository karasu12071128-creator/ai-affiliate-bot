import { defineCollection, z } from "astro:content";
import { categoryKeys } from "../lib/categories";
import { evidenceGrades } from "../lib/evidence";
import { productKeys } from "../lib/affiliateLinks";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    lastVerifiedDate: z.string(),
    commercial: z.boolean().default(true),
    // Taxonomy. Keys are declared once in src/lib/categories.ts; the default
    // keeps every pre-taxonomy article valid without touching its URL.
    category: z.enum(categoryKeys).default("newsletter-email"),
    // What this article's claims are built on. Defaults to the weaker,
    // truthful grade so an unset field can never overstate our evidence.
    evidence: z.enum(evidenceGrades).default("official-sources"),
    // Optional, and only meaningful for `evidence: hands-on`: what was
    // actually exercised in a real account.
    testedNote: z.string().optional(),
    // Derived from the affiliate registry rather than hardcoded, so a product
    // cannot be named in an article before the registry that decides its link,
    // label, and rel attribute knows about it.
    products: z.array(z.enum(productKeys)).default([]),
    primaryProduct: z.enum(productKeys).optional()
  })
});

export const collections = { articles };
