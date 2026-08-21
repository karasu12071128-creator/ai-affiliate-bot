import { defineCollection, z } from "astro:content";

const articles = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date(),
    lastVerifiedDate: z.string(),
    commercial: z.boolean().default(true),
    products: z.array(z.enum(["kit", "beehiiv", "activecampaign", "hubspot"])).default([]),
    primaryProduct: z.enum(["kit", "beehiiv", "activecampaign", "hubspot"]).optional()
  })
});

export const collections = { articles };
