import { getCollection } from "astro:content";
import { categories, categoryPath } from "../lib/categories";
import { site } from "../site";

export async function GET() {
  const articles = await getCollection("articles");
  const staticPaths = [
    "/",
    "/articles/",
    "/topics/",
    "/how-we-test/",
    "/about/",
    "/contact/",
    "/affiliate-disclosure/",
    "/editorial-methodology/",
    "/privacy-policy/"
  ];

  // Mirrors getStaticPaths in topics/[category].astro: only categories that
  // actually have articles are built, so only those may appear here.
  const populatedCategories = new Set(articles.map((article) => article.data.category));
  const categoryPaths = categories
    .filter((category) => populatedCategories.has(category.key))
    .map((category) => categoryPath(category.key));

  const articleEntries = articles.map((article) => ({
    path: `/${article.slug}/`,
    lastmod: article.data.updatedDate.toISOString().slice(0, 10)
  }));

  const urls = [
    ...[...staticPaths, ...categoryPaths].map((path) => ({ path, lastmod: null })),
    ...articleEntries
  ]
    .map(({ path, lastmod }) => {
      const loc = `<loc>${new URL(path, site.url).toString()}</loc>`;
      return `<url>${loc}${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`;
    })
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml" }
  });
}
