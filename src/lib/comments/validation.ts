import {
  COMMENT_MAX_LEN_DEFAULT,
  COMMENT_TAG_LABELS
} from "./constants";
import type { CommentTag } from "./types";

export function getCommentMaxLen(): number {
  const raw = import.meta.env.PUBLIC_COMMENTS_MAX_LEN;
  if (!raw) {
    return COMMENT_MAX_LEN_DEFAULT;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return COMMENT_MAX_LEN_DEFAULT;
  }

  return parsed;
}

export function isRequireApprovalEnabled(): boolean {
  return import.meta.env.PUBLIC_COMMENTS_REQUIRE_APPROVAL === "true";
}

export function normalizeCommentBody(body: string): string {
  return body.trim();
}

export function validateCommentBody(body: string, maxLen = getCommentMaxLen()): string | null {
  const normalized = normalizeCommentBody(body);
  if (normalized.length < 1) {
    return "评论不能为空";
  }
  if (normalized.length > maxLen) {
    return `评论不能超过 ${maxLen} 个字符`;
  }
  return null;
}

export function isCommentTag(value: string): value is CommentTag {
  return value in COMMENT_TAG_LABELS;
}
