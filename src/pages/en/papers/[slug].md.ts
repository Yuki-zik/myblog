import type { APIContext } from "astro";
import { type CollectionEntry } from "astro:content";
import { collectionReader } from "../../../lib/i18n/content";
import { formatPaperMarkdownMirror } from "../../../lib/seo/llms";

/**
 * Per-paper English structured Markdown mirror (`/en/papers/<slug>.md`) for scholarly & LLM citation.
 * Excludes drafts and non-published prototypes; carries `X-Robots-Tag: noindex, follow`.
 */

export const prerender = true;

export async function getStaticPaths() {
  const papers = await collectionReader("en")(
    "papers",
    ({ data }) => !data.draft && data.status !== "prototype"
  );
  return papers.map((paper) => ({
    params: { slug: paper.id },
    props: { paper }
  }));
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL("http://localhost:4321/");
  const paper = context.props.paper as CollectionEntry<"papersEn">;

  const body = formatPaperMarkdownMirror({
    title: paper.data.title,
    subtitle: paper.data.subtitle,
    authors: paper.data.authors,
    year: paper.data.year,
    publicationDate: paper.data.publicationDate,
    venue: paper.data.venue?.name,
    status: paper.data.status,
    doi: paper.data.identifiers?.doi,
    arxiv: paper.data.identifiers?.arxiv,
    canonicalUrl: new URL(`/en/papers/${paper.id}`, site).toString(),
    resources: paper.data.resources,
    summary: paper.data.summary,
    abstract: paper.data.abstract,
    keywords: paper.data.keywords,
    citation: paper.data.citation,
    bibtex: paper.data.bibtex,
    body: paper.body
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
