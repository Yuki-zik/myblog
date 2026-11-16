import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = resolve("dist");
const read = (file) => readFileSync(resolve(root, file), "utf8");
const assertNonEmptyFile = (relPath, label = relPath) => {
  const abs = resolve(root, relPath);
  assert(existsSync(abs), `missing built file: ${label} (${relPath})`);
  assert(statSync(abs).size > 0, `empty built file: ${label} (${relPath})`);
};
const extract = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&"));
const normalize = (url) => url.replace(/\/$/, "");
const assert = (condition, message) => {
  if (!condition) throw new Error("SEO/GEO build validation: " + message);
};

const direct = read("sitemap.xml");
const astro = read("sitemap-0.xml");
const robots = read("robots.txt");
const directUrls = extract(direct);
const astroUrls = extract(astro);

assert(direct.includes("<urlset "), "/sitemap.xml must be a URL-set XML sitemap");
assert(directUrls.length > 0, "no public URLs found");
assert(
  JSON.stringify(directUrls.map(normalize).sort()) ===
  JSON.stringify(astroUrls.map(normalize).sort()),
  "direct sitemap and Astro sitemap index must describe the same public URLs"
);
assert(new Set(directUrls).size === directUrls.length, "duplicate URLs");
const siteOrigin = new URL(directUrls[0]).origin;
assert(directUrls.every((url) => url.startsWith(siteOrigin + "/")), "foreign URL");
assert(!directUrls.some((url) => /\.(md|txt|json|xml|bib|csv)(?:$|\?)/.test(url)), "non-HTML route in sitemap");

