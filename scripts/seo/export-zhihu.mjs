#!/usr/bin/env node

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";

const CANONICAL_ORIGIN = "https://a-znk.com";

function splitFrontmatter(markdown) {
  const match = /^(?:\uFEFF)?---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(markdown);
  if (!match) {
    return { data: {}, body: markdown };
  }
  const doc = parseDocument(match[1]);
  return {
    data: doc.toJS({ maxAliasCount: 0 }) ?? {},
    body: markdown.slice(match[0].length)
  };
}

function maskSegments(input, regex, prefix) {
  const store = [];
  const masked = input.replace(regex, (fullMatch) => {
    const token = `\u0000${prefix}_${store.length}\u0000`;
    store.push({ token, value: fullMatch });
    return token;
  });
  return {
    masked,
    restore(text) {
      let current = text;
      for (let i = store.length - 1; i >= 0; i -= 1) {
        current = current.replaceAll(store[i].token, store[i].value);
      }
      return current;
    }
  };
}

/**
 * Converts a Chinese blog post or paper Markdown file into Zhihu-ready Markdown:
 * - Preserves fenced code blocks and inline code spans verbatim (so literal
 *   `[^note-example]`, `:spoiler[x]`, or `/posts/...` examples inside code stay intact).
 * - Expands defined Tufte `[^note-*]` / `[^ref-*]` footnotes into numbered inline markers `[n]`
 *   with a clean endnote block (Zhihu's Markdown importer drops raw GFM `[^id]` syntax).
 * - Unwraps `:spoiler[...]` directives into plain text.
 * - Rewrites site-relative links (`/posts/...`, `/papers/...`, `/topics/...`, `/concepts/...`)
 *   to canonical `https://a-znk.com/...` URLs without tracking query parameters.
 * - Adds concise canonical provenance header & footer for Kimi / Metaso / DeepSeek / Baidu attribution.
 */
export function convertMarkdownForZhihu(markdown, { canonicalPath, kind = "post" } = {}) {
  const { data, body } = splitFrontmatter(markdown);
  const canonicalUrl = new URL(canonicalPath, CANONICAL_ORIGIN).toString();
  const title = data.title ?? canonicalPath;
  const leadSummary = data.summary ?? data.abstract ?? "";

  const fencedMask = maskSegments(
    body,
    /^([ \t]{0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\1\2[ \t]*(?=\r?\n|$)/gm,
    "FENCED_CODE"
  );

  const footnoteDefs = new Map();
  const bodyWithoutDefs = fencedMask.masked.replace(
    /^\[\^([^\]]+)\]:\s*(.+(?:\n(?: {2,}|\t).+)*)/gm,
    (_, id, content) => {
      footnoteDefs.set(id.trim(), content.replace(/\n\s+/g, " ").trim());
      return "";
    }
  );

  const inlineCodeMask = maskSegments(
    bodyWithoutDefs,
    /(`+)([^`\n]+?)\1/g,
    "INLINE_CODE"
  );

  const orderedIds = [];
  const idToIndex = new Map();
  let transformed = inlineCodeMask.masked.replace(/\[\^([^\]]+)\](?!:)/g, (fullMatch, id) => {
    const cleanId = id.trim();
    if (!footnoteDefs.has(cleanId)) return fullMatch;
    if (!idToIndex.has(cleanId)) {
      orderedIds.push(cleanId);
      idToIndex.set(cleanId, orderedIds.length);
    }
    return ` [${idToIndex.get(cleanId)}]`;
  });

  // Unwrap custom inline spoilers `:spoiler[text]` -> `text`
  transformed = transformed.replace(/:spoiler\[([^\]]+)\]/g, "$1");

  // Drop local relative cover/figure images that Zhihu cannot resolve from local paths,
  // keeping a clear caption pointer to the interactive high-res figure on a-znk.com.
  transformed = transformed.replace(
    /!\[([^\]]*)\]\((\.\.?\/[^)]+)\)/g,
    (_, alt) => `> 图示（${alt || "原图"}）详见原文高清交互视图：${canonicalUrl}`
  );

  // Rewrite root-relative internal links (`/posts/...` etc.) to full canonical https://a-znk.com URLs
  transformed = transformed.replace(
    /\[([^\]]+)\]\((\/(?!\/)[^)\s]+)\)/g,
    (_, label, relUrl) => `[${label}](${new URL(relUrl, CANONICAL_ORIGIN).toString()})`
  );

  transformed = fencedMask.restore(inlineCodeMask.restore(transformed));
  transformed = transformed.replace(/\n{3,}/g, "\n\n").trim();

  const lines = [];
  lines.push(`# ${title}`);
  if (data.subtitle) {
    lines.push("", `> **${data.subtitle}**`);
  }
  lines.push(
    "",
    `> 本文首发于 **A-Znk的blog**（作者：马千里 / Qianli Ma），原文含完整交互图表与边注：[${canonicalUrl}](${canonicalUrl})`
  );

  if (kind === "paper") {
    if (data.venue?.name) {
      lines.push(
        `> **发表期刊/会议**：*${data.venue.name}* (${data.year})${
          data.identifiers?.doi ? ` · DOI: [https://doi.org/${data.identifiers.doi}](https://doi.org/${data.identifiers.doi})` : ""
        }`
      );
    }
    if (data.abstract) {
      lines.push("", "## 摘要（Abstract）", "", data.abstract.trim());
    }
  } else if (leadSummary) {
    lines.push("", `**核心导读**：${leadSummary.trim()}`);
  }

  lines.push("", transformed);

  if (orderedIds.length > 0) {
    lines.push("", "---", "", "## 附注与参考说明", "");
    orderedIds.forEach((id, idx) => {
      lines.push(`${idx + 1}. ${footnoteDefs.get(id)}`);
    });
  }

  lines.push(
    "",
    "---",
    "",
    `*原文永久链接：[${canonicalUrl}](${canonicalUrl}) · 作者主页：[https://a-znk.com/author](https://a-znk.com/author)*`,
    ""
  );

  return lines.join("\n");
}

function parseCliArgs(argv) {
  let outDir = "";
  let slugFilter = "";
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out-dir") {
      const next = argv[++i];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing directory path after --out-dir");
      }
      outDir = next;
    } else if (arg === "--slug") {
      const next = argv[++i];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing slug value after --slug");
      }
      slugFilter = next;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { outDir, slugFilter };
}

