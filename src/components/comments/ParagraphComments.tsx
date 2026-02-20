import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  createComment,
  ensureAnonymousSession,
  fetchVisibleComments
} from "../../lib/comments/api";
import { COMMENT_TAG_LABELS, QUICK_TAGS } from "../../lib/comments/constants";
import type { Comment, CommentTag } from "../../lib/comments/types";
import {
  getCommentMaxLen,
  isRequireApprovalEnabled,
  normalizeCommentBody,
  validateCommentBody
} from "../../lib/comments/validation";

interface ParagraphCommentsProps {
  postSlug: string;
  rootSelector?: string;
}

interface AnchorTarget {
  anchorId: string;
  bubbleHost: HTMLSpanElement;
  panelHost: HTMLDivElement;
}

interface OptimisticComment extends Comment {
  __optimistic?: true;
}

type CommentsByAnchor = Record<string, OptimisticComment[]>;
type StringByAnchor = Record<string, string>;
type TagByAnchor = Record<string, CommentTag>;

function toErrorMessage(error: unknown, fallback = "操作失败，请稍后重试"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function groupCommentsByAnchor(comments: Comment[]): CommentsByAnchor {
  return comments.reduce<CommentsByAnchor>((acc, comment) => {
    acc[comment.anchor_id] ??= [];
    acc[comment.anchor_id].push(comment);
    return acc;
  }, {});
}

function appendComment(
  prev: CommentsByAnchor,
  anchorId: string,
  comment: OptimisticComment
): CommentsByAnchor {
  return {
    ...prev,
    [anchorId]: [...(prev[anchorId] ?? []), comment]
  };
}

function replaceComment(
  prev: CommentsByAnchor,
  anchorId: string,
  temporaryId: number,
  next: OptimisticComment | null
): CommentsByAnchor {
  const current = prev[anchorId] ?? [];
  const withoutTemp = current.filter((item) => item.id !== temporaryId);

  return {
    ...prev,
    [anchorId]: next ? [...withoutTemp, next] : withoutTemp
  };
}

function getCommentCount(comments: OptimisticComment[]): number {
  return comments.filter((item) => item.status === "visible").length;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default function ParagraphComments({
  postSlug,
  rootSelector = "[data-post-body]"
}: ParagraphCommentsProps) {
  const [anchors, setAnchors] = useState<AnchorTarget[]>([]);
  const [commentsByAnchor, setCommentsByAnchor] = useState<CommentsByAnchor>({});
  const [draftByAnchor, setDraftByAnchor] = useState<StringByAnchor>({});
  const [tagByAnchor, setTagByAnchor] = useState<TagByAnchor>({});
  const [errorByAnchor, setErrorByAnchor] = useState<StringByAnchor>({});
  const [infoByAnchor, setInfoByAnchor] = useState<StringByAnchor>({});
  const [expandedAnchorId, setExpandedAnchorId] = useState<string | null>(null);
  const [loadingError, setLoadingError] = useState<string>("");
  const [submittingAnchorIds, setSubmittingAnchorIds] = useState<Set<string>>(new Set());

  const maxLen = useMemo(() => getCommentMaxLen(), []);
  const requireApproval = useMemo(() => isRequireApprovalEnabled(), []);

  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) {
      setLoadingError("未找到文章正文容器，评论入口未挂载。");
      return;
    }

    const paragraphElements = Array.from(
      root.querySelectorAll<HTMLParagraphElement>("p[data-anchor]")
    );

    const targets: AnchorTarget[] = [];
    paragraphElements.forEach((paragraph) => {
      const anchorId = paragraph.dataset.anchor;
      if (!anchorId) {
        return;
      }

      const bubbleHost = document.createElement("span");
      bubbleHost.className = "comment-bubble-host";
      bubbleHost.dataset.anchorHost = anchorId;
      paragraph.appendChild(bubbleHost);

      const panelHost = document.createElement("div");
      panelHost.className = "comment-thread-host";
      panelHost.dataset.anchorThread = anchorId;
      paragraph.insertAdjacentElement("afterend", panelHost);

      targets.push({
        anchorId,
        bubbleHost,
        panelHost
      });
    });

    setAnchors(targets);

    return () => {
      targets.forEach(({ bubbleHost, panelHost }) => {
        bubbleHost.remove();
        panelHost.remove();
      });
    };
  }, [rootSelector]);

  useEffect(() => {
    let cancelled = false;

    async function warmupSession() {
      try {
        await ensureAnonymousSession();
      } catch (error) {
        if (!cancelled) {
          setLoadingError(toErrorMessage(error, "匿名身份初始化失败，请刷新后重试。"));
        }
      }
    }

    async function loadComments() {
      try {
        const data = await fetchVisibleComments(postSlug);
        if (!cancelled) {
          setCommentsByAnchor(groupCommentsByAnchor(data));
        }
      } catch (error) {
        if (!cancelled) {
          setLoadingError(toErrorMessage(error, "评论加载失败，请刷新重试。"));
        }
      }
    }

    warmupSession();
    loadComments();

    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  function toggleThread(anchorId: string) {
    setExpandedAnchorId((current) => (current === anchorId ? null : anchorId));
    setErrorByAnchor((prev) => ({ ...prev, [anchorId]: "" }));
    setInfoByAnchor((prev) => ({ ...prev, [anchorId]: "" }));
  }

  function setDraft(anchorId: string, value: string) {
    setDraftByAnchor((prev) => ({
      ...prev,
      [anchorId]: value
    }));
  }

  function setTag(anchorId: string, tag: CommentTag) {
    setTagByAnchor((prev) => ({
      ...prev,
      [anchorId]: tag
    }));
  }

  async function submitComment(anchorId: string) {
    if (submittingAnchorIds.has(anchorId)) {
      return;
    }

    const draft = draftByAnchor[anchorId] ?? "";
    const validationError = validateCommentBody(draft, maxLen);
    if (validationError) {
      setErrorByAnchor((prev) => ({
        ...prev,
        [anchorId]: validationError
      }));
      return;
    }

    const normalizedBody = normalizeCommentBody(draft);
    const tag = tagByAnchor[anchorId] ?? "none";
    const temporaryId = -Math.floor(Date.now() + Math.random() * 1000);
    const now = new Date().toISOString();

    setErrorByAnchor((prev) => ({ ...prev, [anchorId]: "" }));
    setInfoByAnchor((prev) => ({ ...prev, [anchorId]: "" }));
    setSubmittingAnchorIds((prev) => new Set(prev).add(anchorId));
    setDraftByAnchor((prev) => ({ ...prev, [anchorId]: "" }));

    try {
      const { userId } = await ensureAnonymousSession();
      const optimistic: OptimisticComment = {
        id: temporaryId,
        post_slug: postSlug,
        anchor_id: anchorId,
        body: normalizedBody,
        tag,
        status: requireApproval ? "pending" : "visible",
        author_id: userId,
        created_at: now,
        __optimistic: true
      };

      setCommentsByAnchor((prev) => appendComment(prev, anchorId, optimistic));

      const created = await createComment({
        postSlug,
        anchorId,
        body: normalizedBody,
        tag
      });

      if (created.status === "visible") {
        setCommentsByAnchor((prev) => replaceComment(prev, anchorId, temporaryId, created));
      } else {
        setCommentsByAnchor((prev) => replaceComment(prev, anchorId, temporaryId, null));
        setInfoByAnchor((prev) => ({
          ...prev,
          [anchorId]: "评论已提交，等待审核通过后展示。"
        }));
      }
    } catch (error) {
      setCommentsByAnchor((prev) => replaceComment(prev, anchorId, temporaryId, null));
      setDraftByAnchor((prev) => ({ ...prev, [anchorId]: normalizedBody }));
      setErrorByAnchor((prev) => ({
        ...prev,
        [anchorId]: toErrorMessage(error, "提交失败，请稍后重试。")
      }));
    } finally {
      setSubmittingAnchorIds((prev) => {
        const next = new Set(prev);
        next.delete(anchorId);
        return next;
      });
    }
  }

  return (
    <>
      {loadingError ? <p className="comments-global-error">{loadingError}</p> : null}
      {anchors.map((anchor) => {
        const comments = commentsByAnchor[anchor.anchorId] ?? [];
        const visibleComments = comments.filter((item) => item.status === "visible");
        const count = getCommentCount(comments);
        const expanded = expandedAnchorId === anchor.anchorId;
        const draft = draftByAnchor[anchor.anchorId] ?? "";
        const selectedTag = tagByAnchor[anchor.anchorId] ?? "none";
        const currentError = errorByAnchor[anchor.anchorId] ?? "";
        const currentInfo = infoByAnchor[anchor.anchorId] ?? "";
        const isSubmitting = submittingAnchorIds.has(anchor.anchorId);

        const bubble = (
          <button
            type="button"
            className="comment-bubble"
            aria-label={`查看本段评论（${count} 条）`}
            onClick={() => toggleThread(anchor.anchorId)}
          >
            <span aria-hidden="true">💬 {count}</span>
          </button>
        );

        const panel = expanded ? (
          <section className="comment-thread-panel" aria-label="段落短评">
            <div className="comment-thread-header">
              <strong>段落短评</strong>
              <span>{count} 条</span>
            </div>

            <ul className="comment-list">
              {visibleComments.length === 0 ? (
                <li className="comment-empty">暂无短评，欢迎补充。</li>
              ) : (
                visibleComments.map((comment) => (
                  <li key={comment.id} className={comment.__optimistic ? "comment-item optimistic" : "comment-item"}>
                    <p>{comment.body}</p>
                    <div className="comment-meta">
                      <span>{COMMENT_TAG_LABELS[comment.tag]}</span>
                      <time dateTime={comment.created_at}>{formatTime(comment.created_at)}</time>
                    </div>
                  </li>
                ))
              )}
            </ul>

            <div className="comment-tag-group" role="radiogroup" aria-label="评论标签">
              <button
                type="button"
                className={selectedTag === "none" ? "tag active" : "tag"}
                onClick={() => setTag(anchor.anchorId, "none")}
              >
                无标签
              </button>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={selectedTag === tag ? "tag active" : "tag"}
                  onClick={() => setTag(anchor.anchorId, tag)}
                >
                  {COMMENT_TAG_LABELS[tag]}
                </button>
              ))}
            </div>

            <label className="comment-input-wrap">
              <span className="sr-only">短评输入框</span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(anchor.anchorId, event.currentTarget.value)}
                maxLength={maxLen}
                rows={3}
                placeholder="写下你的短评（最多 200 字）"
              />
            </label>

            <div className="comment-input-footer">
              <span className="counter">
                {draft.trim().length}/{maxLen}
              </span>
              <button
                type="button"
                className="submit"
                onClick={() => submitComment(anchor.anchorId)}
                disabled={isSubmitting}
              >
                {isSubmitting ? "提交中..." : "提交短评"}
              </button>
            </div>

            {currentInfo ? <p className="comment-info">{currentInfo}</p> : null}
            {currentError ? <p className="comment-error">{currentError}</p> : null}
          </section>
        ) : null;

        return (
          <div key={anchor.anchorId}>
            {createPortal(bubble, anchor.bubbleHost)}
            {createPortal(panel, anchor.panelHost)}
          </div>
        );
      })}
    </>
  );
}
