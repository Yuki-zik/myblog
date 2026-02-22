import { getSupabaseClient } from "../supabaseClient";
import { ensureAnonymousSession } from "../comments/api";
import { isRequireApprovalEnabled } from "../comments/validation";
import {
  normalizeArticleCommentInput,
  validateArticleCommentInput
} from "./validation";
import type {
  ArticleComment,
  ArticleCommentAuthProvider,
  ArticleCommentAuthState,
  CreateArticleCommentInput
} from "./types";

interface InsertArticleCommentRow {
  post_slug: string;
  body_md: string;
  status: ArticleComment["status"];
  author_id: string;
  author_name: string;
  author_email: string | null;
  author_website: string | null;
  auth_provider: string;
}

const ARTICLE_COMMENT_COLUMNS =
  "id, post_slug, body_md, status, author_id, author_name, author_email, author_website, auth_provider, created_at";

function toProvider(value: string | undefined, isAnonymous = false): ArticleCommentAuthProvider {
  if (isAnonymous) {
    return "anonymous";
  }

  if (value === "github") {
    return "github";
  }

  if (value === "telegram") {
    return "telegram";
  }

  if (value === "anonymous") {
    return "anonymous";
  }

  return "unknown";
}

function getProviderLabel(provider: ArticleCommentAuthProvider, isAnonymous: boolean): string {
  if (provider === "github") {
    return "GitHub";
  }
  if (provider === "telegram") {
    return "Telegram";
  }
  if (provider === "anonymous" || isAnonymous) {
    return "\u533f\u540d";
  }

  return "\u5df2\u767b\u5f55";
}

export async function ensureCommentSession(): Promise<{ userId: string }> {
  return ensureAnonymousSession();
}

export async function getCurrentCommentAuthState(): Promise<ArticleCommentAuthState> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`\u83b7\u53d6\u767b\u5f55\u72b6\u6001\u5931\u8d25\uff1a${error.message}`);
  }

  const user = data.session?.user;
  if (!user) {
    return {
      userId: null,
      provider: "anonymous",
      isAnonymous: true,
      canPost: false,
      label: "\u672a\u767b\u5f55"
    };
  }

  const isAnonymous = Boolean(user.user_metadata?.is_anonymous);
  const provider = toProvider(user.app_metadata?.provider as string | undefined, isAnonymous);

  return {
    userId: user.id,
    provider,
    isAnonymous,
    canPost: true,
    label: getProviderLabel(provider, isAnonymous)
  };
}

export async function signInWithGitHubForComments(): Promise<void> {
  const supabase = getSupabaseClient();
  const redirectTo = typeof window !== "undefined" ? window.location.href : undefined;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo
    }
  });

  if (error) {
    throw new Error(`GitHub \u767b\u5f55\u5931\u8d25\uff1a${error.message}`);
  }
}

export async function signOutCommentSession(): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(`\u9000\u51fa\u767b\u5f55\u5931\u8d25\uff1a${error.message}`);
  }
}

export async function fetchVisibleArticleComments(postSlug: string): Promise<ArticleComment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("article_comments")
    .select(ARTICLE_COMMENT_COLUMNS)
    .eq("post_slug", postSlug)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`\u52a0\u8f7d\u8bc4\u8bba\u5931\u8d25\uff1a${error.message}`);
  }

  return (data as ArticleComment[]) ?? [];
}

export async function createArticleComment(input: CreateArticleCommentInput): Promise<ArticleComment> {
  const errors = validateArticleCommentInput(input);
  const firstError = Object.values(errors).find(Boolean);
  if (firstError) {
    throw new Error(firstError);
  }
  const normalized = normalizeArticleCommentInput(input);

  const { userId } = await ensureCommentSession();
  const authState = await getCurrentCommentAuthState();

  const status: ArticleComment["status"] = isRequireApprovalEnabled() ? "pending" : "visible";
  const authProvider =
    authState.provider === "github" || authState.provider === "telegram" ? authState.provider : "anonymous";

  const row: InsertArticleCommentRow = {
    post_slug: normalized.postSlug,
    body_md: normalized.bodyMd,
    status,
    author_id: userId,
    author_name: normalized.authorName,
    author_email: normalized.authorEmail,
    author_website: normalized.authorWebsite,
    auth_provider: authProvider
  };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("article_comments")
    .insert(row)
    .select(ARTICLE_COMMENT_COLUMNS)
    .single();

  if (error) {
    throw new Error(`\u63d0\u4ea4\u8bc4\u8bba\u5931\u8d25\uff1a${error.message}`);
  }

  return data as ArticleComment;
}
