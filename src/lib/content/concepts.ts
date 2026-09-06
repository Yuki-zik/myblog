import type { CollectionEntry } from "astro:content";

export function collectReferencedTopicsForConcept(
  conceptSlug: string,
  posts: CollectionEntry<"posts">[],
  topics: CollectionEntry<"topics">[]
): CollectionEntry<"topics">[] {
  const referencedTopicSlugs = new Set(
    posts
      .filter((post) => (post.data.concepts ?? []).includes(conceptSlug))
      .flatMap((post) => post.data.topics)
  );

  return topics
    .filter((topic) => referencedTopicSlugs.has(topic.id))
    .sort((a, b) => {
      const orderA = a.data.order ?? Number.POSITIVE_INFINITY;
      const orderB = b.data.order ?? Number.POSITIVE_INFINITY;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.data.title.localeCompare(b.data.title, "zh-CN");
    });
}
