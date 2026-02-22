import type { CollectionEntry } from "astro:content";

export type SearchIndexItemType = "post" | "topic" | "concept";

export interface SearchIndexItem {
  type: SearchIndexItemType;
  title: string;
  url: string;
  summary?: string;
  keywords: readonly string[];
  date?: string;
  updated?: string;
}

const TYPE_PRIORITY: Record<SearchIndexItemType, number> = {
  post: 0,
  topic: 1,
  concept: 2
};

function compactStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return;
    }

    if (seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    nextValues.push(trimmed);
  });

  return nextValues;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreSearchMatch(item: SearchIndexItem, queryInput: string): number {
  const query = normalizeSearchText(queryInput);
  if (!query) {
    return -1;
  }

  const title = normalizeSearchText(item.title);
  const summary = normalizeSearchText(item.summary ?? "");
  const keywords = item.keywords.map((keyword) => normalizeSearchText(keyword));

  let score = -1;

  if (title === query) {
    score = Math.max(score, 500);
  }

  if (title.startsWith(query)) {
    score = Math.max(score, 420);
  } else if (title.includes(query)) {
    score = Math.max(score, 340);
  }

  keywords.forEach((keyword) => {
    if (!keyword) {
      return;
    }

    if (keyword === query) {
      score = Math.max(score, 300);
    } else if (keyword.startsWith(query)) {
      score = Math.max(score, 260);
    } else if (keyword.includes(query)) {
      score = Math.max(score, 220);
    }
  });

  if (summary.includes(query)) {
    score = Math.max(score, 140);
  }

  return score;
}

export function searchIndexItems(
  items: SearchIndexItem[],
  queryInput: string,
  limit = 8
): SearchIndexItem[] {
  const query = normalizeSearchText(queryInput);
  if (!query) {
    return [];
  }

  return items
    .map((item) => ({
      item,
      score: scoreSearchMatch(item, query)
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const typeDiff = TYPE_PRIORITY[a.item.type] - TYPE_PRIORITY[b.item.type];
      if (typeDiff !== 0) {
        return typeDiff;
      }

      if (a.item.type === "post" && b.item.type === "post") {
        const aDate = a.item.updated ?? a.item.date ?? "";
        const bDate = b.item.updated ?? b.item.date ?? "";
        if (aDate !== bDate) {
          return bDate.localeCompare(aDate);
        }
      }

      return a.item.title.localeCompare(b.item.title, "zh-CN");
    })
    .slice(0, Math.max(limit, 0))
    .map((entry) => entry.item);
}

export function buildSearchIndex(
  posts: CollectionEntry<"posts">[],
  topics: CollectionEntry<"topics">[],
  concepts: CollectionEntry<"concepts">[]
): SearchIndexItem[] {
  const postItems: SearchIndexItem[] = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      type: "post",
      title: post.data.title,
      url: `/posts/${post.slug}`,
      summary: post.data.summary,
      keywords: compactStrings([...(post.data.topics ?? []), ...(post.data.concepts ?? [])]),
      date: post.data.date,
      updated: post.data.updated
    }));

  const topicItems: SearchIndexItem[] = topics.map((topic) => ({
    type: "topic",
    title: topic.data.title,
    url: `/topics/${topic.slug}`,
    summary: topic.data.summary,
    keywords: compactStrings([...(topic.data.relatedTopics ?? []), ...(topic.data.entryPosts ?? [])])
  }));

  const conceptItems: SearchIndexItem[] = concepts.map((concept) => ({
    type: "concept",
    title: concept.data.title,
    url: `/concepts/${concept.slug}`,
    summary: concept.data.summary,
    keywords: compactStrings([...(concept.data.tags ?? []), ...(concept.data.related ?? [])])
  }));

  return [...postItems, ...topicItems, ...conceptItems];
}
