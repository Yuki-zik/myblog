/**
 * Builders for `/llms.txt`, `/llms-full.txt`, and per-content Markdown mirrors —
 * structured Markdown indexes and clean text representations that let LLM/agent
 * retrieval tools discover, disambiguate, and cite the site's content cleanly
 * (llmstxt.org convention).
 *
 * Note (per codex audit): these are out-of-band discoverability aids, NOT Google
 * ranking signals. `/llms.txt` stays crawlable; `/llms-full.txt` and per-entry
 * `.md` mirrors carry `X-Robots-Tag: noindex, follow` to avoid SERP duplicate content.
 */

export interface LlmsEntry {
  title: string;
  /** Absolute URL. */
  url: string;
  summary?: string;
  /** Optional clean Markdown mirror URL for GEO retrieval. */
  markdownUrl?: string;
}

export interface LlmsTxtInput {
  siteName: string;
  tagline?: string;
  intro?: readonly string[];
  author?: LlmsEntry;
  papers?: LlmsEntry[];
  posts: LlmsEntry[];
  topics: LlmsEntry[];
  concepts: LlmsEntry[];
  /** llmstxt.org reserved `## Optional` section for auxiliary context/feeds. */
  optional?: LlmsEntry[];
}

export interface PostMarkdownMirrorInput {
  title: string;
  summary?: string;
  author?: string;
  date?: string;
  updated?: string;
  canonicalUrl?: string;
  topics?: readonly string[];
  concepts?: readonly string[];
  body?: string;
}

export interface PaperMarkdownMirrorInput {
  title: string;
  subtitle?: string;
  authors: ReadonlyArray<{ name: string; orcid?: string }>;
  year: number;
  publicationDate?: string;
  venue?: string;
  status: "prototype" | "preprint" | "accepted" | "published";
  doi?: string;
  arxiv?: string;
  canonicalUrl?: string;
  resources?: ReadonlyArray<{ type: string; label?: string; url: string }>;
  summary?: string;
  abstract: string;
  keywords?: readonly string[];
  citation?: string;
  bibtex?: string;
  body?: string;
}

export interface LlmsFullTxtInput {
  siteName: string;
  tagline?: string;
  canonicalSiteUrl: string;
  locale?: "zh-CN" | "en";
  author?: {
    name: string;
    publicationName?: string;
    bio?: string;
    intro?: string;
    profileUrl: string;
    orcid?: string;
    github?: string;
    scholar?: string;
    researchTracks?: ReadonlyArray<{
      title: string;
      summary: string;
      bullets: readonly string[];
    }>;
  };
  papers?: readonly PaperMarkdownMirrorInput[];
  posts: readonly PostMarkdownMirrorInput[];
  topics: ReadonlyArray<{ title: string; url: string; summary: string; why?: string }>;
  concepts: ReadonlyArray<{ title: string; url: string; summary: string; body?: string }>;
}

function normalizeOrcidUrl(orcid: string): string {
  const clean = orcid.trim().replace(/^https?:\/\/orcid\.org\//i, "");
  return `https://orcid.org/${clean}`;
}

function section(lines: string[], heading: string, entries: LlmsEntry[]): void {
  if (entries.length === 0) {
    return;
  }
  lines.push(`## ${heading}`, "");
  for (const entry of entries) {
    const suffix = entry.summary ? `: ${entry.summary}` : "";
    const mirror = entry.markdownUrl ? ` ([Markdown](${entry.markdownUrl}))` : "";
    lines.push(`- [${entry.title}](${entry.url})${suffix}${mirror}`);
  }
  lines.push("");
}

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const lines: string[] = [`# ${input.siteName}`, ""];
  if (input.tagline) {
    lines.push(`> ${input.tagline}`, "");
  }
  if (input.intro?.length) {
    for (const paragraph of input.intro) {
      if (paragraph.trim()) {
        lines.push(paragraph.trim(), "");
      }
    }
  }
  section(lines, "Author", input.author ? [input.author] : []);
  section(lines, "Papers", input.papers ?? []);
  section(lines, "Posts", input.posts);
  section(lines, "Topics", input.topics);
  section(lines, "Concepts", input.concepts);
  section(lines, "Optional", input.optional ?? []);
  return `${lines.join("\n").trimEnd()}\n`;
}

