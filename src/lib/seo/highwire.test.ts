import { describe, expect, it } from "vitest";
import {
  buildHighwireMetadata,
  compactMetaDescription,
  formatDocumentTitle,
  paperSearchDescription,
  paperSearchTitle,
  type PaperSeoSource
} from "./highwire";

const paper: PaperSeoSource = {
  title: "DUAP: Disentanglement-Based Universal Adversarial Perturbations",
  subtitle: "面向 Whisper 的多语种通用对抗扰动与语音隐私保护",
  summary: "用特征解耦与梯度优化生成跨语种扰动。",
  abstract: "完整英文论文对应的中文摘要。",
  year: 2026,
  status: "published",
  authors: [{ name: "Qianli Ma" }, { name: "Wenjie Zhang" }],
  venue: { name: "IEEE Transactions on Information Forensics and Security", short: "IEEE TIFS", type: "journal" },
  identifiers: { doi: "10.1109/TIFS.2026.3671687" }
};

describe("scholarly discovery metadata", () => {
  it("uses an existing acronym for the concise Chinese search title", () => {
    expect(paperSearchTitle(paper)).toContain("多语种通用对抗扰动");
    expect(paperSearchTitle(paper)).toContain("DUAP");
    expect(paperSearchTitle({ ...paper, title: "Long English Title" })).toContain("IEEE TIFS");
    expect(paperSearchTitle({ ...paper, subtitle: undefined })).toBe(paper.title);
    expect(paperSearchDescription(paper)).toContain("2026");
  });

  it("retains exact scholarly title and each real author in order", () => {
    const meta = buildHighwireMetadata(paper, "https://a-znk.com/papers/duap");
    expect(meta).toContainEqual({ name: "citation_title", content: paper.title });
    expect(meta.filter((item) => item.name === "citation_author")).toEqual([
      { name: "citation_author", content: "Qianli Ma" },
      { name: "citation_author", content: "Wenjie Zhang" }
    ]);
    expect(meta).toContainEqual({ name: "citation_publication_date", content: "2026" });
    expect(meta).toContainEqual({ name: "citation_journal_title", content: paper.venue?.name });
    expect(meta).toContainEqual({ name: "citation_doi", content: paper.identifiers?.doi });
    expect(meta).not.toContainEqual(expect.objectContaining({ name: "citation_pdf_url" }));
  });

  it("formats a verified full publication date and uses conference venue type", () => {
    const meta = buildHighwireMetadata({
      ...paper, publicationDate: "2025-09-25T00:00:00Z",
      venue: { name: "Verified Conference", type: "conference" },
      resources: [{ type: "publisher", url: "https://publisher.example/landing" }, { type: "pdf", url: "https://a-znk.com/papers/x.pdf" }]
    }, "https://a-znk.com/papers/x");
    expect(meta).toContainEqual({ name: "citation_publication_date", content: "2025/09/25" });
    expect(meta).toContainEqual({ name: "citation_conference_title", content: "Verified Conference" });
    expect(meta).toContainEqual({ name: "citation_pdf_url", content: "https://a-znk.com/papers/x.pdf" });
    expect(meta).not.toContainEqual(expect.objectContaining({ name: "citation_journal_title" }));
  });

  it("never advertises externally hosted PDFs as same-directory full text", () => {
    const meta = buildHighwireMetadata({
      ...paper, resources: [{ type: "pdf", url: "https://publisher.example/fulltext.pdf" }]
    }, "https://a-znk.com/papers/x");
    expect(meta).not.toContainEqual(expect.objectContaining({ name: "citation_pdf_url" }));
  });

  it("does not mark drafts or prototypes as scholarly publications", () => {
    expect(buildHighwireMetadata({ ...paper, draft: true }, "https://a-znk.com/papers/draft")).toEqual([]);
    expect(buildHighwireMetadata({ ...paper, status: "prototype" }, "https://a-znk.com/papers/sample")).toEqual([]);
  });

  it("emits citation_language and preserves localized abstract URL when locale is supplied", () => {
    const enMeta = buildHighwireMetadata(paper, "https://a-znk.com/en/papers/duap", { locale: "en" });
    expect(enMeta).toContainEqual({ name: "citation_abstract_html_url", content: "https://a-znk.com/en/papers/duap" });
    expect(enMeta).toContainEqual({ name: "citation_language", content: "en" });

    const zhMeta = buildHighwireMetadata(paper, "https://a-znk.com/papers/duap", { locale: "zh-CN" });
    expect(zhMeta).toContainEqual({ name: "citation_language", content: "zh" });
  });

  it("keeps English paper search titles <= 58 chars and descriptions <= 158 chars without fabrication", () => {
    const enDuap: PaperSeoSource = {
      ...paper,
      title: "DUAP: Disentanglement-Based Universal Adversarial Perturbations for Robust Multilingual Speech Privacy Protection",
      summary: "Language feature disentanglement and gradient optimization produce transferable perturbations that reduce Whisper’s ability to transcribe sensitive speech.",
      abstract: "Long 400+ char abstract ".repeat(20)
    };
    const title = paperSearchTitle(enDuap, "en");
    const docTitle = formatDocumentTitle(title, "A-Znk Blog", 65);
    const desc = paperSearchDescription(enDuap, "en");
    expect(title).toBe("DUAP: Robust Multilingual Speech Privacy Protection");
    expect(docTitle).toBe("DUAP: Robust Multilingual Speech Privacy Protection | A-Znk Blog");
    expect(docTitle.length).toBeLessThanOrEqual(65);
    expect(
      formatDocumentTitle("Ratiometric Determination and Discrimination of Oxicams", "A-Znk Blog", 65)
    ).toBe("Ratiometric Determination and Discrimination… | A-Znk Blog");
    expect(desc).toBe(enDuap.summary);
    expect(desc.length).toBeLessThanOrEqual(158);
    expect(compactMetaDescription("First complete sentence over sixty characters for clean SERP snippet display. Second long sentence that exceeds the 158 character limit easily when appended to the first one.")).toBe(
      "First complete sentence over sixty characters for clean SERP snippet display."
    );
  });
});
