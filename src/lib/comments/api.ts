import { getSupabaseClient } from "../supabaseClient";
import { isRequireApprovalEnabled, normalizeCommentBody, validateCommentBody } from "./validation";
import type { Comment, CreateCommentInput } from "./types";

interface InsertCommentRow {
  post_slug: string;
  anchor_id: string;
  body: string;
  tag: CreateCommentInput["tag"];
  status: Comment["status"];
  author_id: string;
}

export async function ensureAnonymousSession(): Promise<{ userId: string }> {
  const supabase = getSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`获取会话失败：${sessionError.message}`);
  }

  const existingUserId = sessionData.session?.user?.id;
  if (existingUserId) {
    return { userId: existingUserId };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    throw new Error(`匿名登录失败：${error.message}`);
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("匿名登录成功但未获得用户 ID");
  }

  return { userId };
}

export async function fetchVisibleComments(postSlug: string): Promise<Comment[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .select("id, post_slug, anchor_id, body, tag, status, author_id, created_at")
    .eq("post_slug", postSlug)
    .eq("status", "visible")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`加载评论失败：${error.message}`);
  }

  return (data as Comment[]) ?? [];
}

export async function createComment(input: CreateCommentInput): Promise<Comment> {
  const normalizedBody = normalizeCommentBody(input.body);
  const bodyError = validateCommentBody(normalizedBody);
  if (bodyError) {
    throw new Error(bodyError);
  }

  const { userId } = await ensureAnonymousSession();
  const status: Comment["status"] = isRequireApprovalEnabled() ? "pending" : "visible";

  const row: InsertCommentRow = {
    post_slug: input.postSlug,
    anchor_id: input.anchorId,
    body: normalizedBody,
    tag: input.tag,
    status,
    author_id: userId
  };

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("comments")
    .insert(row)
    .select("id, post_slug, anchor_id, body, tag, status, author_id, created_at")
    .single();

  if (error) {
    throw new Error(`提交评论失败：${error.message}`);
  }

  return data as Comment;
}