export function formatPostMarkdownMirror(input: PostMarkdownMirrorInput): string {
  const lines: string[] = [`# ${input.title}`, ""];
  if (input.summary) {
    lines.push(`> ${input.summary}`, "");
  }

  const meta: string[] = [];
  if (input.author) meta.push(`- Author: ${input.author}`);
  if (input.date) meta.push(`- Published: ${input.date}`);
  if (input.updated) meta.push(`- Updated: ${input.updated}`);
  if (input.canonicalUrl) meta.push(`- Canonical URL: ${input.canonicalUrl}`);
  if (input.topics?.length) meta.push(`- Topics: ${input.topics.join(", ")}`);
  if (input.concepts?.length) meta.push(`- Concepts: ${input.concepts.join(", ")}`);
  if (meta.length > 0) {
    lines.push(...meta, "");
  }

  if (input.body?.trim()) {
    lines.push(input.body.trim(), "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

export function formatPaperMarkdownMirror(input: PaperMarkdownMirrorInput): string {
  const lines: string[] = [`# ${input.title}`, ""];
  if (input.subtitle) {
    lines.push(`> ${input.subtitle}`, "");
  }

  const authorList = input.authors
    .map((author) =>
      author.orcid ? `${author.name} (ORCID: ${normalizeOrcidUrl(author.orcid)})` : author.name
    )
    .join(", ");

  lines.push(`- Authors: ${authorList}`);
  if (input.venue) lines.push(`- Venue: ${input.venue}`);
  lines.push(`- Year: ${input.year}`);
  if (input.publicationDate) lines.push(`- Publication Date: ${input.publicationDate}`);
  lines.push(`- Status: ${input.status}`);
  if (input.doi) lines.push(`- DOI: https://doi.org/${input.doi}`);
  if (input.arxiv) lines.push(`- arXiv: ${input.arxiv}`);
  if (input.canonicalUrl) lines.push(`- Canonical URL: ${input.canonicalUrl}`);
  if (input.keywords?.length) lines.push(`- Keywords: ${input.keywords.join(", ")}`);
  if (input.resources?.length) {
    lines.push(
      `- External Links: ${input.resources.map((res) => `${res.label ?? res.type} (${res.url})`).join("; ")}`
    );
  }
  lines.push("");

  if (input.summary) {
    lines.push("## Summary", "", input.summary.trim(), "");
  }
  lines.push("## Abstract", "", input.abstract.trim(), "");

  if (input.body?.trim()) {
    lines.push(input.body.trim(), "");
  }

  if (input.citation) {
    lines.push("## Citation", "", input.citation.trim(), "");
  }
  if (input.bibtex) {
    lines.push("## BibTeX", "", "```bibtex", input.bibtex.trim(), "```", "");
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

function demoteHeadings(markdown: string, levels: number): string {
  const prefix = "#".repeat(levels);
  const lines = markdown.split("\n");
  let activeFence: { char: string; length: number } | null = null;
  return lines
    .map((line) => {
      const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
      if (fenceMatch) {
        const marker = fenceMatch[1];
        const char = marker[0];
        if (!activeFence) {
          activeFence = { char, length: marker.length };
        } else if (
          activeFence.char === char &&
          marker.length >= activeFence.length &&
          /^\s*(?:`{3,}|~{3,})\s*$/.test(line)
        ) {
          activeFence = null;
        }
        return line;
      }
      if (!activeFence && /^#{1,4}\s/.test(line)) {
        return `${prefix}${line}`;
      }
      return line;
    })
    .join("\n");
}

export function buildLlmsFullTxt(input: LlmsFullTxtInput): string {
  const lines: string[] = [`# ${input.siteName}`, ""];
  if (input.tagline) {
    lines.push(`> ${input.tagline}`, "");
  }
  lines.push(`Canonical Site: ${input.canonicalSiteUrl}`);
  if (input.locale) {
    lines.push(`Language: ${input.locale}`);
  }
  lines.push("");

  if (input.author) {
    const a = input.author;
    const displayName = a.publicationName ? `${a.name} (${a.publicationName})` : a.name;
    lines.push("## Author Profile", "", `- Name: ${displayName}`, `- Profile: ${a.profileUrl}`);
    if (a.bio) lines.push(`- Role: ${a.bio}`);
    if (a.orcid) lines.push(`- ORCID: ${normalizeOrcidUrl(a.orcid)}`);
    if (a.scholar) lines.push(`- Google Scholar: ${a.scholar}`);
    if (a.github) lines.push(`- GitHub: https://github.com/${a.github}`);
    lines.push("");
    if (a.intro) {
      lines.push(a.intro.trim(), "");
    }
    if (a.researchTracks?.length) {
      lines.push("### Research Tracks", "");
      for (const track of a.researchTracks) {
        lines.push(`- **${track.title}**: ${track.summary} (${track.bullets.join("; ")})`);
      }
      lines.push("");
    }
  }

  if (input.papers?.length) {
    lines.push("## Scholarly Papers", "");
    for (const paper of input.papers) {
      lines.push(demoteHeadings(formatPaperMarkdownMirror(paper).trimEnd(), 2), "", "---", "");
    }
  }

  if (input.posts.length) {
    lines.push("## Technical Posts", "");
    for (const post of input.posts) {
      lines.push(demoteHeadings(formatPostMarkdownMirror(post).trimEnd(), 2), "", "---", "");
    }
  }

  if (input.topics.length || input.concepts.length) {
    lines.push("## Topics & Concepts", "");
    if (input.topics.length) {
      lines.push("### Topics", "");
      for (const topic of input.topics) {
        const why = topic.why ? ` — ${topic.why}` : "";
        lines.push(`- [${topic.title}](${topic.url}): ${topic.summary}${why}`);
      }
      lines.push("");
    }
    if (input.concepts.length) {
      lines.push("### Concepts", "");
      for (const concept of input.concepts) {
        const detail = concept.body?.trim() ? ` (${concept.body.trim().replace(/\s+/g, " ")})` : "";
        lines.push(`- [${concept.title}](${concept.url}): ${concept.summary}${detail}`);
      }
      lines.push("");
    }
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
