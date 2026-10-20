export const SITE_ORIGIN = "https://a-znk.com";

export function canonicalizeUrl(value) {
  try {
    const url = new URL(value);
    if (url.origin !== SITE_ORIGIN || url.search || url.hash) return undefined;
    return url.origin + (url.pathname === "/" ? "/" : url.pathname.replace(/\/$/, ""));
  } catch {
    return undefined;
  }
}

export function sitemapUrls(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => canonicalizeUrl(match[1].replace(/&amp;/g, "&")))
    .filter(Boolean)
    .filter((url, index, array) => array.indexOf(url) === index);
}

export function selectUrlsForChanges(changedFiles, liveUrls, forceAll = false) {
  const live = new Set(liveUrls.map(canonicalizeUrl).filter(Boolean));
  if (forceAll) return [...live].sort();
  const selected = new Set();
  let globalChange = false;

  for (const input of changedFiles) {
    const file = input.replace(/\\/g, "/").replace(/^\.\//, "");
    const match = /^src\/content\/(posts|papers|topics|concepts)\/([a-zA-Z0-9_-]+)\.md$/.exec(file);
    if (match) {
      const candidate = SITE_ORIGIN + "/" + match[1] + "/" + match[2];
      if (live.has(candidate)) selected.add(candidate);
      continue;
    }

    // Cross-cutting markup/canonical/config changes can affect every route.
    if (
      file === "astro.config.mjs" ||
      file === "vercel.json" ||
      file === "src/lib/site.ts" ||
      file === "public/indexnow-key.txt" ||
      file.startsWith("src/lib/seo/") ||
      file.startsWith("src/layouts/") ||
      file.startsWith("src/pages/")
    ) globalChange = true;
  }

  return globalChange ? [...live].sort() : [...selected].sort();
}
