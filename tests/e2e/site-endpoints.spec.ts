import { expect, test, type Page } from "@playwright/test";

test("retrieval clients can follow author and paper URLs from the public index", async ({ page, request }) => {
  const index = await request.get("/llms.txt");
  expect(index.ok()).toBe(true);
  const text = await index.text();
  expect(text).toContain("## Author");
  expect(text).toContain("https://myblog.example/author");
  expect(text).toContain("## Papers");
  expect(text).toContain("https://myblog.example/papers/duap-multilingual-speech-privacy");
  expect(text).toContain("https://myblog.example/papers/oxicams-carbon-dots-machine-learning");
  const homepage = await request.get("/");
  const people = await page.evaluate(html => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap(script => JSON.parse(script.textContent ?? "{}")["@graph"] ?? [])
      .filter(node => node["@type"] === "Person");
  }, await homepage.text());
  expect(people).toHaveLength(1);
  expect(people[0].url).toBe("https://myblog.example/author");
  expect(people[0].sameAs).toContain("https://github.com/yuki-zik");
  expect(people[0].sameAs).toContain("https://orcid.org/0009-0005-2060-4172");
  expect(people[0].sameAs).toContain("https://www.zhihu.com/people/A-Znk");
});

async function sitemapLocations(page: Page, xml: string): Promise<string[]> {
  const parsed = await page.evaluate((source) => {
    const document = new DOMParser().parseFromString(source, "application/xml");
    return {
      error: document.querySelector("parsererror")?.textContent ?? null,
      locations: Array.from(document.getElementsByTagNameNS("*", "loc"), (node) => node.textContent ?? "")
    };
  }, xml);
  expect(parsed.error).toBeNull();
  expect(parsed.locations.length).toBeGreaterThan(0);
  return parsed.locations;
}

test("site endpoints expose canonical SEO and security headers", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain("Sitemap: https://myblog.example/sitemap.xml");

  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBe(true);
  const rssText = await rss.text();
  expect(rssText).toContain("https://myblog.example/posts/myblog-design-manual");
  expect(rssText).not.toContain("https://myblog.example/posts/myblog-design-manual/");

  const search = await request.get("/search-index.json");
  expect(search.ok()).toBe(true);
  expect(search.headers()["content-type"]).toContain("application/json");
});

test("sitemap page URLs match their rendered canonical URLs without trailing slashes", async ({ page, request }) => {
  const index = await request.get("/sitemap-index.xml");
  expect(index.ok()).toBe(true);
  const sitemapUrls = await sitemapLocations(page, await index.text());
  const pageUrls: string[] = [];

  for (const sitemapUrl of sitemapUrls) {
    const sitemap = await request.get(new URL(sitemapUrl).pathname);
    expect(sitemap.ok()).toBe(true);
    pageUrls.push(...await sitemapLocations(page, await sitemap.text()));
  }

  // The direct XML sitemap is intended for search engine submission while
  // Astro's original sitemap index remains usable by existing subscribers.
  const directSitemap = await request.get("/sitemap.xml");
  expect(directSitemap.ok()).toBe(true);
  expect(directSitemap.headers()["content-type"]).toMatch(/(?:application|text)\/xml/);
  const directXml = await directSitemap.text();
  expect(directXml).toContain("<urlset ");
  expect(directXml).toContain("<lastmod>");
  const directUrls = await sitemapLocations(page, directXml);
  const normalized = (urls: string[]) => urls.map((url) => url.replace(/\/$/, "")).sort();
  expect(normalized(directUrls)).toEqual(normalized(pageUrls));

  expect(pageUrls).toContain("https://myblog.example/posts/myblog-design-manual");
  expect(pageUrls).toContain("https://myblog.example/topics/knowledge-network");

  for (const url of pageUrls) {
    const pathname = new URL(url).pathname;
    expect(pathname === "/" || !pathname.endsWith("/"), url).toBe(true);
    const response = await request.get(pathname);
    expect(response.ok(), url).toBe(true);
    const canonical = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, "text/html");
      return document.querySelector('link[rel="canonical"]')?.getAttribute("href");
    }, await response.text());
    // The sitemap writer emits the bare origin for '/', while URL.href and
    // canonical links retain its slash. They identify the same root resource.
    expect(canonical, url).toBe(new URL(url).href);
  }
});

