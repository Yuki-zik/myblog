type PostReadingTimeSource = {
  body?: string | null;
  data: {
    readingTime?: number | null;
  };
};

export function estimateHybridReadingMinutes(body: string): number {
  const chineseChars = (body.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const latinWords = (body.replace(/[\u4e00-\u9fff]/g, " ").match(/\b\w+\b/g) ?? []).length;

  return Math.max(1, Math.round(chineseChars / 220 + latinWords / 250));
}

export function getPostReadingMinutes(post: PostReadingTimeSource): number {
  if (typeof post.data.readingTime === "number" && Number.isFinite(post.data.readingTime)) {
    return Math.max(1, Math.round(post.data.readingTime));
  }

  return estimateHybridReadingMinutes(post.body ?? "");
}
