import { describe, expect, it } from "vitest";
import type { SiteAuthorProfile } from "../site";
import {
  buildAgentDatasetGraph,
  buildBaseNodes,
  buildBlogPostingGraph,
  buildBreadcrumb,
  buildCollectionPageGraph,
  buildDefinedTermGraph,
  buildProfilePageGraph,
  buildScholarlyArticleGraph,
  personId,
  serializeJsonLd,
  websiteId
} from "./jsonLd";

const SITE = "https://blog.example.com/";

const author: SiteAuthorProfile = {
  id: "a-znk",
  name: "A-Znk",
  publicationName: "Qianli Ma",
  socials: {
    github: "yuki-zik",
    scholar: "https://scholar.google.com/citations?user=NTwrnCIAAAAJ"
  }
};

describe("buildBaseNodes", () => {
  it("links the author identity to its canonical profile when no homepage is supplied", () => {
    expect(buildBaseNodes(SITE, author)[1].url).toBe("https://blog.example.com/author");
  });

  it("preserves an explicitly configured author homepage", () => {
    expect(buildBaseNodes(SITE, { ...author, homepage: "https://author.example/" })[1].url).toBe("https://author.example/");
  });

  it("emits a WebSite and Person with stable absolute @ids", () => {
    const [website, person] = buildBaseNodes(SITE, author);

    expect(website["@type"]).toBe("WebSite");
    expect(website["@id"]).toBe("https://blog.example.com/#website");
    expect(website.name).toBe("A-Znk的blog");
    expect(website.alternateName).toEqual(["A-Znk Blog", "A-Znk的博客"]);
    expect(website.description).toContain("大模型");
    expect(website.publisher).toEqual({ "@id": "https://blog.example.com/#person-a-znk" });

    expect(person["@type"]).toBe("Person");
    expect(person["@id"]).toBe("https://blog.example.com/#person-a-znk");
    // Name carries ONLY the name (Google: no titles in author.name).
    expect(person.name).toBe("A-Znk");
    expect(person.alternateName).toBe("Qianli Ma");
    expect(person.sameAs).toEqual([
      "https://github.com/yuki-zik",
      "https://scholar.google.com/citations?user=NTwrnCIAAAAJ"
    ]);
  });

  it("omits sameAs when no socials are configured", () => {
    const [, person] = buildBaseNodes(SITE, { id: "x", name: "X" });
    expect(person.sameAs).toBeUndefined();
  });

  it("includes ORCID, Zhihu, jobTitle and knowsAbout on Person when provided", () => {
    const [, person] = buildBaseNodes(SITE, {
      ...author,
      bioShort: "AI 安全 USTC 硕士",
      blogScope: ["大模型系统与安全研究", "Agent 工程实践"],
      socials: {
        ...author.socials,
        orcid: "0009-0005-2060-4172",
        zhihu: "https://www.zhihu.com/people/A-Znk"
      }
    });
    expect(person.sameAs).toContain("https://orcid.org/0009-0005-2060-4172");
    expect(person.sameAs).toContain("https://www.zhihu.com/people/A-Znk");
    expect(person.jobTitle).toBe("AI 安全 USTC 硕士");
    expect(person.knowsAbout).toEqual(["大模型系统与安全研究", "Agent 工程实践"]);
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

describe("buildScholarlyArticleGraph", () => {
  it("omits unknown publication and modification dates", () => {
    const [paper] = buildScholarlyArticleGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/papers/year-only",
      title: "Year-only paper",
      description: "Abstract",
      authors: [{ name: "Qianli Ma", self: true }],
      keywords: ["security"],
      breadcrumbs: [{ name: "Year-only paper" }]
    });
    expect(paper).not.toHaveProperty("datePublished");
    expect(paper).not.toHaveProperty("dateModified");
  });

  it("preserves an explicit modification date without assuming a publication date", () => {
    const [paper] = buildScholarlyArticleGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/papers/updated",
      title: "Updated paper",
      description: "Abstract",
      authors: [{ name: "Qianli Ma", self: true }],
      dateModified: "2026-09-06T00:00:00Z",
      keywords: ["security"],
      breadcrumbs: [{ name: "Updated paper" }]
    });
    expect(paper).not.toHaveProperty("datePublished");
    expect(paper.dateModified).toBe("2026-09-06T00:00:00Z");
  });

  it("emits scholarly metadata and resolves the site author identity", () => {
    const [paper] = buildScholarlyArticleGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/papers/security",
      title: "Security evaluation",
      description: "Abstract",
      authors: [
        { name: "A-Znk", self: true },
        { name: "Research Partner", url: "https://example.com/researcher" }
      ],
      datePublished: "2026-08-03T12:00:00+08:00",
      keywords: ["MLLM", "security"],
      venue: "Preprint",
      doi: "10.0000/example",
      breadcrumbs: [{ name: "论文" }, { name: "Security evaluation" }]
    });

    expect(paper["@type"]).toBe("ScholarlyArticle");
    expect(paper.datePublished).toBe("2026-08-03T12:00:00+08:00");
    expect(paper.dateModified).toBe("2026-08-03T12:00:00+08:00");
    expect(paper.author).toEqual([
      { "@id": personId(SITE) },
      { "@type": "Person", name: "Research Partner", url: "https://example.com/researcher" }
    ]);
    expect(paper.identifier).toEqual({
      "@type": "PropertyValue",
      propertyID: "DOI",
      value: "10.0000/example"
    });
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

describe("buildProfilePageGraph and buildDefinedTermGraph", () => {
  it("builds a ProfilePage whose mainEntity is the shared Person @id", () => {
    const graph = buildProfilePageGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/author",
      title: "A-Znk | 作者",
      description: "研究者简介",
      breadcrumbs: [
        { name: "首页", url: "https://blog.example.com/" },
        { name: "作者" }
      ]
    });
    expect(graph[0]["@type"]).toBe("ProfilePage");
    expect(graph[0].mainEntity).toEqual({ "@id": personId(SITE) });
    expect(graph[0].isPartOf).toEqual({ "@id": websiteId(SITE) });
    expect(graph[1]["@type"]).toBe("BreadcrumbList");
  });

  it("builds a DefinedTerm + CollectionPage graph for concept pages", () => {
    const graph = buildDefinedTermGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/concepts/anchor-id",
      title: "Anchor ID",
      description: "段落在文章中的稳定定位符。",
      tags: ["markdown", "comments"],
      breadcrumbs: [
        { name: "首页", url: "https://blog.example.com/" },
        { name: "Anchor ID" }
      ]
    });
    const term = graph.find((node) => node["@type"] === "DefinedTerm")!;
    const page = graph.find((node) => node["@type"] === "CollectionPage")!;
    expect(term).toBeDefined();
    expect(term.name).toBe("Anchor ID");
    expect(term.inDefinedTermSet).toBe("https://blog.example.com/map");
    expect(page.mainEntity).toEqual({ "@id": "https://blog.example.com/concepts/anchor-id#definedterm" });
  });

  it("enriches BlogPosting with reading time/word count and ScholarlyArticle with co-author ORCID & DOI sameAs", () => {
    const [post] = buildBlogPostingGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/posts/foo",
      title: "Foo",
      datePublished: "2026-01-01T00:00:00+08:00",
      readingMinutes: 6,
      wordCount: 1850,
      breadcrumbs: [{ name: "Foo" }]
    });
    expect(post.isAccessibleForFree).toBe(true);
    expect(post.timeRequired).toBe("PT6M");
    expect(post.wordCount).toBe(1850);

    const [paper] = buildScholarlyArticleGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/papers/duap",
      title: "DUAP",
      description: "Abstract",
      authors: [
        { name: "Qianli Ma", self: true },
        { name: "Wenjie Zhang", orcid: "0009-0004-4401-2385" }
      ],
      keywords: ["Whisper"],
      doi: "10.1109/TIFS.2026.3671687",
      imageUrl: "https://blog.example.com/og/papers/duap.png",
      breadcrumbs: [{ name: "DUAP" }]
    });
    expect(paper.sameAs).toBe("https://doi.org/10.1109/TIFS.2026.3671687");
    expect(paper.image).toBe("https://blog.example.com/og/papers/duap.png");
    expect(paper.author).toEqual([
      { "@id": personId(SITE) },
      {
        "@type": "Person",
        name: "Wenjie Zhang",
        sameAs: "https://orcid.org/0009-0004-4401-2385"
      }
    ]);
  });

  it("builds a Dataset + CollectionPage graph with JSON and CSV DataDownload distributions", () => {
    const graph = buildAgentDatasetGraph({
      siteUrl: SITE,
      canonicalUrl: "https://blog.example.com/agents",
      title: "Agent 工作观察站",
      description: "观察站描述",
      datasetName: "Agent Work Observatory Open Dataset",
      datasetDescription:
        "Empirical literature index, reviewed public repository delivery records, and structured daily observation logs for human-agent software engineering.",
      measurementTechnique:
        "Public repository audit and structured daily task/attention logging; unmeasured quantities remain null.",
      dateModified: "2026-10-25T00:00:00Z",
      keywords: ["AI agents", "METR", "agent engineering"],
      breadcrumbs: [
        { name: "首页", url: "https://blog.example.com/" },
        { name: "Agent 工作观察站" }
      ]
    });

    const page = graph.find((node) => node["@type"] === "CollectionPage")!;
    const dataset = graph.find((node) => node["@type"] === "Dataset")!;
    expect(page.mainEntity).toEqual({ "@id": "https://blog.example.com/agents#dataset" });
    expect(dataset.isAccessibleForFree).toBe(true);
    expect(dataset.creator).toEqual({ "@id": personId(SITE) });
    expect(dataset.distribution).toEqual([
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://blog.example.com/agents/dataset.json"
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: "https://blog.example.com/agents/dataset.csv"
      }
    ]);
  });
});
