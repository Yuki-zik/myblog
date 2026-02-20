export type CommentStatus = "visible" | "hidden" | "pending";

export type CommentTag =
  | "none"
  | "correction"
  | "question"
  | "addition"
  | "counterexample"
  | "agree";

export interface Comment {
  id: number;
  post_slug: string;
  anchor_id: string;
  body: string;
  tag: CommentTag;
  status: CommentStatus;
  author_id: string;
  created_at: string;
}

export interface CreateCommentInput {
  postSlug: string;
  anchorId: string;
  body: string;
  tag: CommentTag;
}
