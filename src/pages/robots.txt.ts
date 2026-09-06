import type { APIRoute } from "astro";

export const prerender = true;

export const GET: APIRoute = (context) => {
  const site = context.site ?? new URL("http://localhost:4321/");
  const sitemapUrl = new URL("sitemap-index.xml", site).toString();

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Internal data endpoint — not meant for SERP indexing.",
    "Disallow: /search-index.json",
    "",
    "# Raw .md mirrors (/design.md, /posts/<slug>.md) stay crawlable so the",
    "# X-Robots-Tag: noindex header (vercel.json) is actually seen and applied.",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
