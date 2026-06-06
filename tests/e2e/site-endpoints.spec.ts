import { expect, test } from "@playwright/test";

test("site endpoints expose canonical SEO and security headers", async ({ request }) => {
  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain("Sitemap: https://myblog.example/sitemap-index.xml");

  const rss = await request.get("/rss.xml");
  expect(rss.ok()).toBe(true);
  const rssText = await rss.text();
  expect(rssText).toContain("https://myblog.example/posts/myblog-design-manual");
  expect(rssText).not.toContain("https://myblog.example/posts/myblog-design-manual/");

  const search = await request.get("/search-index.json");
  expect(search.ok()).toBe(true);
  expect(search.headers()["x-content-type-options"]).toBe("nosniff");
  expect(search.headers()["cache-control"]).toContain("s-maxage=300");
});
