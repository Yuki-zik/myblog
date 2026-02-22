export type ArticleCommentStatus = "visible" | "hidden" | "pending";

export type ArticleCommentAuthProvider = "anonymous" | "github" | "telegram" | "unknown";

export interface ArticleComment {
  id: number;
  post_slug: string;
  body_md: string;
  status: ArticleCommentStatus;
  author_id: string;
  author_name: string;
  author_email: string | null;
  author_website: string | null;
  auth_provider: string;
  created_at: string;
}

export interface CreateArticleCommentInput {
  postSlug: string;
  authorName: string;
  authorEmail?: string;
  authorWebsite?: string;
  bodyMd: string;
}

export interface NormalizedArticleCommentInput {
  postSlug: string;
  authorName: string;
  authorEmail: string | null;
  authorWebsite: string | null;
  bodyMd: string;
}

export interface ArticleCommentFieldErrors {
  authorName?: string;
  authorEmail?: string;
  authorWebsite?: string;
  bodyMd?: string;
}

export interface ArticleCommentAuthState {
  userId: string | null;
  provider: ArticleCommentAuthProvider;
  isAnonymous: boolean;
  canPost: boolean;
  label: string;
}