// Crawl & AI agent directives
assert(robots.includes("Sitemap: " + new URL("/sitemap.xml", siteOrigin).toString()), "robots sitemap mismatch");
for (const agent of ["OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "GPTBot", "Google-Extended"]) {
  assert(robots.includes(`User-agent: ${agent}`), `robots.txt missing ${agent}`);
}
assert(robots.includes("/llms.txt") && robots.includes("/llms-full.txt"), "robots.txt missing LLM corpus pointers");

// GEO corpus endpoints, open datasets & bilingual feeds
for (const endpoint of [
  "llms.txt",
  "en/llms.txt",
  "llms-full.txt",
  "en/llms-full.txt",
  "rss.xml",
  "en/rss.xml",
  "agents/dataset.json",
  "agents/dataset.csv",
  "BingSiteAuth.xml"
]) {
  assertNonEmptyFile(endpoint);
}
const datasetJson = JSON.parse(read("agents/dataset.json"));
assert(datasetJson.schemaVersion === 1, "agents/dataset.json invalid schemaVersion");
assert(datasetJson.personalObservations?.summary?.peakParallel === null || typeof datasetJson.personalObservations?.summary?.peakParallel === "number", "agents/dataset.json invalid summary");
assert(read("agents/dataset.csv").startsWith("record_type,id,date,"), "agents/dataset.csv missing header row");
const llmsZh = read("llms.txt");
const llmsEn = read("en/llms.txt");
for (const section of ["## Author", "## Papers", "## Topics", "## Posts", "## Optional"]) {
  assert(llmsZh.includes(section), `llms.txt missing ${section}`);
  assert(llmsEn.includes(section), `en/llms.txt missing ${section}`);
}
assert(llmsZh.includes("0009-0005-2060-4172"), "llms.txt missing author ORCID");
assert(llmsEn.includes("/en/llms-full.txt"), "en/llms.txt missing English full corpus pointer");

for (const feedFile of ["rss.xml", "en/rss.xml"]) {
  const feed = read(feedFile);
  assert(feed.includes('xmlns:atom="http://www.w3.org/2005/Atom"'), `${feedFile}: missing Atom namespace`);
  assert(feed.includes('<atom:link ') && feed.includes('rel="self"'), `${feedFile}: missing atom:link self`);
  assert(feed.includes("<lastBuildDate>"), `${feedFile}: missing lastBuildDate`);
}

let markdownMirrorCount = 0;
let ogCardCount = 0;

for (const rawUrl of directUrls) {
  const parsed = new URL(rawUrl);
  const pathname = parsed.pathname;
  const isEn = pathname === "/en" || pathname.startsWith("/en/");
  const htmlRel = pathname === "/" ? "index.html" : `${pathname.slice(1)}/index.html`;
  assertNonEmptyFile(htmlRel, pathname);

  const document = new JSDOM(read(htmlRel)).window.document;
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute("href");
  assert(canonical === parsed.href, `${pathname}: canonical mismatch (${canonical} vs ${parsed.href})`);

  const docTitle = document.querySelector("title")?.textContent?.trim() ?? "";
  assert(
    docTitle.length >= 15 && docTitle.length <= 65,
    `${pathname}: <title> length out of 15..65 char range (${docTitle.length}: "${docTitle}")`
  );

  const description = document.querySelector('meta[name="description"]')?.getAttribute("content")?.trim() ?? "";
  const effectiveDescLength = [...description].reduce(
    (sum, ch) => sum + (/[\u3400-\u9fff\uff00-\uffef]/.test(ch) ? 2 : 1),
    0
  );
  assert(
    effectiveDescLength >= 45 && description.length <= 160,
    `${pathname}: meta description out of bounds (${description.length} chars / ${effectiveDescLength} cols: "${description}")`
  );

  const robotsMeta = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";
  assert(!robotsMeta.includes("noindex"), `${pathname}: public sitemap route cannot be noindex`);
  assert(robotsMeta.includes("max-snippet:-1") && robotsMeta.includes("max-image-preview:large"), `${pathname}: missing snippet/image preview robots directives`);

  const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
  assert(Boolean(ogImage), `${pathname}: missing og:image`);
  const ogParsed = new URL(ogImage, parsed.origin);
  if (ogParsed.origin === parsed.origin) {
    assertNonEmptyFile(ogParsed.pathname.slice(1), `${pathname} og:image`);
    ogCardCount++;
  }
  assert(Boolean(document.querySelector('meta[property="og:image:alt"]')?.getAttribute("content")?.trim()), `${pathname}: missing og:image:alt`);
  assert(Boolean(document.querySelector('meta[name="twitter:image:alt"]')?.getAttribute("content")?.trim()), `${pathname}: missing twitter:image:alt`);

  const llmsLink = document.querySelector('link[rel="alternate"][type="text/plain"]')?.getAttribute("href");
  const expectedLlms = new URL(isEn ? "/en/llms.txt" : "/llms.txt", parsed.origin).href;
  assert(llmsLink === expectedLlms, `${pathname}: text/plain LLMs alternate mismatch (${llmsLink})`);

  const isPrototypePaper = Boolean(document.querySelector(".paper-status--prototype"));
  const mdLink = document.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href");
  const requiresMarkdown =
    /^\/(?:en\/)?posts\/[^/]+$/.test(pathname) ||
    (/^\/(?:en\/)?papers\/[^/]+$/.test(pathname) && !isPrototypePaper);
  if (requiresMarkdown) {
    assert(Boolean(mdLink), `${pathname}: missing text/markdown alternate link`);
  }
  if (mdLink) {
    const mdPath = new URL(mdLink, parsed.origin).pathname.slice(1);
    assertNonEmptyFile(mdPath, `${pathname} markdown mirror`);
    assert(read(mdPath).startsWith("# "), `${pathname}: markdown mirror ${mdPath} must start with H1`);
    markdownMirrorCount++;
  }

  const ldScripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
  assert(ldScripts.length >= 1, `${pathname}: missing JSON-LD script`);
  const graphNodes = ldScripts.flatMap((node) => JSON.parse(node.textContent ?? "{}")["@graph"] ?? []);
  const types = new Set(
    graphNodes.flatMap((node) => (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]]).filter(Boolean))
  );
  assert(types.has("WebSite") && types.has("Person"), `${pathname}: missing base WebSite/Person JSON-LD`);
  const website = graphNodes.find((node) => node["@type"] === "WebSite");
  assert(
    new Set(website?.alternateName ?? []).size === (website?.alternateName ?? []).length &&
    !(website?.alternateName ?? []).includes(website?.name),
    `${pathname}: WebSite.alternateName duplicates or equals WebSite.name`
  );
  const person = graphNodes.find((node) => node["@type"] === "Person" && node["@id"]?.endsWith("#person-a-znk"));
  assert(person?.sameAs?.includes("https://orcid.org/0009-0005-2060-4172"), `${pathname}: Person JSON-LD missing ORCID sameAs`);

  if (pathname === "/author" || pathname === "/en/author") {
    assert(types.has("ProfilePage"), `${pathname}: missing ProfilePage JSON-LD`);
  }
  if (pathname === "/agents" || pathname === "/en/agents") {
    assert(types.has("Dataset") && types.has("CollectionPage"), `${pathname}: missing Dataset + CollectionPage JSON-LD`);
    const datasetNode = graphNodes.find((node) => node["@type"] === "Dataset");
    const dsDescLen = String(datasetNode?.description ?? "").length;
    assert(
      dsDescLen >= 50 && dsDescLen <= 5000,
      `${pathname}: Dataset description must be 50..5000 chars per Google Dataset Search (${dsDescLen})`
    );
    assert(
      Array.isArray(datasetNode?.distribution) && datasetNode.distribution.length >= 2,
      `${pathname}: Dataset missing DataDownload distribution entries`
    );
    for (const distItem of datasetNode.distribution) {
      const distPath = new URL(distItem.contentUrl, parsed.origin).pathname.slice(1);
      assertNonEmptyFile(distPath, `${pathname} Dataset DataDownload`);
    }
  }
  if (/^\/(?:en\/)?concepts\/[^/]+$/.test(pathname)) {
    assert(types.has("DefinedTerm"), `${pathname}: missing DefinedTerm JSON-LD`);
  }
  if (/^\/(?:en\/)?posts\/[^/]+$/.test(pathname)) {
    assert(types.has("BlogPosting"), `${pathname}: missing BlogPosting JSON-LD`);
  }
  if (/^\/(?:en\/)?papers\/[^/]+$/.test(pathname)) {
    if (isPrototypePaper) {
      assert(!types.has("ScholarlyArticle"), `${pathname}: prototype paper cannot emit ScholarlyArticle JSON-LD`);
    } else {
      assert(types.has("ScholarlyArticle"), `${pathname}: missing ScholarlyArticle JSON-LD`);
      const absUrl = document.querySelector('meta[name="citation_abstract_html_url"]')?.getAttribute("content");
      const citLang = document.querySelector('meta[name="citation_language"]')?.getAttribute("content");
      const bibLink = document.querySelector('link[rel="alternate"][type="application/x-bibtex"]')?.getAttribute("href");
      assert(absUrl === parsed.href, `${pathname}: citation_abstract_html_url mismatch (${absUrl})`);
      assert(citLang === (isEn ? "en" : "zh"), `${pathname}: citation_language mismatch (${citLang})`);
      assert(Boolean(bibLink), `${pathname}: missing application/x-bibtex alternate link`);
      assertNonEmptyFile(new URL(bibLink, parsed.origin).pathname.slice(1), `${pathname} BibTeX endpoint`);
    }
  }
}

console.log(
  `SEO/GEO build check passed: ${directUrls.length} canonical pages, ${ogCardCount} verified OG cards, ${markdownMirrorCount} Markdown mirrors.`
);
