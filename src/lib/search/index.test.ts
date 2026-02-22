import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import type { SearchIndexItem } from "./index";
import { buildSearchIndex, scoreSearchMatch, searchIndexItems } from "./index";

function createPost(
  slug: string,
  overrides: Partial<CollectionEntry<"posts">["data"]> = {}
): CollectionEntry<"posts"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "posts",
    data: {
      title: slug,
      date: "2026-02-20T11:00:00+08:00",
      topics: ["knowledge-network"],
      draft: false,
      ...overrides
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"posts">;
}

function createTopic(
  slug: string,
  overrides: Partial<CollectionEntry<"topics">["data"]> = {}
): CollectionEntry<"topics"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "topics",
    data: {
      title: slug,
      summary: "topic summary",
      why: "why",
      ...overrides
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"topics">;
}

function createConcept(
  slug: string,
  overrides: Partial<CollectionEntry<"concepts">["data"]> = {}
): CollectionEntry<"concepts"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "concepts",
    data: {
      title: slug,
      summary: "concept summary",
      ...overrides
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"concepts">;
}

describe("search index helpers", () => {
  it("builds a unified index for posts, topics, and concepts and skips drafts", () => {
    const index = buildSearchIndex(
      [
        createPost("published-post", { title: "Published", topics: ["t1"], concepts: ["c1"] }),
        createPost("draft-post", { title: "Draft", draft: true })
      ],
      [createTopic("knowledge-network", { title: "知识网络", relatedTopics: ["note"] })],
      [createConcept("anchor-id", { title: "Anchor ID", tags: ["markdown"] })]
    );

    expect(index).toHaveLength(3);
    expect(index.find((item) => item.url === "/posts/published-post")).toMatchObject({
      type: "post",
      title: "Published",
      keywords: ["t1", "c1"]
    });
    expect(index.find((item) => item.url === "/topics/knowledge-network")?.type).toBe("topic");
    expect(index.find((item) => item.url === "/concepts/anchor-id")?.type).toBe("concept");
    expect(index.some((item) => item.title === "Draft")).toBe(false);
  });

  it("scores title prefix matches higher than summary matches", () => {
    const titleMatch: SearchIndexItem = {
      type: "post",
      title: "Feed 内容策略",
      url: "/posts/feed",
      summary: "这是摘要",
      keywords: []
    };

    const summaryMatch: SearchIndexItem = {
      type: "post",
      title: "阅读策略",
      url: "/posts/read",
      summary: "这里提到了 feed 内容",
      keywords: []
    };

    expect(scoreSearchMatch(titleMatch, "feed")).toBeGreaterThan(scoreSearchMatch(summaryMatch, "feed"));
  });

  it("matches keywords and applies stable type priority for ties", () => {
    const items: SearchIndexItem[] = [
      {
        type: "concept",
        title: "Anchor ID",
        url: "/concepts/anchor-id",
        summary: "stable ids",
        keywords: ["feed"]
      },
      {
        type: "topic",
        title: "阅读策略",
        url: "/topics/feed-reading",
        summary: "场景说明",
        keywords: ["feed"]
      },
      {
        type: "post",
        title: "看内容的时机",
        url: "/posts/feed-timing",
        summary: "summary",
        keywords: ["feed"]
      }
    ];

    const results = searchIndexItems(items, "feed", 10);

    expect(results.map((item) => item.url)).toEqual([
      "/posts/feed-timing",
      "/topics/feed-reading",
      "/concepts/anchor-id"
    ]);
  });
});
