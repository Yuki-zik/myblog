import type { SiteAuthorProfile } from "../site";

/**
 * Schema.org JSON-LD builders for MyBlog.
 *
 * Design notes (verified against Google Search Central + codex audit):
 * - One `@graph` per page with stable absolute `@id`s so entities link across pages.
 * - `author.name` carries ONLY the name; identity goes in `sameAs`/`url`
 *   (Google: do not stuff titles/publisher into author.name).
 * - `about` (topics) / `mentions` (concepts) are only emitted by callers when those
 *   entities are actually visible on the page (avoid "marking up invisible content").
 * - `citation` is intentionally omitted until `figures.sourceRefIds` can be resolved
 *   to real bibliography URLs/text — internal anchors are not citations.
 * - Serialization escapes `<`,`>`,`&`,U+2028/2029 so a hostile title/string cannot
 *   break out of the inline <script> (`</script>` injection).
 */

export interface JsonLdNode {
  "@type": string | string[];
  "@id"?: string;
  [key: string]: unknown;
}

export interface BreadcrumbItem {
  name: string;
  /** Absolute URL; omit for the current (last) crumb. */
  url?: string;
}

function abs(path: string, siteUrl: string): string {
  return new URL(path, siteUrl).toString();
}

export function websiteId(siteUrl: string): string {
  return abs("#website", siteUrl);
}

export function personId(siteUrl: string): string {
  return abs("#person-a-znk", siteUrl);
}

/** WebSite + Person — emitted once per page by the layout. */
export function buildBaseNodes(siteUrl: string, author: SiteAuthorProfile): JsonLdNode[] {
  const sameAs: string[] = [];
  if (author.socials?.github) {
    sameAs.push(`https://github.com/${author.socials.github}`);
  }
  if (author.socials?.x) {
    sameAs.push(`https://x.com/${author.socials.x}`);
  }
  if (author.socials?.scholar) {
    sameAs.push(author.socials.scholar);
  }

  const person: JsonLdNode = {
    "@type": "Person",
    "@id": personId(siteUrl),
    name: author.name,
    ...(author.publicationName ? { alternateName: author.publicationName } : {}),
    ...(author.homepage ? { url: author.homepage } : {}),
    ...(sameAs.length ? { sameAs } : {})
  };

  const website: JsonLdNode = {
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    url: abs("/", siteUrl),
    name: `${author.name} | MyBlog`,
    inLanguage: "zh-CN",
    publisher: { "@id": personId(siteUrl) }
  };

  return [website, person];
}

export function buildBreadcrumb(pageUrl: string, items: BreadcrumbItem[]): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {})
    }))
  };
}

export interface BlogPostingInput {
  siteUrl: string;
  /** Absolute canonical URL of the post. */
  canonicalUrl: string;
  title: string;
  description?: string;
  datePublished: string;
  dateModified?: string;
  /** Absolute URL of the OG/cover image, if any. */
  imageUrl?: string;
  /** Visible topic titles → schema `about`. Pass only if rendered on the page. */
  topics?: string[];
  /** Visible concept titles → schema `mentions`. Pass only if rendered on the page. */
  concepts?: string[];
  breadcrumbs: BreadcrumbItem[];
}

export function buildBlogPostingGraph(input: BlogPostingInput): JsonLdNode[] {
  const article: JsonLdNode = {
    "@type": "BlogPosting",
    "@id": `${input.canonicalUrl}#blogposting`,
    headline: input.title,
    ...(input.description ? { description: input.description } : {}),
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    inLanguage: "zh-CN",
    mainEntityOfPage: input.canonicalUrl,
    author: { "@id": personId(input.siteUrl) },
    publisher: { "@id": personId(input.siteUrl) },
    isPartOf: { "@id": websiteId(input.siteUrl) },
    ...(input.imageUrl ? { image: input.imageUrl } : {}),
    ...(input.topics?.length
      ? { about: input.topics.map((name) => ({ "@type": "Thing", name })) }
      : {}),
    ...(input.concepts?.length
      ? { mentions: input.concepts.map((name) => ({ "@type": "Thing", name })) }
      : {}),
    breadcrumb: { "@id": `${input.canonicalUrl}#breadcrumb` }
  };

  return [article, buildBreadcrumb(input.canonicalUrl, input.breadcrumbs)];
}

export interface ScholarlyArticleInput {
  siteUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  authors: Array<{ name: string; url?: string; self?: boolean }>;
  datePublished?: string;
  dateModified?: string;
  keywords: string[];
  venue?: string;
  doi?: string;
  breadcrumbs: BreadcrumbItem[];
}

export function buildScholarlyArticleGraph(input: ScholarlyArticleInput): JsonLdNode[] {
  const dateModified = input.dateModified ?? input.datePublished;
  const publicationParts: JsonLdNode[] = [{ "@id": websiteId(input.siteUrl), "@type": "WebSite" }];
  if (input.venue) {
    publicationParts.push({ "@type": "PublicationIssue", name: input.venue });
  }

  const article: JsonLdNode = {
    "@type": "ScholarlyArticle",
    "@id": `${input.canonicalUrl}#scholarly-article`,
    headline: input.title,
    description: input.description,
    author: input.authors.map((author) =>
      author.self
        ? { "@id": personId(input.siteUrl) }
        : { "@type": "Person", name: author.name, ...(author.url ? { url: author.url } : {}) }
    ),
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    inLanguage: "zh-CN",
    mainEntityOfPage: input.canonicalUrl,
    isPartOf: publicationParts,
    keywords: input.keywords,
    ...(input.doi ? { identifier: { "@type": "PropertyValue", propertyID: "DOI", value: input.doi } } : {}),
    breadcrumb: { "@id": `${input.canonicalUrl}#breadcrumb` }
  };

  return [article, buildBreadcrumb(input.canonicalUrl, input.breadcrumbs)];
}

export interface CollectionPageInput {
  siteUrl: string;
  canonicalUrl: string;
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
}

export function buildCollectionPageGraph(input: CollectionPageInput): JsonLdNode[] {
  const page: JsonLdNode = {
    "@type": "CollectionPage",
    "@id": `${input.canonicalUrl}#collectionpage`,
    name: input.title,
    url: input.canonicalUrl,
    ...(input.description ? { description: input.description } : {}),
    inLanguage: "zh-CN",
    isPartOf: { "@id": websiteId(input.siteUrl) },
    breadcrumb: { "@id": `${input.canonicalUrl}#breadcrumb` }
  };

  return [page, buildBreadcrumb(input.canonicalUrl, input.breadcrumbs)];
}

/**
 * Serialize a graph into a string safe to embed inside an inline
 * `<script type="application/ld+json">`. Escapes characters that could
 * terminate the script element or break JS string parsing.
 */
export function serializeJsonLd(graph: JsonLdNode[]): string {
  const document = { "@context": "https://schema.org", "@graph": graph };
  return JSON.stringify(document)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
