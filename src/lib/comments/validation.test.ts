import { describe, expect, it } from "vitest";
import { COMMENT_TAG_LABELS } from "./constants";
import { isCommentTag, normalizeCommentBody, validateCommentBody } from "./validation";

describe("comments validation", () => {
  it("校验 body 长度（空和超长）", () => {
    expect(validateCommentBody("   ", 200)).toBe("评论不能为空");
    expect(validateCommentBody("a".repeat(201), 200)).toBe("评论不能超过 200 个字符");
    expect(validateCommentBody("有效评论", 200)).toBeNull();
  });

  it("normalizeCommentBody 会去掉首尾空白", () => {
    expect(normalizeCommentBody("  你好  ")).toBe("你好");
  });

  it("tag 映射完整且可校验", () => {
    expect(COMMENT_TAG_LABELS.correction).toBe("纠错");
    expect(COMMENT_TAG_LABELS.question).toBe("追问");
    expect(COMMENT_TAG_LABELS.addition).toBe("补充");
    expect(COMMENT_TAG_LABELS.counterexample).toBe("反例");
    expect(COMMENT_TAG_LABELS.agree).toBe("赞同");

    expect(isCommentTag("none")).toBe(true);
    expect(isCommentTag("correction")).toBe(true);
    expect(isCommentTag("invalid-tag")).toBe(false);
  });
});
