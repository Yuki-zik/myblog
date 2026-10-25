import type { CollectionEntry } from "astro:content";

export type SearchIndexItemType = "paper" | "post" | "topic" | "concept" | "page";

export interface SearchIndexItem {
  type: SearchIndexItemType;
  title: string;
  language?: "zh-CN" | "en";
  languageLabel?: string;
  alternateTitles?: string[];
  alternateSummaries?: string[];
  url: string;
  summary?: string;
  keywords: readonly string[];
  /** Normalized plain-text body for full-content matching (not displayed). */
  body?: string;
  date?: string;
  /** Known paper year, used for sorting when the exact publication date is unknown. */
  year?: number;
  updated?: string;
}

const TYPE_PRIORITY: Record<SearchIndexItemType, number> = {
  paper: 0,
  post: 1,
  topic: 2,
  concept: 3,
  page: 4
};

function compactStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const nextValues: string[] = [];

  values.forEach((value) => {
    const trimmed = value?.trim();
    if (!trimmed) {
      return;
    }

    if (seen.has(trimmed)) {
      return;
    }

    seen.add(trimmed);
    nextValues.push(trimmed);
  });

  return nextValues;
}

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip Markdown to plain text for full-content search indexing. Drops fenced
 * code, resolves links/images to their text, removes footnote/anchor markers,
 * directive syntax (`:::spoiler`), emphasis, heading/list/quote markers and
 * raw HTML. Best-effort — tuned for recall, not perfect rendering.
 */
