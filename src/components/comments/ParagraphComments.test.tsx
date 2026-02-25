import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ParagraphComments from "./ParagraphComments";
import type { Comment } from "../../lib/comments/types";

vi.mock("../../lib/comments/api", () => ({
  fetchVisibleComments: vi.fn(),
  ensureAnonymousSession: vi.fn(),
  createComment: vi.fn()
}));

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
      <p id="c-root::p1" data-anchor="root::p1">First paragraph.</p>
      <p id="c-root::p2" data-anchor="root::p2">Second paragraph.</p>
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

async function getBubble(anchorId = "root::p1") {
  return await waitFor(() => {
    const bubble = document.querySelector(`p[data-anchor="${anchorId}"] .comment-bubble`);
    expect(bubble).toBeTruthy();
    return bubble as HTMLButtonElement;
  });
}

async function getPanelTextarea(container?: ParentNode) {
  return await waitFor(() => {
    const textarea = (container ?? document).querySelector("textarea");
    expect(textarea).toBeTruthy();
    return textarea as HTMLTextAreaElement;
  });
}

function clickPanelSubmit(container?: ParentNode) {
  const submit = (container ?? document).querySelector("button.submit") as HTMLButtonElement | null;
  expect(submit).toBeTruthy();
  fireEvent.click(submit as HTMLButtonElement);
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

  it("renders inline bubbles with zero counts initially", async () => {
    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    await waitFor(() => {
      expect(document.querySelectorAll(".comment-bubble")).toHaveLength(2);
    });

    const bubbles = Array.from(document.querySelectorAll(".comment-bubble"));
    expect(bubbles[0]?.textContent ?? "").toContain("0");
    expect(bubbles[1]?.textContent ?? "").toContain("0");
    expect(document.querySelectorAll(".comment-thread-host")).toHaveLength(2);
  });

  it("shows grouped counts after fetch and expands inline thread", async () => {
    mockedFetchVisibleComments.mockResolvedValue([
      makeComment("root::p1", "first", 1),
      makeComment("root::p1", "second", 2)
    ]);

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    const bubble = await getBubble("root::p1");
    await waitFor(() => {
      expect(bubble.textContent ?? "").toContain("2");
    });

    fireEvent.click(bubble);

    await waitFor(() => {
      expect(document.querySelector(".comment-thread-panel")).toBeInTheDocument();
      expect(document.body.textContent).toContain("first");
      expect(document.body.textContent).toContain("second");
    });
  });

  it("keeps created comment after optimistic submit succeeds in inline mode", async () => {
    mockedCreateComment.mockResolvedValue(makeComment("root::p1", "submit ok", 100));

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    const bubble = await getBubble("root::p1");
    fireEvent.click(bubble);

    const textarea = await getPanelTextarea();
    fireEvent.change(textarea, { target: { value: "submit ok" } });
    clickPanelSubmit();

    await waitFor(() => {
      expect(mockedCreateComment).toHaveBeenCalledTimes(1);
      expect(document.body.textContent).toContain("submit ok");
    });
  });

  it("rolls back optimistic comment and shows error in inline mode", async () => {
    mockedCreateComment.mockRejectedValue(new Error("submit failed: network"));

    render(<ParagraphComments postSlug="test-post" />, {
      container: document.querySelector("#test-root") as HTMLElement
    });

    const bubble = await getBubble("root::p1");
    fireEvent.click(bubble);

    const textarea = await getPanelTextarea();
    fireEvent.change(textarea, { target: { value: "will fail" } });
    clickPanelSubmit();

    await waitFor(() => {
      expect(document.body.textContent).toContain("submit failed: network");
    });

    expect(document.querySelectorAll(".comment-item p")).toHaveLength(0);
  });

  it("renders rail mode thread inside component container instead of inline panel host", async () => {
    mockedFetchVisibleComments.mockResolvedValue([makeComment("root::p1", "rail visible", 11)]);

    const container = document.querySelector("#test-root") as HTMLElement;
    render(<ParagraphComments postSlug="test-post" mode="rail" />, { container });

    const bubble = await getBubble("root::p1");
    fireEvent.click(bubble);

    await waitFor(() => {
      expect(container.querySelector(".comment-thread-panel--rail")).toBeInTheDocument();
      expect(container.querySelector(".comment-thread-anchor")?.textContent ?? "").toContain("root / p1");
      expect(container.textContent).toContain("rail visible");
    });

    expect(document.querySelectorAll(".comment-thread-host")).toHaveLength(0);
  });

  it("supports submit success in rail mode", async () => {
    mockedCreateComment.mockResolvedValue(makeComment("root::p1", "rail success", 120));

    const container = document.querySelector("#test-root") as HTMLElement;
    render(<ParagraphComments postSlug="test-post" mode="rail" />, { container });

    const bubble = await getBubble("root::p1");
    fireEvent.click(bubble);

    const textarea = await getPanelTextarea(container);
    fireEvent.change(textarea, { target: { value: "rail success" } });
    clickPanelSubmit(container);

    await waitFor(() => {
      expect(mockedCreateComment).toHaveBeenCalledTimes(1);
      expect(container.textContent).toContain("rail success");
    });
  });

  it("supports submit rollback and error in rail mode", async () => {
    mockedCreateComment.mockRejectedValue(new Error("network fail"));

    const container = document.querySelector("#test-root") as HTMLElement;
    render(<ParagraphComments postSlug="test-post" mode="rail" />, { container });

    const bubble = await getBubble("root::p1");
    fireEvent.click(bubble);

    const textarea = await getPanelTextarea(container);
    fireEvent.change(textarea, { target: { value: "will fail in rail" } });
    clickPanelSubmit(container);

    await waitFor(() => {
      expect(container.textContent).toContain("network fail");
    });

    expect(container.querySelectorAll(".comment-item p")).toHaveLength(0);
  });
});
