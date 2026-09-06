import { createHash } from "node:crypto";
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export const PIPELINE_VERSION = 1;
export const AUTO_APPLY_SCORE = 7;

const FIGURE_PREFIX = /^(?:fig(?:ure)?\.?|图)\s*\d+\s*[:.]?/i;
const PIPELINE_KEYWORDS = new Map([
  ["pipeline", 5],
  ["workflow", 5],
  ["architecture", 4],
  ["framework", 4],
  ["overview", 4],
  ["method", 3],
  ["approach", 3],
  ["proposed", 2],
  ["system", 2],
  ["model", 1],
  ["流程", 5],
  ["架构", 4],
  ["框架", 4],
  ["概览", 4],
  ["方法", 3],
]);

export function decodeXml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

export function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

export function parseBboxLayout(xml) {
  const pages = [];
  const pagePattern = /<page\b[^>]*width="([^"]+)"[^>]*height="([^"]+)"[^>]*>([\s\S]*?)<\/page>/g;
  let pageMatch;

  while ((pageMatch = pagePattern.exec(xml))) {
    const [, width, height, pageBody] = pageMatch;
    const lines = [];
    const linePattern = /<line\b[^>]*xMin="([^"]+)"[^>]*yMin="([^"]+)"[^>]*xMax="([^"]+)"[^>]*yMax="([^"]+)"[^>]*>([\s\S]*?)<\/line>/g;
    let lineMatch;

    while ((lineMatch = linePattern.exec(pageBody))) {
      const words = [...lineMatch[5].matchAll(/<word\b[^>]*>([\s\S]*?)<\/word>/g)]
        .map((match) => decodeXml(match[1].replace(/<[^>]+>/g, "")));
      const text = normalizeWhitespace(words.join(" "));
      if (!text) continue;

      lines.push({
        text,
        xMin: Number(lineMatch[1]),
        yMin: Number(lineMatch[2]),
        xMax: Number(lineMatch[3]),
        yMax: Number(lineMatch[4]),
      });
    }

    pages.push({
      width: Number(width),
      height: Number(height),
      lines,
    });
  }

  return pages;
}

export function scoreFigureCaption(caption, pageNumber) {
  const normalized = normalizeWhitespace(caption);
  let score = FIGURE_PREFIX.test(normalized) ? 4 : 0;
  const lower = normalized.toLocaleLowerCase();

  for (const [keyword, weight] of PIPELINE_KEYWORDS) {
    if (lower.includes(keyword)) score += weight;
  }

  if (/^(?:table|表)\s*\d+/i.test(normalized)) score -= 10;
  if (/appendix|supplement/i.test(normalized)) score -= 2;
  if (pageNumber === 1) score -= 1;
  if (normalized.length >= 24 && normalized.length <= 500) score += 1;

  return score;
}

export function rankFigureCandidates(pages) {
  const candidates = [];

  pages.forEach((page, pageIndex) => {
    page.lines.forEach((line, lineIndex) => {
      if (!FIGURE_PREFIX.test(line.text)) return;

      const continuation = [];
      for (const next of page.lines.slice(lineIndex + 1, lineIndex + 4)) {
        if (next.yMin - line.yMax >= 38) break;
        if (/^(?:fig(?:ure)?\.?|table|图|表)\s*\d+/i.test(next.text)) break;
        if (/^(?:\d+(?:\.\d+)*\s+)?(?:introduction|method|results?|conclusion|related work|background)\b/i.test(next.text)) break;
        continuation.push(next.text);
      }
      const caption = normalizeWhitespace([line.text, ...continuation].join(" "));
      const previousLines = page.lines.slice(0, lineIndex);
      let figureTop = null;
      for (let index = previousLines.length - 1; index > 0; index -= 1) {
        const gap = previousLines[index].yMin - previousLines[index - 1].yMax;
        if (gap >= page.height * 0.045) {
          figureTop = Math.max(
            page.height * 0.04,
            previousLines[index].yMin - page.height * 0.055,
          );
          break;
        }
      }
      candidates.push({
        page: pageIndex + 1,
        caption,
        score: scoreFigureCaption(caption, pageIndex + 1),
        pageWidth: page.width,
        pageHeight: page.height,
        captionBox: {
          xMin: line.xMin,
          yMin: line.yMin,
          xMax: line.xMax,
          yMax: line.yMax,
        },
        figureTop,
      });
    });
  });

  return candidates.sort((a, b) => b.score - a.score || a.page - b.page);
}

export function computeFigureCrop(candidate) {
  const { pageWidth, pageHeight, captionBox } = candidate;
  const horizontalInset = pageWidth * 0.045;
  const bottom = Math.max(pageHeight * 0.18, captionBox.yMin - pageHeight * 0.014);
  const desiredHeight = Math.min(pageHeight * 0.48, (pageWidth - horizontalInset * 2) * 0.52);
  const top = candidate.figureTop ?? Math.max(pageHeight * 0.04, bottom - desiredHeight);

  return {
    x: horizontalInset / pageWidth,
    y: top / pageHeight,
    width: (pageWidth - horizontalInset * 2) / pageWidth,
    height: (bottom - top) / pageHeight,
  };
}

function extractSection(text, startPattern, endPattern, maxLength, maxParagraphs) {
  const normalized = text.replace(/\r/g, "");
  const start = normalized.search(startPattern);
  if (start === -1) return "";
  const afterHeading = normalized.slice(start).replace(startPattern, "");
  const end = afterHeading.search(endPattern);
  const section = end === -1 ? afterHeading : afterHeading.slice(0, end);
  const paragraphs = section
    .split(/\n\s*\n/)
    .map((paragraph) =>
      normalizeWhitespace(
        paragraph
          .split("\n")
          .filter((line) => !/^\s*(?:fig(?:ure)?\.?|table|图|表)\s*\d+/i.test(line))
          .join(" "),
      ),
    )
    .filter((paragraph) => paragraph.length >= 20)
    .slice(0, maxParagraphs);
  return paragraphs.join(" ").slice(0, maxLength);
}

export function extractPaperSections(text) {
  return {
    abstract: extractSection(
      text,
      /^\s*(?:abstract|摘要)\s*[:—-]?\s*/im,
      /^\s*(?:keywords?|index terms|introduction|1\.?\s+introduction|关键词)\b/im,
      5000,
      3,
    ),
    overview: extractSection(
      text,
      /^\s*(?:1\.?\s+)?(?:introduction|overview|引言|概述)\s*[:—-]?\s*/im,
      /^\s*(?:2\.?\s+|related work|background|method|approach|preliminar)/im,
      2500,
      1,
    ),
  };
}

export function extractOverviewFromLayout(pages, candidates = []) {
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
    const page = pages[pageIndex];
    const startIndex = page.lines.findIndex((line) =>
      /^(?:1(?:\.0)?\.?\s+)?(?:introduction|overview|引言|概述)\s*$/i.test(line.text),
    );
    if (startIndex === -1) continue;

    const figureRanges = candidates
      .filter((candidate) => candidate.page === pageIndex + 1 && candidate.figureTop != null)
      .map((candidate) => ({
        top: candidate.figureTop,
        bottom: candidate.captionBox.yMax,
      }));
    const lines = [];

    for (const line of page.lines.slice(startIndex + 1)) {
      if (/^(?:[2-9]\d*(?:\.\d+)*\.?\s+|related work|background|method|approach|preliminar)/i.test(line.text)) break;
      if (/^(?:fig(?:ure)?\.?|table|图|表)\s*\d+/i.test(line.text)) continue;
      if (figureRanges.some((range) => line.yMin >= range.top && line.yMax <= range.bottom)) continue;
      lines.push(line.text);
    }

    const overview = normalizeWhitespace(lines.join(" ")).slice(0, 2500);
    if (overview.length >= 20) return overview;
  }
  return "";
}

