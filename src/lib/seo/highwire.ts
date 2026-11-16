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

const MAX_EN_SEARCH_TITLE = 58;

function trimAtWordBoundary(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  const slice = normalized.slice(0, maxChars - 1);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace >= 24 ? slice.slice(0, lastSpace) : slice;
  return cut.replace(/[,;:–—-]+$/, "").trim() + "…";
}

/**
 * Compacts long meta descriptions to fit search-engine snippet linters (<= 158 chars
 * for Bing/Google SERPs) while keeping complete sentences whenever possible and
 * leaving short/Chinese descriptions untouched.
 */
export function compactMetaDescription(text: string, maxChars = 158): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;

  const window = normalized.slice(0, maxChars + 1);
  const sentenceEnd = Math.max(window.lastIndexOf(". "), window.lastIndexOf("。"));
  if (sentenceEnd >= 60) {
    return window.slice(0, sentenceEnd + 1).trim();
  }
  return trimAtWordBoundary(normalized, maxChars);
}

/** Use a verified existing abbreviation or verbatim title clause; never fabricate a paper acronym. */
export function paperSearchTitle(
  paper: PaperSeoSource,
  locale: "zh-CN" | "en" = "zh-CN"
): string {
  const acronym = /^([A-Z][A-Z0-9-]{2,12}):\s/.exec(paper.title)?.[1];
  if (locale === "en") {
    if (paper.title.length <= MAX_EN_SEARCH_TITLE) return paper.title;
    const prepMatch = /^(.+?)\s+(?:for|via|through|with|using)\s+(.+)$/i.exec(paper.title);
    if (prepMatch) {
      const [, leftClause, rightClause] = prepMatch;
      if (leftClause.length >= 24 && leftClause.length <= MAX_EN_SEARCH_TITLE) {
        return leftClause;
      }
      if (acronym) {
        const acronymGoal = `${acronym}: ${rightClause}`;
        if (acronymGoal.length >= 24 && acronymGoal.length <= MAX_EN_SEARCH_TITLE) {
          return acronymGoal;
        }
      }
    }
    return trimAtWordBoundary(paper.title, MAX_EN_SEARCH_TITLE);
  }

  if (!paper.subtitle) return paper.title;
  return paper.subtitle + " · " + (acronym ?? paper.venue?.short ?? String(paper.year));
}

export function paperSearchDescription(
  paper: PaperSeoSource,
  locale: "zh-CN" | "en" = "zh-CN"
): string {
  if (locale === "en") {
    return compactMetaDescription(paper.summary ?? paper.abstract);
  }
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
  canonicalUrl: string,
  options?: { locale?: "zh-CN" | "en" }
): ScholarlyMetaTag[] {
  if (paper.draft || paper.status === "prototype") return [];

  const result: ScholarlyMetaTag[] = [
    { name: "citation_title", content: paper.title },
    ...paper.authors.map((author) => ({ name: "citation_author", content: author.name })),
    { name: "citation_publication_date", content: highwirePublicationDate(paper) },
    { name: "citation_abstract_html_url", content: canonicalUrl }
  ];

  if (options?.locale) {
    result.push({ name: "citation_language", content: options.locale === "en" ? "en" : "zh" });
  }

  if (paper.venue?.type === "journal") {
    result.push({ name: "citation_journal_title", content: paper.venue.name });
  } else if (paper.venue?.type === "conference" || paper.venue?.type === "workshop") {
    result.push({ name: "citation_conference_title", content: paper.venue.name });
  }
  if (paper.identifiers?.doi) {
    result.push({ name: "citation_doi", content: paper.identifiers.doi });
  }
  // Scholar asks citation_pdf_url to point to a PDF in the abstract page's
  // own directory. Never mislabel an external publisher/DOI page as a local
  // full-text PDF; external resources remain ordinary links in the page.
  const folder = new URL("./", canonicalUrl);
  const pdf = paper.resources?.find((resource) => {
    if (resource.type !== "pdf" || !/^https?:\/\//i.test(resource.url)) return false;
    const target = new URL(resource.url);
    return (
      target.origin === folder.origin &&
      target.pathname.startsWith(folder.pathname) &&
      /\.pdf$/i.test(target.pathname)
    );
  });
  if (pdf) result.push({ name: "citation_pdf_url", content: pdf.url });
  return result;
}
