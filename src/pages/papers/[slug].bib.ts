import type { APIContext } from "astro";
import { getCollection, type CollectionEntry } from "astro:content";

/**
 * Per-paper BibTeX citation endpoint (`/papers/<slug>.bib`) for reference managers
 * (Zotero, JabRef, BibDesk) and scholarly crawlers.
 * Excludes drafts and prototypes; carries `X-Robots-Tag: noindex, follow`.
 */

export const prerender = true;

export async function getStaticPaths() {
  const papers = await getCollection(
    "papers",
    ({ data }) => !data.draft && data.status !== "prototype" && Boolean(data.bibtex)
  );
  return papers.map((paper) => ({
    params: { slug: paper.id },
    props: { paper }
  }));
}

export async function GET(context: APIContext) {
  const paper = context.props.paper as CollectionEntry<"papers">;
  const body = `${(paper.data.bibtex ?? "").trim()}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-bibtex; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
