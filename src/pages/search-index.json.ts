import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { buildSearchIndex } from "../lib/search/index";

export const prerender = true;

export const GET: APIRoute = async () => {
  const [posts, topics, concepts] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts")
  ]);

  const index = buildSearchIndex(posts, topics, concepts);

  return new Response(JSON.stringify(index), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
};
