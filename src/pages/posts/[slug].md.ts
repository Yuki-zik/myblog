import type { APIContext } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

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
  const posts = await getCollection("posts", ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post }
  }));
}

export async function GET(context: APIContext) {
  const post = context.props.post as CollectionEntry<"posts">;
  const header = post.data.summary ? `${post.data.summary}\n\n` : "";
  const body = `# ${post.data.title}\n\n${header}${post.body ?? ""}`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
