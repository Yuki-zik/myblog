import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { collectReferencedTopicsForConcept } from "./concepts";

function createPost(
  slug: string,
  date: string,
  topics: string[],
  concepts: string[] = []
): CollectionEntry<"posts"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "posts",
    data: {
      title: slug,
      date,
      topics,
      concepts,
      draft: false
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"posts">;
}

function createTopic(slug: string, title: string, order?: number): CollectionEntry<"topics"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "topics",
    data: {
      title,
      summary: title,
      why: title,
      order
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"topics">;
}

describe("collectReferencedTopicsForConcept", () => {
  it("collects real topic backlinks from referenced posts and sorts by order then title", () => {
    const posts = [
      createPost(
        "paragraph-anchor-design",
        "2026-02-20T11:00:00+08:00",
        ["paragraph-review", "knowledge-network"],
        ["anchor-id"]
      ),
      createPost("why-topic-first", "2026-01-05T09:00:00+08:00", ["knowledge-network"], ["anchor-id"]),
      createPost("other-post", "2026-01-05T09:00:00+08:00", ["ai-coding"], ["optimistic-ui"])
    ];
    const topics = [
      createTopic("knowledge-network", "知识网络", 3),
      createTopic("paragraph-review", "段落级短评", 2),
      createTopic("ai-coding", "AI Coding", 1)
    ];

    const referencedTopics = collectReferencedTopicsForConcept("anchor-id", posts, topics);

    expect(referencedTopics.map((topic) => topic.slug)).toEqual([
      "paragraph-review",
      "knowledge-network"
    ]);
  });
});