export function parsePdfResource(markdown) {
  const resourcesMatch = markdown.match(/^resources:\s*\n([\s\S]*?)(?=^[^\s#][^:\n]*:|\n---)/m);
  if (!resourcesMatch) return null;

  const entries = resourcesMatch[1].split(/\n(?=\s*-\s+type:)/);
  for (const entry of entries) {
    if (!/^\s*-\s+type:\s*pdf\s*$/m.test(entry)) continue;
    const url = entry.match(/^\s+url:\s*(.+?)\s*$/m)?.[1]?.replace(/^["']|["']$/g, "");
    if (url) return url;
  }
  return null;
}

export function parsePaperTitle(markdown) {
  const value = markdown.match(/^title:\s*(.+?)\s*$/m)?.[1] ?? "";
  return value.replace(/^["']|["']$/g, "");
}

export function upsertGeneratedCoverBlock(markdown, cover) {
  const start = "# paper-automation:start";
  const end = "# paper-automation:end";
  const block = [
    start,
    "cover:",
    `  src: ./covers/${cover.filename}`,
    `  alt: ${JSON.stringify(cover.alt)}`,
    `  caption: ${JSON.stringify(cover.caption)}`,
    `  sourcePage: ${cover.page}`,
    end,
  ].join("\n");

  const generatedPattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  if (generatedPattern.test(markdown)) {
    return markdown.replace(generatedPattern, block);
  }

  const frontmatterEnd = markdown.indexOf("\n---", 4);
  if (frontmatterEnd === -1) throw new Error("Paper Markdown is missing closing frontmatter");
  const frontmatter = markdown.slice(4, frontmatterEnd);
  if (/^cover:\s*$/m.test(frontmatter)) {
    throw new Error("Paper already has a manual cover; remove it before applying an automated cover");
  }

  return `${markdown.slice(0, frontmatterEnd)}\n${block}${markdown.slice(frontmatterEnd)}`;
}

export async function sha256File(filePath) {
  const bytes = await readFile(filePath);
  return createHash("sha256").update(bytes).digest("hex");
}

export async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function relativeToRoot(root, target) {
  return path.relative(root, target).split(path.sep).join("/");
}
