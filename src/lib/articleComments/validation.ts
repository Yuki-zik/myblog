import type {
  ArticleCommentFieldErrors,
  CreateArticleCommentInput,
  NormalizedArticleCommentInput
} from "./types";

export const ARTICLE_COMMENT_AUTHOR_NAME_MAX_LEN = 40;
export const ARTICLE_COMMENT_BODY_MAX_LEN_DEFAULT = 5000;

function trimToNull(value?: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getArticleCommentMaxLen(): number {
  const raw = import.meta.env.PUBLIC_ARTICLE_COMMENTS_MAX_LEN;
  if (!raw) {
    return ARTICLE_COMMENT_BODY_MAX_LEN_DEFAULT;
  }

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return ARTICLE_COMMENT_BODY_MAX_LEN_DEFAULT;
  }

  return parsed;
}

export function normalizeAuthorWebsite(value?: string): string | null {
  const trimmed = trimToNull(value);
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeArticleCommentInput(
  input: CreateArticleCommentInput
): NormalizedArticleCommentInput {
  return {
    postSlug: input.postSlug.trim(),
    authorName: input.authorName.trim(),
    authorEmail: trimToNull(input.authorEmail)?.toLowerCase() ?? null,
    authorWebsite: normalizeAuthorWebsite(input.authorWebsite),
    bodyMd: input.bodyMd.trim()
  };
}

export function validateAuthorName(value: string): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return "\u6635\u79f0\u4e0d\u80fd\u4e3a\u7a7a";
  }

  if (normalized.length > ARTICLE_COMMENT_AUTHOR_NAME_MAX_LEN) {
    return `\u6635\u79f0\u4e0d\u80fd\u8d85\u8fc7 ${ARTICLE_COMMENT_AUTHOR_NAME_MAX_LEN} \u4e2a\u5b57\u7b26`;
  }

  return null;
}

export function validateAuthorEmail(value?: string): string | null {
  const normalized = trimToNull(value);
  if (!normalized) {
    return null;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalized)) {
    return "\u90ae\u7bb1\u683c\u5f0f\u4e0d\u5408\u6cd5";
  }

  if (normalized.length > 120) {
    return "\u90ae\u7bb1\u957f\u5ea6\u8fc7\u957f";
  }

  return null;
}

export function validateAuthorWebsite(value?: string): string | null {
  const normalized = normalizeAuthorWebsite(value);
  if (!normalized) {
    return null;
  }

  try {
    const url = new URL(normalized);
    if (!["http:", "https:"].includes(url.protocol)) {
      return "\u7f51\u5740\u4ec5\u652f\u6301 http/https";
    }
  } catch {
    return "\u7f51\u5740\u683c\u5f0f\u4e0d\u5408\u6cd5";
  }

  if (normalized.length > 300) {
    return "\u7f51\u5740\u957f\u5ea6\u8fc7\u957f";
  }

  return null;
}

export function validateArticleCommentBody(
  value: string,
  maxLen = getArticleCommentMaxLen()
): string | null {
  const normalized = value.trim();
  if (!normalized) {
    return "\u8bc4\u8bba\u4e0d\u80fd\u4e3a\u7a7a";
  }

  if (normalized.length > maxLen) {
    return `\u8bc4\u8bba\u4e0d\u80fd\u8d85\u8fc7 ${maxLen} \u4e2a\u5b57\u7b26`;
  }

  return null;
}

export function validateArticleCommentInput(
  input: CreateArticleCommentInput,
  maxLen = getArticleCommentMaxLen()
): ArticleCommentFieldErrors {
  const errors: ArticleCommentFieldErrors = {};
  const normalized = normalizeArticleCommentInput(input);

  const nameError = validateAuthorName(normalized.authorName);
  if (nameError) {
    errors.authorName = nameError;
  }

  const emailError = validateAuthorEmail(normalized.authorEmail ?? undefined);
  if (emailError) {
    errors.authorEmail = emailError;
  }

  const websiteError = validateAuthorWebsite(normalized.authorWebsite ?? undefined);
  if (websiteError) {
    errors.authorWebsite = websiteError;
  }

  const bodyError = validateArticleCommentBody(normalized.bodyMd, maxLen);
  if (bodyError) {
    errors.bodyMd = bodyError;
  }

  return errors;
}
