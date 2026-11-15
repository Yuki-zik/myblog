import type { APIRoute } from "astro";

export const prerender = true;

const AI_RETRIEVAL_AGENTS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "GPTBot",
  "Claude-SearchBot",
  "Claude-User",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "Bytespider",
  "DuckAssistBot"
] as const;

export const GET: APIRoute = (context) => {
  const site = context.site ?? new URL("http://localhost:4321/");
  const sitemapUrl = new URL("sitemap.xml", site).toString();
  const llmsUrl = new URL("llms.txt", site).toString();
  const enLlmsUrl = new URL("en/llms.txt", site).toString();
  const llmsFullUrl = new URL("llms-full.txt", site).toString();
  const enLlmsFullUrl = new URL("en/llms-full.txt", site).toString();

  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    "# Internal client search indexes — not meant for SERP indexing.",
    "Disallow: /search-index.json",
    "Disallow: /en/search-index.json",
    "",
    "# Explicit allowlist for Generative Engine / AI Search & Citation agents.",
    ...AI_RETRIEVAL_AGENTS.map((agent) => `User-agent: ${agent}`),
    "Allow: /",
    "Disallow: /search-index.json",
    "Disallow: /en/search-index.json",
    "",
    "# Raw .md mirrors (/design.md, /posts/<slug>.md, /papers/<slug>.md) and",
    "# /llms-full.txt stay crawlable so X-Robots-Tag: noindex is seen and applied.",
    "# Structured LLM / Agent retrieval indexes (llmstxt.org):",
    `# LLMs Index (zh-CN): ${llmsUrl}`,
    `# LLMs Index (en): ${enLlmsUrl}`,
    `# LLMs Full Corpus (zh-CN): ${llmsFullUrl}`,
    `# LLMs Full Corpus (en): ${enLlmsFullUrl}`,
    "",
    `Sitemap: ${sitemapUrl}`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
};