function main() {
  const { outDir, slugFilter } = parseCliArgs(process.argv.slice(2));

  const root = process.cwd();
  const sources = [
    ...readdirSync(path.join(root, "src/content/papers"))
      .filter((name) => name.endsWith(".md"))
      .map((name) => ({
        kind: "paper",
        slug: name.slice(0, -3),
        filePath: path.join(root, "src/content/papers", name),
        canonicalPath: `/papers/${name.slice(0, -3)}`
      })),
    ...readdirSync(path.join(root, "src/content/posts"))
      .filter((name) => name.endsWith(".md"))
      .map((name) => ({
        kind: "post",
        slug: name.slice(0, -3),
        filePath: path.join(root, "src/content/posts", name),
        canonicalPath: `/posts/${name.slice(0, -3)}`
      }))
  ].filter((item) => {
    if (slugFilter && item.slug !== slugFilter) return false;
    const raw = readFileSync(item.filePath, "utf8");
    const { data } = splitFrontmatter(raw);
    if (data.draft === true || data.status === "prototype") return false;
    return true;
  });

  if (slugFilter && sources.length === 0) {
    throw new Error(`No published post or paper matched --slug "${slugFilter}"`);
  }

  if (outDir) {
    const resolvedOut = path.resolve(root, outDir);
    mkdirSync(resolvedOut, { recursive: true });
    for (const item of sources) {
      const raw = readFileSync(item.filePath, "utf8");
      const exported = convertMarkdownForZhihu(raw, {
        canonicalPath: item.canonicalPath,
        kind: item.kind
      });
      const outPath = path.join(resolvedOut, `${item.kind}-${item.slug}.zhihu.md`);
      writeFileSync(outPath, exported, "utf8");
      console.log(`Exported ${outPath}`);
    }
    return;
  }

  for (const item of sources) {
    const raw = readFileSync(item.filePath, "utf8");
    console.log(
      convertMarkdownForZhihu(raw, {
        canonicalPath: item.canonicalPath,
        kind: item.kind
      })
    );
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
