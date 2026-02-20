import type { CommentTag } from "./types";

export const COMMENT_TAG_LABELS: Record<CommentTag, string> = {
  none: "无标签",
  correction: "纠错",
  question: "追问",
  addition: "补充",
  counterexample: "反例",
  agree: "赞同"
};

export const QUICK_TAGS: Exclude<CommentTag, "none">[] = [
  "correction",
  "question",
  "addition",
  "counterexample",
  "agree"
];

export const COMMENT_MAX_LEN_DEFAULT = 200;
