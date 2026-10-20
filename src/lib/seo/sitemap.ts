export type SitemapEntry = {
  path: string;
  lastmod?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Build a single sitemap for canonical HTML routes.
 * lastmod comes from content metadata, never from the build timestamp.
 */
export function buildSitemapXml(site: URL | string, entries: readonly SitemapEntry[]): string {
  const base = new URL(site);
  const urls = new Map<string, string | undefined>();

  for (const entry of entries) {
    const url = new URL(entry.path, base);
    if (url.origin !== base.origin || url.search || url.hash) {
      throw new Error("Sitemap URLs must be canonical, same-origin paths: " + entry.path);
    }
    const cleanPath = url.pathname.replace(/\/+$/, "") || "/";
    const canonical = new URL(cleanPath, base).toString();

    let lastmod: string | undefined;
    if (entry.lastmod) {
      const parsed = new Date(entry.lastmod);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid sitemap lastmod for " + entry.path);
      }
      lastmod = parsed.toISOString();
    }

    const previous = urls.get(canonical);
    if (!urls.has(canonical) || (lastmod && (!previous || lastmod > previous))) {
      urls.set(canonical, lastmod);
    }
  }

  const rows = [...urls.entries()]
    .sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([loc, lastmod]) =>
      "  <url><loc>" + escapeXml(loc) + "</loc>" +
      (lastmod ? "<lastmod>" + escapeXml(lastmod) + "</lastmod>" : "") +
      "</url>"
    );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    "</urlset>",
    ""
  ].join("\n");
}
