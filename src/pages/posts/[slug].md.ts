import type { APIContext } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";
import { resolvePostAuthor } from "../../lib/posts/author";
import { getPostPath } from "../../lib/posts/urls";
import { formatPostMarkdownMirror } from "../../lib/seo/llms";

/**
 * Per-post raw Markdown mirror (`/posts/<slug>.md`) for LLM/agent retrieval.
 *
 * Carries `X-Robots-Tag: noindex, follow` so search engines do not index the
 * mirror as duplicate content (codex audit: robots.txt disallow does NOT
 * de-index — a noindex header is the correct control, and the URL must stay
 * crawlable for the header to be seen). Excluded from the sitemap in astro.config.
 */

export const prerender = true;

export async function getStaticPaths() {
  const [posts, topics, concepts] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts")
  ]);
  const topicTitles = Object.fromEntries(topics.map((topic) => [topic.id, topic.data.title]));
  const conceptTitles = Object.fromEntries(concepts.map((concept) => [concept.id, concept.data.title]));
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post, topicTitles, conceptTitles }
  }));
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL("http://localhost:4321/");
  const post = context.props.post as CollectionEntry<"posts">;
  const topicTitles = (context.props.topicTitles ?? {}) as Record<string, string>;
  const conceptTitles = (context.props.conceptTitles ?? {}) as Record<string, string>;
  const canonicalPath = post.data.canonical ?? getPostPath(post.id);

  const body = formatPostMarkdownMirror({
    title: post.data.title,
    summary: post.data.summary,
    author: resolvePostAuthor(post).name,
    date: post.data.date,
    updated: post.data.updated,
    canonicalUrl: new URL(canonicalPath, site).toString(),
    topics: post.data.topics.map((slug) => topicTitles[slug] ?? slug),
    concepts: (post.data.concepts ?? []).map((slug) => conceptTitles[slug] ?? slug),
    body: post.body
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
