/**
 * Builder for `/llms.txt` — a Markdown index that lets LLM/agent retrieval tools
 * find and cite the site's content cleanly (llmstxt.org convention).
 *
 * Note (per codex audit): this is an out-of-band discoverability aid, NOT a Google
 * ranking signal. The file is kept crawlable; only the per-post `.md` mirrors carry
 * `X-Robots-Tag: noindex` to avoid SERP duplicate content.
 */

export interface LlmsEntry {
  title: string;
  /** Absolute URL. */
  url: string;
  summary?: string;
}

export interface LlmsTxtInput {
  siteName: string;
  tagline?: string;
  posts: LlmsEntry[];
  topics: LlmsEntry[];
  concepts: LlmsEntry[];
}

function section(lines: string[], heading: string, entries: LlmsEntry[]): void {
  if (entries.length === 0) {
    return;
  }
  lines.push(`## ${heading}`, "");
  for (const entry of entries) {
    const suffix = entry.summary ? `: ${entry.summary}` : "";
    lines.push(`- [${entry.title}](${entry.url})${suffix}`);
  }
  lines.push("");
}

export function buildLlmsTxt(input: LlmsTxtInput): string {
  const lines: string[] = [`# ${input.siteName}`, ""];
  if (input.tagline) {
    lines.push(`> ${input.tagline}`, "");
  }
  section(lines, "Posts", input.posts);
  section(lines, "Topics", input.topics);
  section(lines, "Concepts", input.concepts);
  return `${lines.join("\n").trimEnd()}\n`;
}