test("RSS represents named authors with Dublin Core creators", async ({ page, request }) => {
  const response = await request.get("/rss.xml");
  expect(response.ok()).toBe(true);
  // Static preview servers may use a generic XML media type for .xml files.
  expect(response.headers()["content-type"]).toMatch(/^(?:application\/(?:rss\+xml|xml)|text\/xml)(?:;|$)/);

  const feed = await page.evaluate((xml) => {
    const document = new DOMParser().parseFromString(xml, "application/xml");
    return {
      error: document.querySelector("parsererror")?.textContent ?? null,
      creatorNamespace: document.documentElement.lookupNamespaceURI("dc"),
      items: Array.from(document.querySelectorAll("item"), (item) => ({
        authors: item.getElementsByTagName("author").length,
        creators: Array.from(
          item.getElementsByTagNameNS("http://purl.org/dc/elements/1.1/", "creator"),
          (creator) => creator.textContent?.trim() ?? ""
        )
      }))
    };
  }, await response.text());

  expect(feed.error).toBeNull();
  expect(feed.creatorNamespace).toBe("http://purl.org/dc/elements/1.1/");
  expect(feed.items.length).toBeGreaterThan(0);
  for (const item of feed.items) {
    expect(item.authors).toBe(0);
    expect(item.creators).toHaveLength(1);
    expect(item.creators[0]).not.toBe("");
  }
});

test("rendered pages advertise the canonical RSS feed for auto-discovery", async ({ page, request }) => {
  for (const path of ["/", "/topics", "/posts/myblog-design-manual", "/papers"]) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    const feeds = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, "text/html");
      return Array.from(
        document.querySelectorAll('head link[rel="alternate"][type="application/rss+xml"]'),
        (link) => link.getAttribute("href")
      );
    }, await response.text());
    expect(feeds, path).toEqual(["https://myblog.example/rss.xml"]);
  }
});

test("research paper pages expose branded Open Graph images", async ({ request, page }) => {
  for (const slug of ["duap-multilingual-speech-privacy", "oxicams-carbon-dots-machine-learning"]) {
    const response = await request.get(`/papers/${slug}`);
    expect(response.ok()).toBe(true);
    const ogImage = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, "text/html");
      return document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    }, await response.text());
    expect(ogImage).toBe(`https://myblog.example/og/papers/${slug}.png`);
    const imageResponse = await request.get(`/og/papers/${slug}.png`);
    expect(imageResponse.ok()).toBe(true);
    expect(imageResponse.headers()["content-type"]).toMatch(/^image\/png/);
  }
});

test("homepage advertises Baidu site ownership verification", async ({ page, request }) => {
  const response = await request.get("/");
  expect(response.ok()).toBe(true);
  const verificationCodes = await page.evaluate((html) => {
    const document = new DOMParser().parseFromString(html, "text/html");
    return Array.from(document.querySelectorAll('meta[name="baidu-site-verification"]'), (meta) => meta.getAttribute("content"));
  }, await response.text());
  expect(verificationCodes).toEqual(["codeva-WhDD0PxDx9"]);
});

