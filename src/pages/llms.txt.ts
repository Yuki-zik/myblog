import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { buildLlmsTxt } from "../lib/seo/llms";
import { getPostUrl } from "../lib/posts/urls";
import { SITE_AUTHOR_PROFILE, SITE_NAME } from "../lib/site";

export const prerender = true;

export async function GET(context: APIContext) {
  const site = context.site ?? new URL("http://localhost:4321/");
  const [posts, topics, concepts, papers] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts"),
    getCollection("papers", ({ data }) => !data.draft && data.status !== "prototype")
  ]);

  const sortedPosts = posts
    .slice()
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());

  const body = buildLlmsTxt({
    siteName: SITE_NAME,
    tagline: SITE_AUTHOR_PROFILE.tagline,
    author: {
      title: SITE_AUTHOR_PROFILE.name,
      url: new URL("/author", site).toString(),
      summary: SITE_AUTHOR_PROFILE.bioShort
    },
    papers: papers.slice().sort((a, b) => b.data.year - a.data.year).map((paper) => ({
      title: paper.data.title,
      url: new URL(`/papers/${paper.id}`, site).toString(),
      summary: [paper.data.year, paper.data.venue?.name, paper.data.status, paper.data.summary ?? paper.data.abstract]
        .filter(Boolean).join(" · ")
    })),
    posts: sortedPosts.map((post) => ({
      title: post.data.title,
      url: getPostUrl(post.id, site),
      summary: post.data.summary
    })),
    topics: topics.map((topic) => ({
      title: topic.data.title,
      url: new URL(`/topics/${topic.id}`, site).toString(),
      summary: topic.data.summary
    })),
    concepts: concepts.map((concept) => ({
      title: concept.data.title,
      url: new URL(`/concepts/${concept.id}`, site).toString(),
      summary: concept.data.summary
    }))
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
