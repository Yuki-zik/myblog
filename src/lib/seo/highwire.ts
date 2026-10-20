/**
 * Search / Google Scholar metadata for published scholarly work.
 *
 * Keep bibliographic identifiers faithful to the paper's source data.
 * The search title is a concise bilingual discovery label; citation_title and
 * visible H1 always retain the complete, original publication title.
 */
export interface PaperSeoSource {
  title: string;
  subtitle?: string;
  summary?: string;
  abstract: string;
  year: number;
  publicationDate?: string;
  authors: ReadonlyArray<{ name: string }>;
  status: "prototype" | "preprint" | "accepted" | "published";
  venue?: {
    name: string;
    short?: string;
    type?: "conference" | "journal" | "workshop" | "preprint" | "prototype";
  };
  identifiers?: { doi?: string };
  resources?: ReadonlyArray<{ type: string; url: string }>;
  draft?: boolean;
}

export interface ScholarlyMetaTag {
  name: string;
  content: string;
}

/** Use a verified existing abbreviation, never fabricate a paper acronym. */
export function paperSearchTitle(paper: PaperSeoSource): string {
  if (!paper.subtitle) return paper.title;
  const acronym = /^([A-Z][A-Z0-9-]{2,12}):\s/.exec(paper.title)?.[1];
  return paper.subtitle + " · " + (acronym ?? paper.venue?.short ?? String(paper.year));
}

export function paperSearchDescription(paper: PaperSeoSource): string {
  if (!paper.summary) return paper.abstract;
  return paper.summary + "（" + (paper.venue?.name ?? "研究论文") + "，" + paper.year + "）";
}

function highwirePublicationDate(paper: PaperSeoSource): string {
  const date = paper.publicationDate?.slice(0, 10);
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? date.replace(/-/g, "/")
    : String(paper.year);
}

/**
 * Google Scholar documents citation_title, repeated citation_author and
 * citation_publication_date as core scholarly metadata.
 * Drafts / design prototypes must not be represented as published research.
 */
export function buildHighwireMetadata(
  paper: PaperSeoSource,
  canonicalUrl: string
): ScholarlyMetaTag[] {
  if (paper.draft || paper.status === "prototype") return [];

  const result: ScholarlyMetaTag[] = [
    { name: "citation_title", content: paper.title },
    ...paper.authors.map((author) => ({ name: "citation_author", content: author.name })),
    { name: "citation_publication_date", content: highwirePublicationDate(paper) },
    { name: "citation_abstract_html_url", content: canonicalUrl }
  ];

  if (paper.venue?.type === "journal") {
    result.push({ name: "citation_journal_title", content: paper.venue.name });
  } else if (paper.venue?.type === "conference" || paper.venue?.type === "workshop") {
    result.push({ name: "citation_conference_title", content: paper.venue.name });
  }
  if (paper.identifiers?.doi) {
    result.push({ name: "citation_doi", content: paper.identifiers.doi });
  }
  // Only use an explicitly supplied PDF resource; don't treat a publisher
  // landing page or DOI redirect as a downloadable full-text PDF.
  const pdf = paper.resources?.find((resource) =>
    resource.type === "pdf" && /^https?:\/\//i.test(resource.url)
  );
  if (pdf) result.push({ name: "citation_pdf_url", content: pdf.url });
  return result;
}
