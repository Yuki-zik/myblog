import type { CollectionEntry } from "astro:content";

/**
 * Build-time knowledge graph from the frontmatter relation layer
 * (posts↔topics, posts↔concepts, topic↔relatedTopics, concept↔related).
 * Pure + serializable so it can be emitted as a static `/knowledge-graph.json`
 * and laid out client-side. Edges are undirected and de-duplicated.
 *
 * Node ids are type-prefixed (`post:slug`) so a post and a topic that happen to
 * share a slug never collide.
 */

export type GraphNodeType = "post" | "topic" | "concept";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  title: string;
  url: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildKnowledgeGraph(
  posts: CollectionEntry<"posts">[],
  topics: CollectionEntry<"topics">[],
  concepts: CollectionEntry<"concepts">[]
): KnowledgeGraph {
  const livePosts = posts.filter((post) => !post.data.draft);

  const nodes: GraphNode[] = [
    ...livePosts.map((post) => ({
      id: `post:${post.id}`,
      type: "post" as const,
      title: post.data.title,
      url: `/posts/${post.id}`
    })),
    ...topics.map((topic) => ({
      id: `topic:${topic.id}`,
      type: "topic" as const,
      title: topic.data.title,
      url: `/topics/${topic.id}`
    })),
    ...concepts.map((concept) => ({
      id: `concept:${concept.id}`,
      type: "concept" as const,
      title: concept.data.title,
      url: `/concepts/${concept.id}`
    }))
  ];

  const nodeIds = new Set(nodes.map((node) => node.id));
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];

  const addEdge = (a: string, b: string): void => {
    if (a === b || !nodeIds.has(a) || !nodeIds.has(b)) {
      return;
    }
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    edges.push({ source: a, target: b });
  };

  for (const post of livePosts) {
    for (const topic of post.data.topics ?? []) {
      addEdge(`post:${post.id}`, `topic:${topic}`);
    }
    for (const concept of post.data.concepts ?? []) {
      addEdge(`post:${post.id}`, `concept:${concept}`);
    }
  }
  for (const topic of topics) {
    for (const related of topic.data.relatedTopics ?? []) {
      addEdge(`topic:${topic.id}`, `topic:${related}`);
    }
  }
  for (const concept of concepts) {
    for (const related of concept.data.related ?? []) {
      addEdge(`concept:${concept.id}`, `concept:${related}`);
    }
  }

  return { nodes, edges };
}
