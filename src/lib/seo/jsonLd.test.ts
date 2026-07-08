import { describe, expect, it } from "vitest";
import type { SiteAuthorProfile } from "../site";
import {
  buildBaseNodes,
  buildBlogPostingGraph,
  buildBreadcrumb,
  buildCollectionPageGraph,
  personId,
  serializeJsonLd,
  websiteId
} from "./jsonLd";

const SITE = "https://blog.example.com/";

const author: SiteAuthorProfile = {
  id: "a-znk",
  name: "A-Znk",
  socials: { github: "yuki-zik" }
};

describe("buildBaseNodes", () => {
  it("emits a WebSite and Person with stable absolute @ids", () => {
    const [website, person] = buildBaseNodes(SITE, author);

    expect(website["@type"]).toBe("WebSite");
    expect(website["@id"]).toBe("https://blog.example.com/#website");
    expect(website.publisher).toEqual({ "@id": "https://blog.example.com/#person-a-znk" });

    expect(person["@type"]).toBe("Person");
    expect(person["@id"]).toBe("https://blog.example.com/#person-a-znk");
    // Name carries ONLY the name (Google: no titles in author.name).
    expect(person.name).toBe("A-Znk");
    expect(person.sameAs).toEqual(["https://github.com/yuki-zik"]);
  });

  it("omits sameAs when no socials are configured", () => {
    const [, person] = buildBaseNodes(SITE, { id: "x", name: "X" });
    expect(person.sameAs).toBeUndefined();
  });
});

describe("buildBreadcrumb", () => {
  it("numbers positions from 1 and omits item on the trailing crumb", () => {
    const crumb = buildBreadcrumb("https://blog.example.com/posts/foo", [
      { name: "首页", url: "https://blog.example.com/" },
      { name: "主题", url: "https://blog.example.com/topics" },
      { name: "Foo" }
    ]);

    expect(crumb["@id"]).toBe("https://blog.example.com/posts/foo#breadcrumb");
    const list = crumb.itemListElement as Array<Record<string, unknown>>;
    expect(list.map((entry) => entry.position)).toEqual([1, 2, 3]);
    expect(list[0].item).toBe("https://blog.example.com/");
    expect(list[2].item).toBeUndefined();
  });
});

describe("buildBlogPostingGraph", () => {
  const graph = buildBlogPostingGraph({
    siteUrl: SITE,
    canonicalUrl: "https://blog.example.com/posts/foo",
    title: "Foo",
    description: "About foo",
    datePublished: "2026-01-01T00:00:00+08:00",
    imageUrl: "https://blog.example.com/og/foo.png",
    topics: ["知识网络"],
    concepts: ["锚点 ID"],
    breadcrumbs: [
      { name: "首页", url: "https://blog.example.com/" },
      { name: "Foo" }
    ]
  });
  const article = graph[0];

  it("builds a BlogPosting that references the shared Person and WebSite @ids", () => {
    expect(article["@type"]).toBe("BlogPosting");
    expect(article.headline).toBe("Foo");
    expect(article.author).toEqual({ "@id": personId(SITE) });
    expect(article.publisher).toEqual({ "@id": personId(SITE) });
    expect(article.isPartOf).toEqual({ "@id": websiteId(SITE) });
    expect(article.mainEntityOfPage).toBe("https://blog.example.com/posts/foo");
  });

  it("maps visible topics → about and concepts → mentions", () => {
    expect(article.about).toEqual([{ "@type": "Thing", name: "知识网络" }]);
    expect(article.mentions).toEqual([{ "@type": "Thing", name: "锚点 ID" }]);
  });

  it("defaults dateModified to datePublished and never emits citation", () => {
    expect(article.dateModified).toBe("2026-01-01T00:00:00+08:00");
    expect(article.citation).toBeUndefined();
  });

  it("appends a BreadcrumbList node", () => {
    expect(graph[1]["@type"]).toBe("BreadcrumbList");
  });

  it("omits about/mentions when no topics/concepts are visible", () => {
    const [bare] = buildBlogPostingGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/posts/bar",
      title: "Bar",
      datePublished: "2026-01-01T00:00:00+08:00",
      breadcrumbs: [{ name: "Bar" }]
    });
    expect(bare.about).toBeUndefined();
    expect(bare.mentions).toBeUndefined();
  });
});

describe("buildCollectionPageGraph", () => {
  it("builds a CollectionPage tied to the WebSite", () => {
    const [page] = buildCollectionPageGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/topics/ai-coding",
      title: "AI Coding",
      description: "desc",
      breadcrumbs: [{ name: "AI Coding" }]
    });
    expect(page["@type"]).toBe("CollectionPage");
    expect(page.isPartOf).toEqual({ "@id": websiteId(SITE) });
  });
});

describe("serializeJsonLd", () => {
  it("escapes characters that could terminate the inline <script>", () => {
    const html = serializeJsonLd([
      { "@type": "Thing", name: "</script><script>alert(1)" }
    ]);
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c");
    expect(html).toContain("@context");
  });

  it("produces valid JSON once unescaped", () => {
    const nodes = buildBaseNodes(SITE, author);
    const html = serializeJsonLd(nodes);
    // The escaped sequences are valid JSON string escapes, so it round-trips.
    const parsed = JSON.parse(html);
    expect(parsed["@graph"]).toHaveLength(2);
    expect(parsed["@context"]).toBe("https://schema.org");
  });
});