test("GEO endpoints expose bilingual LLMs indexes, full-text corpora, and clean Markdown mirrors", async ({ page, request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("User-agent: OAI-SearchBot");
  expect(robots).toContain("User-agent: Claude-SearchBot");
  expect(robots).toContain("User-agent: PerplexityBot");
  expect(robots).toContain("https://myblog.example/llms.txt");
  expect(robots).toContain("https://myblog.example/llms-full.txt");

  const llmsZh = await (await request.get("/llms.txt")).text();
  expect(llmsZh).toContain("0009-0005-2060-4172");
  expect(llmsZh).toContain("https://myblog.example/papers/duap-multilingual-speech-privacy.md");
  expect(llmsZh).toContain("## Optional");
  expect(llmsZh).toContain("https://myblog.example/llms-full.txt");

  const llmsEnRes = await request.get("/en/llms.txt");
  expect(llmsEnRes.ok()).toBe(true);
  const llmsEn = await llmsEnRes.text();
  expect(llmsEn).toContain("https://myblog.example/en/author");
  expect(llmsEn).toContain("https://myblog.example/en/papers/duap-multilingual-speech-privacy");
  expect(llmsEn).toContain("https://myblog.example/en/llms-full.txt");

  for (const corpusPath of ["/llms-full.txt", "/en/llms-full.txt"]) {
    const res = await request.get(corpusPath);
    expect(res.ok(), corpusPath).toBe(true);
    const body = await res.text();
    expect(body).toContain("10.1109/TIFS.2026.3671687");
    expect(body.length).toBeGreaterThan(2000);
  }

  for (const mdPath of [
    "/posts/myblog-design-manual.md",
    "/en/posts/myblog-design-manual.md",
    "/papers/duap-multilingual-speech-privacy.md",
    "/en/papers/duap-multilingual-speech-privacy.md"
  ]) {
    const res = await request.get(mdPath);
    expect(res.ok(), mdPath).toBe(true);
    const md = await res.text();
    expect(md.startsWith("# ")).toBe(true);
    expect(md).toContain("Canonical URL: https://myblog.example/");
  }

  const enPaperHtml = await (await request.get("/en/papers/duap-multilingual-speech-privacy")).text();
  const enPaperMeta = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const graph = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((node) => JSON.parse(node.textContent ?? "{}")["@graph"] ?? []);
    return {
      markdownHref: doc.querySelector('link[rel="alternate"][type="text/markdown"]')?.getAttribute("href"),
      bibtexHref: doc.querySelector('link[rel="alternate"][type="application/x-bibtex"]')?.getAttribute("href"),
      llmsHref: doc.querySelector('link[rel="alternate"][type="text/plain"]')?.getAttribute("href"),
      citationUrl: doc.querySelector('meta[name="citation_abstract_html_url"]')?.getAttribute("content"),
      citationLang: doc.querySelector('meta[name="citation_language"]')?.getAttribute("content"),
      ogImage: doc.querySelector('meta[property="og:image"]')?.getAttribute("content"),
      scholarlyImage: graph.find((node) => node["@type"] === "ScholarlyArticle")?.image
    };
  }, enPaperHtml);

  expect(enPaperMeta.markdownHref).toBe("https://myblog.example/en/papers/duap-multilingual-speech-privacy.md");
  expect(enPaperMeta.bibtexHref).toBe("https://myblog.example/papers/duap-multilingual-speech-privacy.bib");
  expect(enPaperMeta.llmsHref).toBe("https://myblog.example/en/llms.txt");
  expect(enPaperMeta.citationUrl).toBe("https://myblog.example/en/papers/duap-multilingual-speech-privacy");
  expect(enPaperMeta.citationLang).toBe("en");
  expect(enPaperMeta.ogImage).toBe("https://myblog.example/og/en/papers/duap-multilingual-speech-privacy.png");
  expect(enPaperMeta.scholarlyImage).toMatch(/^https:\/\/myblog\.example\/_astro\//);

  const bibRes = await request.get("/papers/duap-multilingual-speech-privacy.bib");
  expect(bibRes.ok()).toBe(true);
  expect(await bibRes.text()).toContain("@article{ma2026duap");

  const datasetJsonRes = await request.get("/agents/dataset.json");
  expect(datasetJsonRes.ok()).toBe(true);
  const datasetJson = await datasetJsonRes.json();
  expect(datasetJson.schemaVersion).toBe(1);
  expect(datasetJson.canonicalUrl).toBe("https://myblog.example/agents");

  const datasetCsvRes = await request.get("/agents/dataset.csv");
  expect(datasetCsvRes.ok()).toBe(true);
  expect(await datasetCsvRes.text()).toContain("record_type,id,date,");

  const agentsHtml = await (await request.get("/en/agents")).text();
  const agentsSchemaTypes = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((node) => JSON.parse(node.textContent ?? "{}")["@graph"] ?? [])
      .map((node) => node["@type"]);
  }, agentsHtml);
  expect(agentsSchemaTypes).toContain("Dataset");

  const enOxicamsHtml = await (await request.get("/en/papers/oxicams-carbon-dots-machine-learning")).text();
  const enOxicamsScholarlyImage = await page.evaluate((html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const graph = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))
      .flatMap((node) => JSON.parse(node.textContent ?? "{}")["@graph"] ?? []);
    return graph.find((node) => node["@type"] === "ScholarlyArticle")?.image;
  }, enOxicamsHtml);
  expect(enOxicamsScholarlyImage).toBe("https://myblog.example/og/en/papers/oxicams-carbon-dots-machine-learning.png");

  const authorHtml = await (await request.get("/author")).text();
  const conceptHtml = await (await request.get("/concepts/anchor-id")).text();
  const schemaTypes = await page.evaluate(({ aHtml, cHtml }) => {
    const extractTypes = (html: string) =>
      Array.from(new DOMParser().parseFromString(html, "text/html").querySelectorAll('script[type="application/ld+json"]'))
        .flatMap((node) => JSON.parse(node.textContent ?? "{}")["@graph"] ?? [])
        .map((node) => node["@type"]);
    return { author: extractTypes(aHtml), concept: extractTypes(cHtml) };
  }, { aHtml: authorHtml, cHtml: conceptHtml });

  expect(schemaTypes.author).toContain("ProfilePage");
  expect(schemaTypes.concept).toContain("DefinedTerm");

  for (const route of ["/", "/en", "/author", "/en/author", "/agents", "/map", "/privacy"]) {
    const html = await (await request.get(route)).text();
    const ogUrl = await page.evaluate((raw) => {
      const doc = new DOMParser().parseFromString(raw, "text/html");
      return doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? "";
    }, html);
    expect(ogUrl, route).toMatch(/^https:\/\/myblog\.example\/og\//);
    const imgRes = await request.get(new URL(ogUrl).pathname);
    expect(imgRes.ok(), `${route} -> ${ogUrl}`).toBe(true);
    expect(imgRes.headers()["content-type"]).toContain("image/png");
  }
});
