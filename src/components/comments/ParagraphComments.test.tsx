import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParagraphComments from "./ParagraphComments";
import type { Comment } from "../../lib/comments/types";

vi.mock("../../lib/comments/api", () => {
  return {
    fetchVisibleComments: vi.fn(),
    ensureAnonymousSession: vi.fn(),
    createComment: vi.fn()
  };
});

import {
  createComment,
  ensureAnonymousSession,
  fetchVisibleComments
} from "../../lib/comments/api";

const mockedFetchVisibleComments = vi.mocked(fetchVisibleComments);
const mockedEnsureAnonymousSession = vi.mocked(ensureAnonymousSession);
const mockedCreateComment = vi.mocked(createComment);

function mountPostHtml() {
  document.body.innerHTML = `
    <article data-post-body>
      <p id="c-root::p1" data-anchor="root::p1">第一段内容</p>
      <p id="c-root::p2" data-anchor="root::p2">第二段内容</p>
    </article>
    <div id="test-root"></div>
  `;
}

function makeComment(anchorId: string, body: string, id = 1): Comment {
  return {
    id,
    post_slug: "test-post",
    anchor_id: anchorId,
    body,
    tag: "none",
    status: "visible",
    author_id: "user-1",
    created_at: "2026-02-20T10:00:00+08:00"
  };
}

describe("ParagraphComments", () => {
  beforeEach(() => {
    mountPostHtml();
    mockedFetchVisibleComments.mockReset();
    mockedEnsureAnonymousSession.mockReset();
    mockedCreateComment.mockReset();
    mockedFetchVisibleComments.mockResolvedValue([]);
    mockedEnsureAnonymousSession.mockResolvedValue({ userId: "anon-uid" });
  });

  it("初始渲染每段显示 💬 0", async () => {
    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /查看本段评论/ })).toHaveLength(2);
    });

    const bubbles = screen.getAllByRole("button", { name: /查看本段评论/ });
    expect(bubbles[0]).toHaveTextContent("💬 0");
    expect(bubbles[1]).toHaveTextContent("💬 0");
  });

  it("拉取评论后按段落显示计数，并可展开 thread", async () => {
    mockedFetchVisibleComments.mockResolvedValue([
      makeComment("root::p1", "第一条", 1),
      makeComment("root::p1", "第二条", 2)
    ]);

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    await waitFor(() => {
      const firstBubble = document.querySelector(
        'p[data-anchor="root::p1"] .comment-bubble'
      ) as HTMLButtonElement;
      expect(firstBubble).toHaveTextContent("💬 2");
    });

    const firstBubble = document.querySelector(
      'p[data-anchor="root::p1"] .comment-bubble'
    ) as HTMLButtonElement;
    fireEvent.click(firstBubble);

    await waitFor(() => {
      expect(screen.getByText("第一条")).toBeInTheDocument();
      expect(screen.getByText("第二条")).toBeInTheDocument();
    });
  });

  it("提交短评：乐观更新成功后保留评论", async () => {
    mockedCreateComment.mockResolvedValue(makeComment("root::p1", "提交成功", 100));

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    const firstBubble = await waitFor(() =>
      document.querySelector('p[data-anchor="root::p1"] .comment-bubble')
    );
    fireEvent.click(firstBubble as Element);

    const textarea = await screen.findByPlaceholderText("写下你的短评（最多 200 字）");
    fireEvent.change(textarea, { target: { value: "提交成功" } });
    fireEvent.click(screen.getByRole("button", { name: "提交短评" }));

    await waitFor(() => {
      expect(mockedCreateComment).toHaveBeenCalledTimes(1);
      expect(screen.getByText("提交成功")).toBeInTheDocument();
    });
  });

  it("提交失败时回滚乐观更新并显示错误", async () => {
    mockedCreateComment.mockRejectedValue(new Error("提交评论失败：network"));

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    const firstBubble = await waitFor(() =>
      document.querySelector('p[data-anchor="root::p1"] .comment-bubble')
    );
    fireEvent.click(firstBubble as Element);

    const textarea = await screen.findByPlaceholderText("写下你的短评（最多 200 字）");
    fireEvent.change(textarea, { target: { value: "会失败的评论" } });
    fireEvent.click(screen.getByRole("button", { name: "提交短评" }));

    await waitFor(() => {
      expect(screen.getByText("提交评论失败：network")).toBeInTheDocument();
      expect(screen.queryAllByText("会失败的评论", { selector: ".comment-item p" })).toHaveLength(0);
    });
  });
});
