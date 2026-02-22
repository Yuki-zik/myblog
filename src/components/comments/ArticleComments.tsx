import React, { useEffect, useState } from "react";
import type { FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import {
  createArticleComment,
  ensureCommentSession,
  fetchVisibleArticleComments,
  getCurrentCommentAuthState,
  signInWithGitHubForComments
} from "../../lib/articleComments/api";
import type {
  ArticleComment,
  ArticleCommentAuthState,
  ArticleCommentFieldErrors,
  CreateArticleCommentInput
} from "../../lib/articleComments/types";
import {
  getArticleCommentMaxLen,
  validateArticleCommentInput
} from "../../lib/articleComments/validation";
import { isRequireApprovalEnabled } from "../../lib/comments/validation";

interface ArticleCommentsProps {
  postSlug: string;
}

interface FormState {
  authorName: string;
  authorEmail: string;
  authorWebsite: string;
  bodyMd: string;
}

const DEFAULT_AUTH_STATE: ArticleCommentAuthState = {
  userId: null,
  provider: "anonymous",
  isAnonymous: true,
  canPost: false,
  label: "\u533f\u540d"
};

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

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function providerBadgeLabel(provider: string): string {
  if (provider === "github") {
    return "GitHub";
  }
  if (provider === "telegram") {
    return "Telegram";
  }
  return "\u533f\u540d";
}

export default function ArticleComments({ postSlug }: ArticleCommentsProps) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [authState, setAuthState] = useState<ArticleCommentAuthState>(DEFAULT_AUTH_STATE);
  const [form, setForm] = useState<FormState>({
    authorName: "",
    authorEmail: "",
    authorWebsite: "",
    bodyMd: ""
  });
  const [fieldErrors, setFieldErrors] = useState<ArticleCommentFieldErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  const maxLen = getArticleCommentMaxLen();
  const requireApproval = isRequireApprovalEnabled();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setGlobalError("");

      try {
        await ensureCommentSession();
      } catch (error) {
        if (!cancelled) {
          setGlobalError(
            toErrorMessage(error, "\u533f\u540d\u4f1a\u8bdd\u521d\u59cb\u5316\u5931\u8d25\uff0c\u8bf7\u5237\u65b0\u91cd\u8bd5")
          );
        }
      }

      try {
        const [nextComments, nextAuthState] = await Promise.all([
          fetchVisibleArticleComments(postSlug),
          getCurrentCommentAuthState()
        ]);

        if (!cancelled) {
          setComments(nextComments);
          setAuthState(nextAuthState);
        }
      } catch (error) {
        if (!cancelled) {
          setGlobalError(
            toErrorMessage(error, "\u52a0\u8f7d\u5168\u6587\u8bc4\u8bba\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [postSlug]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key === "bodyMd" ? "bodyMd" : key]: undefined }));
    setInfoMessage("");
  }

  async function refreshAuthState() {
    try {
      const nextAuth = await getCurrentCommentAuthState();
      setAuthState(nextAuth);
    } catch {
      // ignore auth-state refresh errors; submit/load paths already surface errors
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) {
      return;
    }

    setGlobalError("");
    setInfoMessage("");

    const payload: CreateArticleCommentInput = {
      postSlug,
      authorName: form.authorName,
      authorEmail: form.authorEmail,
      authorWebsite: form.authorWebsite,
      bodyMd: form.bodyMd
    };

    const errors = validateArticleCommentInput(payload, maxLen);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const created = await createArticleComment(payload);

      if (created.status === "visible") {
        setComments((prev) => [...prev, created]);
        setInfoMessage("\u8bc4\u8bba\u53d1\u8868\u6210\u529f");
      } else {
        setInfoMessage("\u8bc4\u8bba\u5df2\u63d0\u4ea4\uff0c\u7b49\u5f85\u5ba1\u6838\u540e\u5c55\u793a");
      }

      setForm((prev) => ({
        ...prev,
        bodyMd: ""
      }));

      await refreshAuthState();
    } catch (error) {
      setGlobalError(toErrorMessage(error, "\u63d0\u4ea4\u8bc4\u8bba\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGitHubLogin() {
    if (authBusy) {
      return;
    }

    setAuthBusy(true);
    setGlobalError("");
    setInfoMessage("\u6b63\u5728\u8df3\u8f6c\u5230 GitHub \u767b\u5f55...");

    try {
      await signInWithGitHubForComments();
    } catch (error) {
      setInfoMessage("");
      setGlobalError(
        toErrorMessage(error, "GitHub \u767b\u5f55\u5931\u8d25\uff0c\u4f60\u4ecd\u53ef\u4ee5\u4f7f\u7528\u533f\u540d\u8bc4\u8bba")
      );
      setAuthBusy(false);
      return;
    }
  }

  function handleTelegramPlaceholder() {
    setInfoMessage("Telegram \u767b\u5f55\u5373\u5c06\u4e0a\u7ebf");
    setGlobalError("");
  }

  const canSubmit = !submitting && !loading;

  return (
    <section className="article-comments" aria-label="\u6587\u7ae0\u5e95\u90e8\u8bc4\u8bba">
      <div className="article-comments-divider" aria-hidden="true" />

      <div className="article-comments-shell">
        <header className="article-comments-header">
          <h2 className="article-comments-title">{"\u8bc4\u8bba"}</h2>
        </header>

        <div className="article-comments-body">
          <div className="article-comments-list-wrap">
            {loading ? (
              <div className="article-comments-empty" data-article-comments-empty>
                <div className="article-comments-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      d="M7 17.5V19a1 1 0 0 0 1.7.7l2.4-2.4a1 1 0 0 1 .7-.3H17a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7A2 2 0 0 0 5 7v8a2 2 0 0 0 2 2.5Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="article-comments-empty-title">{"\u6b63\u5728\u52a0\u8f7d\u8bc4\u8bba"}</p>
                <p className="article-comments-empty-subtle">{"\u8bf7\u7a0d\u5019..."}</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="article-comments-empty" data-article-comments-empty>
                <div className="article-comments-empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path
                      d="M7 17.5V19a1 1 0 0 0 1.7.7l2.4-2.4a1 1 0 0 1 .7-.3H17a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H7A2 2 0 0 0 5 7v8a2 2 0 0 0 2 2.5Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="article-comments-empty-title">{"\u8fd8\u6ca1\u6709\u8bc4\u8bba"}</p>
                <p className="article-comments-empty-subtle">{"\u6765\u53d1\u8868\u7b2c\u4e00\u6761\u5427"}</p>
              </div>
            ) : (
              <ul className="article-comments-list" data-article-comments-list>
                {comments.map((comment) => (
                  <li key={comment.id} className="article-comment-item">
                    <div className="article-comment-meta">
                      <div className="article-comment-author-row">
                        {comment.author_website ? (
                          <a
                            href={comment.author_website}
                            className="article-comment-author"
                            target="_blank"
                            rel="nofollow ugc noopener noreferrer"
                          >
                            {comment.author_name}
                          </a>
                        ) : (
                          <span className="article-comment-author">{comment.author_name}</span>
                        )}
                        <span className="article-comment-provider">
                          {providerBadgeLabel(comment.auth_provider)}
                        </span>
                      </div>
                      <time className="article-comment-time" dateTime={comment.created_at}>
                        {formatTime(comment.created_at)}
                      </time>
                    </div>
                    <div className="article-comment-markdown">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeSanitize]}
                        skipHtml
                        components={{
                          a: ({ href, children, ...props }) => (
                            <a
                              {...props}
                              href={href}
                              target="_blank"
                              rel="nofollow ugc noopener noreferrer"
                            >
                              {children}
                            </a>
                          ),
                          img: () => null
                        }}
                      >
                        {comment.body_md}
                      </ReactMarkdown>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form className="article-comments-form" onSubmit={handleSubmit} noValidate>
            <div className="article-comments-grid">
              <label className="article-comments-field">
                <span className="article-comments-sr-only">{"\u6635\u79f0"}</span>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(event) => updateField("authorName", event.currentTarget.value)}
                  placeholder={"\u6635\u79f0 *"}
                  maxLength={40}
                  autoComplete="nickname"
                  aria-invalid={fieldErrors.authorName ? "true" : "false"}
                />
                {fieldErrors.authorName ? (
                  <small className="article-comments-field-error">{fieldErrors.authorName}</small>
                ) : null}
              </label>

              <label className="article-comments-field">
                <span className="article-comments-sr-only">{"\u90ae\u7bb1"}</span>
                <input
                  type="email"
                  value={form.authorEmail}
                  onChange={(event) => updateField("authorEmail", event.currentTarget.value)}
                  placeholder={"\u90ae\u7bb1\uff08\u9009\u586b\uff0c\u7528\u4e8e\u5934\u50cf\uff09"}
                  autoComplete="email"
                  aria-invalid={fieldErrors.authorEmail ? "true" : "false"}
                />
                {fieldErrors.authorEmail ? (
                  <small className="article-comments-field-error">{fieldErrors.authorEmail}</small>
                ) : null}
              </label>

              <label className="article-comments-field">
                <span className="article-comments-sr-only">{"\u7f51\u7ad9"}</span>
                <input
                  type="url"
                  value={form.authorWebsite}
                  onChange={(event) => updateField("authorWebsite", event.currentTarget.value)}
                  placeholder={"\u7f51\u7ad9\uff08\u9009\u586b\uff09"}
                  autoComplete="url"
                  aria-invalid={fieldErrors.authorWebsite ? "true" : "false"}
                />
                {fieldErrors.authorWebsite ? (
                  <small className="article-comments-field-error">{fieldErrors.authorWebsite}</small>
                ) : null}
              </label>
            </div>

            <label className="article-comments-textarea-field">
              <span className="article-comments-sr-only">{"\u8bc4\u8bba\u5185\u5bb9"}</span>
              <textarea
                value={form.bodyMd}
                onChange={(event) => updateField("bodyMd", event.currentTarget.value)}
                placeholder={"\u5199\u4e0b\u4f60\u7684\u8bc4\u8bba... \u652f\u6301 Markdown"}
                rows={7}
                maxLength={maxLen}
                aria-invalid={fieldErrors.bodyMd ? "true" : "false"}
              />
              {fieldErrors.bodyMd ? (
                <small className="article-comments-field-error">{fieldErrors.bodyMd}</small>
              ) : null}
            </label>

            <div className="article-comments-toolbar">
              <div className="article-comments-toolbar-left">
                <span className="article-comments-markdown-hint">
                  {"\u652f\u6301 Markdown \u8bed\u6cd5"}
                </span>
                <span className="article-comments-counter">
                  {form.bodyMd.trim().length}/{maxLen}
                </span>
              </div>

              <div className="article-comments-toolbar-right">
                <div className="article-comments-auth-group" aria-label="\u767b\u5f55\u65b9\u5f0f">
                  <button
                    type="button"
                    className="article-comments-text-login"
                    onClick={handleGitHubLogin}
                    disabled={authBusy}
                  >
                    {"\u767b\u5f55"}
                  </button>

                  <button
                    type="button"
                    className="article-comments-auth-btn article-comments-auth-btn--github"
                    onClick={handleGitHubLogin}
                    disabled={authBusy}
                    aria-label="GitHub \u767b\u5f55"
                  >
                    <span className="article-comments-auth-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.5 0-.25-.01-1.07-.01-1.95-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.5-1.11-1.5-.9-.64.07-.63.07-.63 1 .07 1.52 1.04 1.52 1.04.88 1.55 2.32 1.1 2.89.83.09-.66.34-1.1.62-1.35-2.22-.26-4.55-1.15-4.55-5.09 0-1.13.39-2.05 1.03-2.78-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.06A9.32 9.32 0 0 1 12 6.9c.85 0 1.71.12 2.5.35 1.9-1.33 2.74-1.06 2.74-1.06.55 1.43.2 2.49.1 2.75.64.73 1.03 1.66 1.03 2.78 0 3.96-2.34 4.83-4.57 5.08.36.32.68.95.68 1.92 0 1.38-.01 2.49-.01 2.83 0 .28.18.6.69.5A10.25 10.25 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" />
                      </svg>
                    </span>
                    <span>GitHub</span>
                  </button>

                  <button
                    type="button"
                    className="article-comments-auth-btn article-comments-auth-btn--telegram"
                    onClick={handleTelegramPlaceholder}
                    aria-label="Telegram \u767b\u5f55\uff08\u5373\u5c06\u4e0a\u7ebf\uff09"
                  >
                    <span className="article-comments-auth-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M9.05 15.54 8.7 20.5c.5 0 .72-.22.97-.48l2.32-2.26 4.81 3.63c.88.49 1.5.23 1.73-.84L21.7 5.2h0c.27-1.32-.47-1.84-1.33-1.52L1.84 10.95c-1.27.5-1.26 1.23-.22 1.55l4.74 1.52L17.37 6.9c.52-.33 1-.15.61.19" />
                      </svg>
                    </span>
                    <span>Telegram</span>
                  </button>
                </div>

                <button type="submit" className="article-comments-submit" disabled={!canSubmit}>
                  {submitting ? "\u53d1\u8868\u4e2d..." : "\u53d1\u8868\u8bc4\u8bba"}
                </button>
              </div>
            </div>

            <div className="article-comments-status-row" aria-live="polite">
              <span className="article-comments-auth-status">
                {`\u5f53\u524d\u8eab\u4efd\uff1a${authState.label}${authState.provider === "github" ? "" : "\uff08\u53ef\u9009 GitHub \u767b\u5f55\uff09"}`}
              </span>
              {requireApproval ? (
                <span className="article-comments-approval-hint">
                  {"\u5f53\u524d\u5df2\u5f00\u542f\u8bc4\u8bba\u5ba1\u6838"}
                </span>
              ) : null}
            </div>

            {infoMessage ? <p className="article-comments-info">{infoMessage}</p> : null}
            {globalError ? <p className="article-comments-error">{globalError}</p> : null}
          </form>
        </div>
      </div>
    </section>
  );
}
