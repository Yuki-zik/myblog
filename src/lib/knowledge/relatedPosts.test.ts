import { describe, expect, it } from "vitest";
import { getRelatedPosts, type RelatedPostInput } from "./relatedPosts";

const current: RelatedPostInput = {
  id: "current",
  title: "Current",
  date: "2026-03-01T00:00:00+08:00",
  topics: ["ai-coding", "agent-engineering"],
  concepts: ["anchor-id"]
};

const candidates: RelatedPostInput[] = [
  {
    id: "two-topics",
    title: "Two topics",
    date: "2026-01-01T00:00:00+08:00",
    topics: ["ai-coding", "agent-engineering"],
    concepts: []
  },
  {
    id: "one-topic-one-concept",
    title: "One topic + one concept",
    date: "2026-02-01T00:00:00+08:00",
    topics: ["ai-coding"],
    concepts: ["anchor-id"]
  },
  {
    id: "concept-only",
    title: "Concept only",
    date: "2026-02-15T00:00:00+08:00",
    topics: ["unrelated"],
    concepts: ["anchor-id"]
  },
  {
    id: "unrelated",
    title: "Unrelated",
    date: "2026-02-20T00:00:00+08:00",
    topics: ["exam-review"],
    concepts: []
  }
];

describe("getRelatedPosts", () => {
  it("excludes the current post and anything with no overlap", () => {
    const related = getRelatedPosts(current, [current, ...candidates]);
    const ids = related.map((entry) => entry.id);
    expect(ids).not.toContain("current");
    expect(ids).not.toContain("unrelated");
  });

  it("ranks by score (topic weighted x2 over concept) then by recency", () => {
    const related = getRelatedPosts(current, candidates);
    expect(related.map((entry) => entry.id)).toEqual([
      "two-topics", // 2 topics → score 4
      "one-topic-one-concept", // 1 topic + 1 concept → score 3
      "concept-only" // 1 concept → score 1
    ]);
    expect(related[0].score).toBe(4);
    expect(related[0].sharedTopicCount).toBe(2);
  });

  it("respects the limit", () => {
    expect(getRelatedPosts(current, candidates, 1)).toHaveLength(1);
    expect(getRelatedPosts(current, candidates, 0)).toHaveLength(0);
  });

  it("tie-breaks equal scores by newer date first", () => {
    const a: RelatedPostInput = {
      id: "older",
      title: "Older",
      date: "2026-01-01T00:00:00+08:00",
      topics: ["ai-coding"]
    };
    const b: RelatedPostInput = {
      id: "newer",
      title: "Newer",
      date: "2026-05-01T00:00:00+08:00",
      topics: ["ai-coding"]
    };
    expect(getRelatedPosts(current, [a, b]).map((entry) => entry.id)).toEqual(["newer", "older"]);
  });
});
