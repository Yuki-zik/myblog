import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "./llms";

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt({
    siteName: "A-Znk | MyBlog",
    tagline: "主题化知识网络",
    posts: [{ title: "Foo", url: "https://x/posts/foo", summary: "about foo" }],
    topics: [{ title: "AI Coding", url: "https://x/topics/ai-coding", summary: "s" }],
    concepts: []
  });

  it("starts with an H1 site name and a blockquote tagline", () => {
    expect(txt.startsWith("# A-Znk | MyBlog\n")).toBe(true);
    expect(txt).toContain("> 主题化知识网络");
  });

  it("renders each entry as a markdown link with its summary", () => {
    expect(txt).toContain("- [Foo](https://x/posts/foo): about foo");
    expect(txt).toContain("## Posts");
    expect(txt).toContain("## Topics");
  });

  it("omits sections that have no entries", () => {
    expect(txt).not.toContain("## Concepts");
  });

  it("ends with exactly one trailing newline", () => {
    expect(txt.endsWith("\n")).toBe(true);
    expect(txt.endsWith("\n\n")).toBe(false);
  });

  it("omits the summary suffix when absent", () => {
    const bare = buildLlmsTxt({
      siteName: "S",
      posts: [{ title: "No summary", url: "https://x/p" }],
      topics: [],
      concepts: []
    });
    expect(bare).toContain("- [No summary](https://x/p)\n");
  });
});