export function extractSearchableText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\[\^[^\]]+\]:\s?/gm, "")
    .replace(/\[\^[^\]]+\]/g, " ")
    .replace(/:::\w+(?:\[([^\]]*)\])?/g, "$1")
    .replace(/:(\w+)\[([^\]]*)\]/g, "$2")
    .replace(/`+/g, " ")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[>\-*+]\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const segmenter = new Intl.Segmenter("zh-CN", { granularity: "word" });
function containsTerm(text: string, term: string): boolean {
  if (/\p{Script=Han}/u.test(term)) return text.includes(term);
  // Whole Latin words prevent e.g. AI from matching chair, mail or training.
  return (` ${text} `).includes(` ${term} `);
}
function phraseScore(item: SearchIndexItem, query: string): number {
  let score = -1;
  for (const title of [item.title, ...(item.alternateTitles ?? [])].map(normalizeSearchText)) {
    if (title === query) score = Math.max(score, 500);
    else if (containsTerm(title, query)) score = Math.max(score, title.startsWith(query) ? 420 : 340);
  }
  for (const keyword of item.keywords.map(normalizeSearchText)) {
    if (keyword === query) score = Math.max(score, 300);
    else if (containsTerm(keyword, query)) score = Math.max(score, keyword.startsWith(query) ? 260 : 220);
  }
  if ([item.summary ?? "", ...(item.alternateSummaries ?? [])].some(s => containsTerm(normalizeSearchText(s), query))) score = Math.max(score, 140);
  if (containsTerm(normalizeSearchText(item.body ?? ""), query)) score = Math.max(score, 100);
  return score;
}
export function scoreSearchMatch(item: SearchIndexItem, queryInput: string): number {
  const query = normalizeSearchText(queryInput);
  if (!query) return -1;
  const terms = [...new Set([...segmenter.segment(query)].filter(s => s.isWordLike).map(s => s.segment))];
  if (!terms.length) return -1;
  const scores = terms.map(term => phraseScore(item, term));
  if (scores.some(score => score < 0)) return -1;
  const phrase = phraseScore(item, query);
  // Retain the existing single-term weights and tie breaks. A full phrase wins
  // over scattered terms; all terms must still match a real indexed field.
  return terms.length === 1 ? scores[0] : Math.max(...scores) + (phrase >= 0 ? phrase : 0);
}

/** Source records are authoritative: translations never resurrect deleted/draft sources. */
export function mergeSearchEditions(source: SearchIndexItem[], translated: SearchIndexItem[], locale: "zh-CN" | "en"): SearchIndexItem[] {
  const counterparts = new Map(translated.map(item => [item.url, item]));
  return source.map(original => {
    const counterpart = counterparts.get(original.url);
    const display = locale === "en" && counterpart ? counterpart : original;
    const language = locale === "en" && counterpart ? "en" : "zh-CN";
    const editions = counterpart ? [original, counterpart] : [original];
    return {
      ...display,
      url: language === "en" ? `/en${original.url === "/" ? "" : original.url}` : original.url,
      language,
      languageLabel: language === "en" ? "English" : locale === "en" ? "中文 · Chinese fallback" : "中文",
      alternateTitles: compactStrings(editions.flatMap(item => [item.title, ...(item.alternateTitles ?? [])])),
      alternateSummaries: compactStrings(editions.flatMap(item => [item.summary, ...(item.alternateSummaries ?? [])])),
      keywords: compactStrings(editions.flatMap(item => [...item.keywords])),
      body: editions.map(item => item.body ?? "").join("\n")
    };
  });
}

export function searchIndexItems(
  items: SearchIndexItem[],
  queryInput: string,
  limit = 8
): SearchIndexItem[] {
  const query = normalizeSearchText(queryInput);
  if (!query) {
    return [];
  }

  return items
    .map((item) => ({
      item,
      score: scoreSearchMatch(item, query)
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const typeDiff = TYPE_PRIORITY[a.item.type] - TYPE_PRIORITY[b.item.type];
      if (typeDiff !== 0) {
        return typeDiff;
      }

      if (
        (a.item.type === "post" || a.item.type === "paper") &&
        (b.item.type === "post" || b.item.type === "paper")
      ) {
        const aDate = a.item.updated ?? a.item.date ?? String(a.item.year ?? "");
        const bDate = b.item.updated ?? b.item.date ?? String(b.item.year ?? "");
        if (aDate !== bDate) {
          return bDate.localeCompare(aDate);
        }
      }

      return a.item.title.localeCompare(b.item.title, "zh-CN");
    })
    .slice(0, Math.max(limit, 0))
    .map((entry) => entry.item);
}

export function buildSearchIndex(
  posts: Pick<CollectionEntry<"posts">, "id" | "data" | "body">[],
  papers: Pick<CollectionEntry<"papers">, "id" | "data" | "body">[],
  topics: Pick<CollectionEntry<"topics">, "id" | "data" | "body">[],
  concepts: Pick<CollectionEntry<"concepts">, "id" | "data" | "body">[]
): SearchIndexItem[] {
  const postItems: SearchIndexItem[] = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      type: "post",
      title: post.data.title,
      url: `/posts/${post.id}`,
      summary: post.data.summary,
      keywords: compactStrings([...(post.data.topics ?? []), ...(post.data.concepts ?? [])]),
      body: extractSearchableText(post.body ?? ""),
      date: post.data.date,
      updated: post.data.updated
    }));

  const paperItems: SearchIndexItem[] = papers
    .filter((paper) => !paper.data.draft)
    .map((paper) => ({
      type: "paper",
      title: paper.data.title,
      url: `/papers/${paper.id}`,
      summary: paper.data.summary ?? paper.data.abstract,
      keywords: compactStrings([
        ...paper.data.keywords,
        ...paper.data.authors.map((author) => author.name),
        paper.data.venue?.name,
        paper.data.venue?.short
      ]),
      body: extractSearchableText([paper.data.abstract, paper.body ?? ""].join("\n")),
      alternateTitles: compactStrings([paper.data.subtitle]),
      date: paper.data.publicationDate,
      year: paper.data.year,
      updated: paper.data.updated
    }));

  const topicItems: SearchIndexItem[] = topics.map((topic) => ({
    type: "topic",
    title: topic.data.title,
    url: `/topics/${topic.id}`,
    summary: topic.data.summary,
    keywords: compactStrings([...(topic.data.relatedTopics ?? []), ...(topic.data.entryPosts ?? [])]),
    body: extractSearchableText([topic.data.why ?? "", topic.body ?? ""].join("\n"))
  }));

  const conceptItems: SearchIndexItem[] = concepts.map((concept) => ({
    type: "concept",
    title: concept.data.title,
    url: `/concepts/${concept.id}`,
    summary: concept.data.summary,
    keywords: compactStrings([...(concept.data.tags ?? []), ...(concept.data.related ?? [])]),
    body: extractSearchableText(concept.body ?? "")
  }));

  return [...paperItems, ...postItems, ...topicItems, ...conceptItems].map(item => ({...item, alternateTitles: [...(item.alternateTitles ?? []), item.url.split("/").at(-1)!]}));
}
