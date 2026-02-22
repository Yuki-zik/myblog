import { describe, expect, it } from "vitest";
import {
  normalizeArticleCommentInput,
  normalizeAuthorWebsite,
  validateArticleCommentBody,
  validateArticleCommentInput,
  validateAuthorEmail,
  validateAuthorName,
  validateAuthorWebsite
} from "./validation";

describe("article comment validation", () => {
  it("validates required author name and max length", () => {
    expect(validateAuthorName("   ")).toBeTruthy();
    expect(validateAuthorName("a".repeat(41))).toBeTruthy();
    expect(validateAuthorName("Alice")).toBeNull();
  });

  it("validates optional email and website format", () => {
    expect(validateAuthorEmail("")).toBeNull();
    expect(validateAuthorEmail("invalid")).toBeTruthy();
    expect(validateAuthorEmail("a@example.com")).toBeNull();

    expect(validateAuthorWebsite("")).toBeNull();
    expect(validateAuthorWebsite("not a url")).toBeTruthy();
    expect(validateAuthorWebsite("example.com")).toBeNull();
    expect(normalizeAuthorWebsite("example.com")).toBe("https://example.com");
  });

  it("normalizes and validates a full input payload", () => {
    const normalized = normalizeArticleCommentInput({
      postSlug: " why-topic-first ",
      authorName: "  Alice  ",
      authorEmail: " TEST@EXAMPLE.COM ",
      authorWebsite: "example.com",
      bodyMd: "  **hello**  "
    });

    expect(normalized).toMatchObject({
      postSlug: "why-topic-first",
      authorName: "Alice",
      authorEmail: "test@example.com",
      authorWebsite: "https://example.com",
      bodyMd: "**hello**"
    });

    expect(validateArticleCommentBody(" ", 10)).toBeTruthy();
    expect(validateArticleCommentBody("abc", 10)).toBeNull();

    const errors = validateArticleCommentInput(
      {
        postSlug: "post",
        authorName: " ",
        authorEmail: "bad",
        authorWebsite: "bad url",
        bodyMd: " "
      },
      20
    );

    expect(errors.authorName).toBeTruthy();
    expect(errors.authorEmail).toBeTruthy();
    expect(errors.authorWebsite).toBeTruthy();
    expect(errors.bodyMd).toBeTruthy();
  });
});
