import { getCollection } from "astro:content";
import { site } from "../site";

export async function GET() {
  const articles = await getCollection("articles");
  const staticPaths = ["/", "/articles/", "/about/", "/affiliate-disclosure/", "/editorial-methodology/", "/privacy-policy/"];
  const articlePaths = articles.map((article) => `/${article.slug}/`);
  const urls = [...staticPaths, ...articlePaths]
    .map((path) => `<url><loc>${new URL(path, site.url).toString()}</loc></url>`)
    .join("");

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: { "Content-Type": "application/xml" }
  });
}
