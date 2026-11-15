import { describe, expect, it } from "vitest";
import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  formatPaperMarkdownMirror,
  formatPostMarkdownMirror
} from "./llms";

describe("buildLlmsTxt", () => {
  it("lets retrieval clients discover the author and scholarly paper pages", () => {
    const index = buildLlmsTxt({
      siteName: "Blog",
      author: { title: "A-Znk", url: "https://x/author" },
      papers: [{ title: "DUAP", url: "https://x/papers/duap", summary: "Published research" }],
      posts: [], topics: [], concepts: []
    });
    expect(index).toContain("## Author\n\n- [A-Znk](https://x/author)");
    expect(index).toContain("## Papers\n\n- [DUAP](https://x/papers/duap): Published research");
  });

  const txt = buildLlmsTxt({
    siteName: "A-Znk的blog",
    tagline: "主题化知识网络",
    posts: [{ title: "Foo", url: "https://x/posts/foo", summary: "about foo" }],
    topics: [{ title: "AI Coding", url: "https://x/topics/ai-coding", summary: "s" }],
    concepts: []
  });

  it("starts with an H1 site name and a blockquote tagline", () => {
    expect(txt.startsWith("# A-Znk的blog\n")).toBe(true);
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

  it("renders intro context, clean Markdown mirror pointers, and llmstxt.org Optional section", () => {
    const rich = buildLlmsTxt({
      siteName: "A-Znk Blog",
      tagline: "AI safety & LLM systems",
      intro: ["Author: A-Znk (Qianli Ma) · ORCID: 0009-0005-2060-4172"],
      posts: [
        {
          title: "Anchor Design",
          url: "https://x/en/posts/anchor",
          summary: "Stable paragraph anchors",
          markdownUrl: "https://x/en/posts/anchor.md"
        }
      ],
      topics: [],
      concepts: [],
      optional: [
        { title: "Full Corpus", url: "https://x/en/llms-full.txt", summary: "Complete Markdown corpus" }
      ]
    });
    expect(rich).toContain("Author: A-Znk (Qianli Ma) · ORCID: 0009-0005-2060-4172");
    expect(rich).toContain("- [Anchor Design](https://x/en/posts/anchor): Stable paragraph anchors ([Markdown](https://x/en/posts/anchor.md))");
    expect(rich).toContain("## Optional\n\n- [Full Corpus](https://x/en/llms-full.txt): Complete Markdown corpus");
  });
});

describe("GEO Markdown mirrors and full corpus", () => {
  it("formats post Markdown mirrors with citation metadata and body", () => {
    const md = formatPostMarkdownMirror({
      title: "段落锚点设计",
      summary: "稳定定位段落。",
      author: "A-Znk",
      date: "2026-02-20T11:00:00+08:00",
      canonicalUrl: "https://a-znk.com/posts/paragraph-anchor-design",
      topics: ["段落级短评", "主题化知识网络"],
      body: "## 第一节\n\n正文内容。"
    });
    expect(md).toContain("# 段落锚点设计");
    expect(md).toContain("- Author: A-Znk");
    expect(md).toContain("- Canonical URL: https://a-znk.com/posts/paragraph-anchor-design");
    expect(md).toContain("- Topics: 段落级短评, 主题化知识网络");
    expect(md).toContain("## 第一节\n\n正文内容。");
  });

  it("formats scholarly paper Markdown mirrors with ORCID, DOI, abstract, citation and BibTeX", () => {
    const md = formatPaperMarkdownMirror({
      title: "DUAP: Disentanglement-Based Universal Adversarial Perturbations",
      subtitle: "面向 Whisper 的多语种通用对抗扰动",
      authors: [{ name: "Qianli Ma", orcid: "0009-0005-2060-4172" }, { name: "Wenjie Zhang" }],
      year: 2026,
      venue: "IEEE Transactions on Information Forensics and Security",
      status: "published",
      doi: "10.1109/TIFS.2026.3671687",
      canonicalUrl: "https://a-znk.com/papers/duap-multilingual-speech-privacy",
      abstract: "本文提出 DUAP 方法。",
      keywords: ["Whisper", "Speech Privacy"],
      citation: "Qianli Ma et al., IEEE TIFS, 2026.",
      bibtex: "@article{ma2026duap, title={DUAP}}",
      body: "## 方法\n\n解耦语言表征。"
    });
    expect(md).toContain("# DUAP: Disentanglement-Based Universal Adversarial Perturbations");
    expect(md).toContain("Qianli Ma (ORCID: https://orcid.org/0009-0005-2060-4172)");
    expect(md).toContain("https://doi.org/10.1109/TIFS.2026.3671687");
    expect(md).toContain("## Abstract\n\n本文提出 DUAP 方法。");
    expect(md).toContain("```bibtex\n@article{ma2026duap, title={DUAP}}\n```");
  });

  it("compiles a complete, structured llms-full.txt corpus", () => {
    const full = buildLlmsFullTxt({
      siteName: "A-Znk的blog",
      tagline: "AI 安全 USTC 硕士",
      canonicalSiteUrl: "https://a-znk.com/",
      author: {
        name: "A-Znk",
        publicationName: "Qianli Ma",
        bio: "AI 安全与大模型系统",
        profileUrl: "https://a-znk.com/author",
        orcid: "0009-0005-2060-4172"
      },
      papers: [
        {
          title: "DUAP",
          authors: [{ name: "Qianli Ma" }],
          year: 2026,
          status: "published",
          abstract: "DUAP abstract.",
          canonicalUrl: "https://a-znk.com/papers/duap"
        }
      ],
      posts: [
        {
          title: "为什么主题先行",
          canonicalUrl: "https://a-znk.com/posts/why-topic-first",
          body: "主题页适合作为第一入口。"
        }
      ],
      topics: [{ title: "Agent Engineering", url: "https://a-znk.com/topics/agent-engineering", summary: "Agent 系统工程" }],
      concepts: [{ title: "Anchor ID", url: "https://a-znk.com/concepts/anchor-id", summary: "稳定段落定位符" }]
    });
    expect(full.startsWith("# A-Znk的blog\n")).toBe(true);
    expect(full).toContain("Qianli Ma");
    expect(full).toContain("https://orcid.org/0009-0005-2060-4172");
    expect(full).toContain("## Scholarly Papers");
    expect(full).toContain("DUAP abstract.");
    expect(full).toContain("## Technical Posts");
    expect(full).toContain("主题页适合作为第一入口。");
    expect(full).toContain("## Topics & Concepts");
  });
});
