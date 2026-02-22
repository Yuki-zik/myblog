import { describe, expect, it } from "vitest";
import { buildPostToc } from "./toc";

describe("buildPostToc", () => {
  it("keeps only h2/h3 headings and builds hierarchical numbering", () => {
    const toc = buildPostToc([
      { depth: 1, slug: "title", text: "文章标题" },
      { depth: 2, slug: "status", text: "现状" },
      { depth: 3, slug: "why-books", text: "书籍阅读有其不可替代性" },
      { depth: 3, slug: "feed-timing", text: "看 Feed 内容的时机" },
      { depth: 2, slug: "afterword", text: "后记" },
      { depth: 4, slug: "ignored", text: "ignore" }
    ]);

    expect(toc.map((item) => ({ slug: item.slug, numberLabel: item.numberLabel, depth: item.depth }))).toEqual([
      { slug: "status", numberLabel: "1", depth: 2 },
      { slug: "why-books", numberLabel: "1.1", depth: 3 },
      { slug: "feed-timing", numberLabel: "1.2", depth: 3 },
      { slug: "afterword", numberLabel: "2", depth: 2 }
    ]);
  });

  it("returns an empty toc for blank or unsupported headings", () => {
    const toc = buildPostToc([
      { depth: 2, slug: " ", text: "No slug" },
      { depth: 4, slug: "deep", text: "Deep" }
    ]);

    expect(toc).toEqual([]);
  });

  it("handles h3 before any h2 by seeding the first section", () => {
    const toc = buildPostToc([{ depth: 3, slug: "intro-note", text: "说明" }]);

    expect(toc[0]?.numberLabel).toBe("1.1");
  });
});
