import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildKnowledgeGraph } from "../lib/knowledge/graph";

export const prerender = true;

export const GET: APIRoute = async () => {
  const [posts, topics, concepts] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts")
  ]);

  const graph = buildKnowledgeGraph(posts, topics, concepts);

  return new Response(JSON.stringify(graph), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=60, s-maxage=300, must-revalidate"
    }
  });
};
