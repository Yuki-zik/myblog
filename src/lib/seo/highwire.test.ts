import { describe, expect, it } from "vitest";
import {
  buildHighwireMetadata,
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
      resources: [{ type: "publisher", url: "https://publisher.example/landing" }, { type: "pdf", url: "https://example.org/fulltext.pdf" }]
    }, "https://a-znk.com/papers/x");
    expect(meta).toContainEqual({ name: "citation_publication_date", content: "2025/09/25" });
    expect(meta).toContainEqual({ name: "citation_conference_title", content: "Verified Conference" });
    expect(meta).toContainEqual({ name: "citation_pdf_url", content: "https://example.org/fulltext.pdf" });
    expect(meta).not.toContainEqual(expect.objectContaining({ name: "citation_journal_title" }));
  });

  it("does not mark drafts or prototypes as scholarly publications", () => {
    expect(buildHighwireMetadata({ ...paper, draft: true }, "https://a-znk.com/papers/draft")).toEqual([]);
    expect(buildHighwireMetadata({ ...paper, status: "prototype" }, "https://a-znk.com/papers/sample")).toEqual([]);
  });
});
