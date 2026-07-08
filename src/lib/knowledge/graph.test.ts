import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { buildKnowledgeGraph } from "./graph";

function post(id: string, data: Partial<CollectionEntry<"posts">["data"]> = {}) {
  return {
    id,
    body: "",
    collection: "posts",
    data: { title: id, date: "2026-01-01T00:00:00+08:00", topics: [], draft: false, ...data }
  } as unknown as CollectionEntry<"posts">;
}
function topic(id: string, data: Partial<CollectionEntry<"topics">["data"]> = {}) {
  return {
    id,
    body: "",
    collection: "topics",
    data: { title: id, summary: "s", why: "w", ...data }
  } as unknown as CollectionEntry<"topics">;
}
function concept(id: string, data: Partial<CollectionEntry<"concepts">["data"]> = {}) {
  return {
    id,
    body: "",
    collection: "concepts",
    data: { title: id, summary: "s", ...data }
  } as unknown as CollectionEntry<"concepts">;
}

describe("buildKnowledgeGraph", () => {
  it("emits type-prefixed nodes for each collection and skips drafts", () => {
    const { nodes } = buildKnowledgeGraph(
      [post("p1", { topics: ["t1"] }), post("draft", { draft: true })],
      [topic("t1")],
      [concept("c1")]
    );
    const ids = nodes.map((n) => n.id).sort();
    expect(ids).toEqual(["concept:c1", "post:p1", "topic:t1"]);
    expect(nodes.find((n) => n.id === "post:p1")).toMatchObject({ type: "post", url: "/posts/p1" });
  });

  it("links posts to their topics and concepts", () => {
    const { edges } = buildKnowledgeGraph(
      [post("p1", { topics: ["t1"], concepts: ["c1"] })],
      [topic("t1")],
      [concept("c1")]
    );
    expect(edges).toContainEqual({ source: "post:p1", target: "topic:t1" });
    expect(edges).toContainEqual({ source: "post:p1", target: "concept:c1" });
  });

  it("de-duplicates undirected edges (topic A↔B counted once)", () => {
    const { edges } = buildKnowledgeGraph(
      [],
      [topic("a", { relatedTopics: ["b"] }), topic("b", { relatedTopics: ["a"] })],
      []
    );
    const ab = edges.filter(
      (e) =>
        (e.source === "topic:a" && e.target === "topic:b") ||
        (e.source === "topic:b" && e.target === "topic:a")
    );
    expect(ab).toHaveLength(1);
  });

  it("ignores edges to non-existent nodes", () => {
    const { edges } = buildKnowledgeGraph([post("p1", { topics: ["ghost"] })], [], []);
    expect(edges).toHaveLength(0);
  });
});
