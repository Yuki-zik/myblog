import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArticleComments from "./ArticleComments";
import type { ArticleComment } from "../../lib/articleComments/types";

vi.mock("../../lib/articleComments/api", () => ({
  fetchVisibleArticleComments: vi.fn(),
  createArticleComment: vi.fn(),
  ensureCommentSession: vi.fn(),
  getCurrentCommentAuthState: vi.fn(),
  signInWithGitHubForComments: vi.fn()
}));

import {
  createArticleComment,
  ensureCommentSession,
  fetchVisibleArticleComments,
  getCurrentCommentAuthState,
  signInWithGitHubForComments
} from "../../lib/articleComments/api";

const mockedFetchVisibleArticleComments = vi.mocked(fetchVisibleArticleComments);
const mockedCreateArticleComment = vi.mocked(createArticleComment);
const mockedEnsureCommentSession = vi.mocked(ensureCommentSession);
const mockedGetCurrentCommentAuthState = vi.mocked(getCurrentCommentAuthState);
const mockedSignInWithGitHubForComments = vi.mocked(signInWithGitHubForComments);

function makeComment(overrides: Partial<ArticleComment> = {}): ArticleComment {
  return {
    id: 1,
    post_slug: "test-post",
    body_md: "**Hello**",
    status: "visible",
    author_id: "user-1",
    author_name: "Alice",
    author_email: null,
    author_website: null,
    auth_provider: "anonymous",
    created_at: "2026-02-22T10:00:00+08:00",
    ...overrides
  };
}

describe("ArticleComments", () => {
  beforeEach(() => {
    mockedFetchVisibleArticleComments.mockReset();
    mockedCreateArticleComment.mockReset();
    mockedEnsureCommentSession.mockReset();
    mockedGetCurrentCommentAuthState.mockReset();
    mockedSignInWithGitHubForComments.mockReset();

    mockedEnsureCommentSession.mockResolvedValue({ userId: "anon-1" });
    mockedFetchVisibleArticleComments.mockResolvedValue([]);
    mockedGetCurrentCommentAuthState.mockResolvedValue({
      userId: "anon-1",
      provider: "anonymous",
      isAnonymous: true,
      canPost: true,
      label: "\u533f\u540d"
    });
  });

  it("renders empty state after loading", async () => {
    render(<ArticleComments postSlug="test-post" />);

    await waitFor(() => {
      expect(screen.getByText("\u8fd8\u6ca1\u6709\u8bc4\u8bba")).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText("\u6635\u79f0 *")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "\u53d1\u8868\u8bc4\u8bba" })).toBeInTheDocument();
  });

  it("shows validation errors and submits successfully", async () => {
    mockedCreateArticleComment.mockResolvedValue(
      makeComment({
        id: 22,
        body_md: "**Hi** from test"
      })
    );

    render(<ArticleComments postSlug="test-post" />);

    await screen.findByText("\u8fd8\u6ca1\u6709\u8bc4\u8bba");

    fireEvent.click(screen.getByRole("button", { name: "\u53d1\u8868\u8bc4\u8bba" }));
    await waitFor(() => {
      expect(screen.getByText("\u6635\u79f0\u4e0d\u80fd\u4e3a\u7a7a")).toBeInTheDocument();
      expect(screen.getByText("\u8bc4\u8bba\u4e0d\u80fd\u4e3a\u7a7a")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("\u6635\u79f0 *"), {
      target: { value: "Alice" }
    });
    fireEvent.change(screen.getByPlaceholderText("\u5199\u4e0b\u4f60\u7684\u8bc4\u8bba... \u652f\u6301 Markdown"), {
      target: { value: "**Hi** from test" }
    });
    fireEvent.click(screen.getByRole("button", { name: "\u53d1\u8868\u8bc4\u8bba" }));

    await waitFor(() => {
      expect(mockedCreateArticleComment).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Hi", { selector: "strong" })).toBeInTheDocument();
    });
  });

  it("handles GitHub login trigger and Telegram placeholder", async () => {
    render(<ArticleComments postSlug="test-post" />);
    await screen.findByText("\u8fd8\u6ca1\u6709\u8bc4\u8bba");

    fireEvent.click(screen.getByRole("button", { name: /Telegram/ }));
    expect(screen.getByText("Telegram \u767b\u5f55\u5373\u5c06\u4e0a\u7ebf")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /GitHub/ }));
    await waitFor(() => {
      expect(mockedSignInWithGitHubForComments).toHaveBeenCalledTimes(1);
    });
  });
});
