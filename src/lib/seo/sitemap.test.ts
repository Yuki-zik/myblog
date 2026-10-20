import { describe, expect, it } from "vitest";
import { buildSitemapXml } from "./sitemap";

const SITE = "https://a-znk.com/";

describe("canonical XML sitemap", () => {
  it("emits sorted, unique, fully qualified same-origin URLs", () => {
    const xml = buildSitemapXml(SITE, [
      { path: "/posts/first", lastmod: "2026-04-01T09:00:00+08:00" },
      { path: "/" },
      { path: "/posts/first/", lastmod: "2026-04-03T00:00:00Z" },
      { path: "/topics/agent-engineering" }
    ]);

    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.match(/<loc>/g)).toHaveLength(3);
    expect(xml).toContain("<loc>https://a-znk.com/</loc>");
    expect(xml).toContain("<loc>https://a-znk.com/posts/first</loc>");
    expect(xml).toContain("<lastmod>2026-04-03T00:00:00.000Z</lastmod>");
    expect(xml.indexOf("https://a-znk.com/</loc>")).toBeLessThan(
      xml.indexOf("https://a-znk.com/posts/first")
    );
  });

  it("omits lastmod when the page has no verified content date", () => {
    const xml = buildSitemapXml(SITE, [{ path: "/author" }]);
    expect(xml).not.toContain("<lastmod>");
  });

  it("rejects external canonicals, query URLs and invalid timestamps", () => {
    expect(() => buildSitemapXml(SITE, [{ path: "https://other.example/post" }])).toThrow();
    expect(() => buildSitemapXml(SITE, [{ path: "/posts/foo?ref=bar" }])).toThrow();
    expect(() => buildSitemapXml(SITE, [{ path: "/posts/foo", lastmod: "not-a-date" }])).toThrow();
  });

  it("escapes XML-sensitive characters in URLs", () => {
    const xml = buildSitemapXml(SITE, [{ path: "/posts/quote'" }]);
    expect(xml).toContain("quote&apos;");
  });
});
