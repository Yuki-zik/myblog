const CONTENT_COLLECTION = /^src\/content\/(posts|papers|topics|concepts)\/(.+)\.md$/;
const ENGLISH_COLLECTION = /^src\/content\/en\/(posts|papers|topics|concepts)\/(.+)\.md$/;
const POST_COVER = /^src\/content\/posts\/covers\/(.+)\.(?:png|jpe?g|webp|svg)$/i;

export function extractSitemapUrls(xml, host) {
  if (!xml.includes("<urlset")) {
    throw new Error("IndexNow requires a direct URL-set sitemap.");
  }
  const origin = new URL(host).origin;
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].replace(/&amp;/g, "&"))
    .filter((url) => {
      try {
        return new URL(url).origin === origin;
      } catch {
        return false;
      }
    });
}

export function changedPaths(files) {
  const paths = new Set();
  let all = false;
  for (const filename of files) {
    const file = filename.trim();
    const english = file.match(ENGLISH_COLLECTION);
    if (english) {
      paths.add("/en/" + english[1] + "/" + english[2]);
      continue;
    }
    const cover = file.match(POST_COVER);
    if (cover) {
      paths.add("/posts/" + cover[1]);
      paths.add("/en/posts/" + cover[1]);
      continue;
    }
    const match = file.match(CONTENT_COLLECTION);
    if (match) {
      paths.add("/" + match[1] + "/" + match[2]);
      continue;
    }

    if (
      file === "astro.config.mjs" ||
      file === "src/content.config.ts" ||
      file === "src/lib/site.ts" ||
      file.startsWith("src/pages/") ||
      file.startsWith("src/layouts/") ||
      file.startsWith("src/lib/seo/") ||
      file.startsWith("src/lib/i18n/") ||
      file.startsWith("src/lib/markdown/")
    ) {
      all = true;
    }
  }
  return { all, paths };
}

export function selectChangedUrls(sitemapUrls, changedFiles, all = false) {
  const { all: allRoutes, paths } = changedPaths(changedFiles);
  if (all || allRoutes) return sitemapUrls;
  return sitemapUrls.filter((url) => paths.has(new URL(url).pathname));
}
