import { readFile } from "node:fs/promises";

/**
 * Only use explicit article metadata. Rebuilding the site is not a modification
 * event, and assigning build time to every page would send false freshness signals.
 */
export function parseFrontmatterLastmod(markdown, kind) {
  const frontmatter = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
  if (!frontmatter) return undefined;

  const fieldNames = kind === "papers"
    ? ["updated", "publicationDate"]
    : ["updated", "date"];
  const dates = fieldNames.flatMap((key) => {
    const line = frontmatter.match(new RegExp("^" + key + ":\\s*(.+)$", "m"))?.[1]?.trim();
    if (!line) return [];
    const value = line.replace(/\s+#.*$/, "").replace(/^['"]|['"]$/g, "");
    const date = new Date(value);
    return Number.isFinite(date.valueOf()) ? [date] : [];
  });

  if (!dates.length) return undefined;
  return new Date(Math.max(...dates.map((date) => date.valueOf()))).toISOString();
}

/**
 * @astrojs/sitemap supplies canonical route URLs; post/paper dates come from
 * their own frontmatter rather than file modification time or build time.
 */
export async function enrichSitemapEntry(item) {
  const url = new URL(item.url);
  const normalized = { ...item, url: url.pathname === "/" ? url.origin + "/" : item.url };
  const route = /^\/(posts|papers)\/([a-zA-Z0-9_-]+)$/.exec(url.pathname);
  if (!route) return normalized;

  const [, collection, slug] = route;
  const source = new URL("../../src/content/" + collection + "/" + slug + ".md", import.meta.url);
  try {
    const markdown = await readFile(source, "utf8");
    const lastmod = parseFrontmatterLastmod(markdown, collection);
    if (lastmod) normalized.lastmod = lastmod;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    // Only publish confirmed dates; a missing source may be an alternate route.
  }
  return normalized;
}
