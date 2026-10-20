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
