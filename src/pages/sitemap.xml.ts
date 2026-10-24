import { getTranslatedPaths } from "../lib/i18n/content";
import { localizePath } from "../lib/i18n/index";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { getPostPath } from "../lib/posts/urls";
import { buildSitemapXml, type SitemapEntry } from "../lib/seo/sitemap";

export const prerender = true;

// These are the fixed public HTML routes. Collection routes are added below.
// Keep in sync with the route files; CI compares the result to Astro's sitemap.
const PUBLIC_ROUTES = ["/", "/archives", "/author", "/map", "/papers", "/topics"];

export async function GET(context: APIContext): Promise<Response> {
  const site = context.site ?? new URL("http://localhost:4321/");
  const [posts, papers, topics, concepts] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("papers", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts")
  ]);

  const entries: SitemapEntry[] = [
    ...PUBLIC_ROUTES.map((path) => ({ path })),
    ...posts.flatMap((post) => {
      const path = post.data.canonical ?? getPostPath(post.id);
      // External canonicals are intentionally not indexable under this host.
      return new URL(path, site).origin === site.origin
        ? [{ path, lastmod: post.data.updated ?? post.data.date }]
        : [];
    }),
    ...papers.map((paper) => ({
      path: "/papers/" + paper.id,
      lastmod: paper.data.updated
    })),
    ...topics.map((topic) => ({ path: "/topics/" + topic.id })),
    ...concepts.map((concept) => ({ path: "/concepts/" + concept.id }))
  ];

  const translated = await getTranslatedPaths();
  const bilingualEntries = [...entries, ...entries.filter(entry => translated.has(entry.path)).map(entry => ({...entry, path: localizePath(entry.path, "en")}))];

  return new Response(buildSitemapXml(site, bilingualEntries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
}
