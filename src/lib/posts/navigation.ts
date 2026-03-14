import type { CollectionEntry } from "astro:content";

export interface PostSiblings {
  newerPost: CollectionEntry<"posts"> | null;
  olderPost: CollectionEntry<"posts"> | null;
}

export function sortPostsByDateDesc(posts: CollectionEntry<"posts">[]): CollectionEntry<"posts">[] {
  return [...posts].sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });
}

export function getPostSiblings(
  posts: CollectionEntry<"posts">[],
  currentSlug: string
): PostSiblings {
  const orderedPosts = sortPostsByDateDesc(posts);
  const currentIndex = orderedPosts.findIndex((post) => post.slug === currentSlug);

  if (currentIndex === -1) {
    return {
      newerPost: null,
      olderPost: null
    };
  }

  return {
    newerPost: orderedPosts[currentIndex - 1] ?? null,
    olderPost: orderedPosts[currentIndex + 1] ?? null
  };
}
