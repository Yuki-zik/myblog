export interface HomePostLike {
  id: string;
  data: {
    date: string;
    cover?: {
      src?: unknown;
    };
  };
}

export function sortHomePostsByDate<T extends HomePostLike>(posts: T[]): T[] {
  return [...posts].sort((left, right) => new Date(right.data.date).getTime() - new Date(left.data.date).getTime());
}

export function pickFeaturedHomePost<T extends HomePostLike>(posts: T[]): T | null {
  const sortedPosts = sortHomePostsByDate(posts);

  return sortedPosts.find((post) => Boolean(post.data.cover?.src)) ?? sortedPosts[0] ?? null;
}

export function pickRecentHomePosts<T extends HomePostLike>(
  posts: T[],
  featuredId?: string,
  limit = 5
): T[] {
  return sortHomePostsByDate(posts)
    .filter((post) => post.id !== featuredId)
    .slice(0, limit);
}
