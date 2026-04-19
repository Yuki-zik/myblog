import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const postsDir = resolve(process.cwd(), "src/content/posts");
const topicsDir = resolve(process.cwd(), "src/content/topics");
const conceptsDir = resolve(process.cwd(), "src/content/concepts");
const postFiles = readdirSync(postsDir).filter((file) => file.endsWith(".md"));
const topicFiles = readdirSync(topicsDir).filter((file) => file.endsWith(".md"));
const conceptFiles = readdirSync(conceptsDir).filter((file) => file.endsWith(".md"));

function getFileContent(fileName: string): string {
  return readFileSync(join(postsDir, fileName), "utf8");
}

function getTopicFileContent(fileName: string): string {
  return readFileSync(join(topicsDir, fileName), "utf8");
}

function getConceptFileContent(fileName: string): string {
  return readFileSync(join(conceptsDir, fileName), "utf8");
}

function getMatches(source: string, pattern: RegExp): string[] {
  return Array.from(source.matchAll(pattern), (match) => match[1] ?? "").filter(Boolean);
}

function getFrontmatter(source: string): string {
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? "";
}

function getFrontmatterArray(source: string, key: string): string[] {
  const frontmatter = getFrontmatter(source);
  const blockMatch = frontmatter.match(new RegExp(`(?:^|\\n)${key}:\\s*\\n((?:\\s+-\\s+.*\\n?)*)`, "m"));
  if (!blockMatch?.[1]) {
    return [];
  }

  return getMatches(blockMatch[1], /^\s+-\s+([^\s#]+)\s*$/gm);
}

function getHeadingLevels(source: string): Array<{ level: number; text: string }> {
  return Array.from(source.matchAll(/^(#{2,6})\s+(.+)$/gm), (match) => ({
    level: match[1]?.length ?? 0,
    text: (match[2] ?? "").trim()
  }));
}

describe("post content conventions", () => {
  it("does not use legacy annotations or references frontmatter", () => {
    for (const fileName of postFiles) {
      const source = getFileContent(fileName);
      expect(source, fileName).not.toMatch(/^(annotations|references):/m);
    }
  });

  it("uses only note-* or ref-* footnote ids in post bodies and definitions", () => {
    for (const fileName of postFiles) {
      const source = getFileContent(fileName);
      const footnoteRefs = getMatches(source, /\[\^([^\]]+)\](?!:)/g);
      const footnoteDefs = getMatches(source, /^\[\^([^\]]+)\]:/gm);

      for (const id of [...footnoteRefs, ...footnoteDefs]) {
        expect(id, `${fileName}: ${id}`).toMatch(/^(note|ref)-/);
      }
    }
  });

  it("limits figure sourceRefIds to ref-* bibliography footnotes", () => {
    for (const fileName of postFiles) {
      const source = getFileContent(fileName);
      const sourceRefBlocks = Array.from(source.matchAll(/sourceRefIds:\s*\n((?:\s+- .*\n?)+)/g), (match) => match[1] ?? "");

      for (const block of sourceRefBlocks) {
        const refIds = getMatches(block, /^\s+-\s+([^\s#]+)\s*$/gm);
        for (const refId of refIds) {
          expect(refId, `${fileName}: ${refId}`).toMatch(/^ref-/);
        }
      }
    }
  });

  it("keeps post/topic/concept slug references internally consistent", () => {
    const postSlugs = new Set(postFiles.map((file) => file.replace(/\.md$/, "")));
    const topicSlugs = new Set(topicFiles.map((file) => file.replace(/\.md$/, "")));
    const conceptSlugs = new Set(conceptFiles.map((file) => file.replace(/\.md$/, "")));

    for (const fileName of postFiles) {
      const source = getFileContent(fileName);
      for (const topicSlug of getFrontmatterArray(source, "topics")) {
        expect(topicSlugs.has(topicSlug), `${fileName}: missing topic ${topicSlug}`).toBe(true);
      }
      for (const conceptSlug of getFrontmatterArray(source, "concepts")) {
        expect(conceptSlugs.has(conceptSlug), `${fileName}: missing concept ${conceptSlug}`).toBe(true);
      }
    }

    for (const fileName of topicFiles) {
      const source = getTopicFileContent(fileName);
      for (const postSlug of getFrontmatterArray(source, "entryPosts")) {
        expect(postSlugs.has(postSlug), `${fileName}: missing entry post ${postSlug}`).toBe(true);
      }
      for (const topicSlug of getFrontmatterArray(source, "relatedTopics")) {
        expect(topicSlugs.has(topicSlug), `${fileName}: missing related topic ${topicSlug}`).toBe(true);
      }
    }

    for (const fileName of conceptFiles) {
      const source = getConceptFileContent(fileName);
      for (const conceptSlug of getFrontmatterArray(source, "related")) {
        expect(conceptSlugs.has(conceptSlug), `${fileName}: missing related concept ${conceptSlug}`).toBe(true);
      }
    }
  });

  it("limits post markdown headings to h2/h3 and forbids orphan h3 sections", () => {
    for (const fileName of postFiles) {
      const source = getFileContent(fileName);
      const headings = getHeadingLevels(source);
      let seenH2 = false;

      for (const heading of headings) {
        expect([2, 3]).toContain(heading.level);

        if (heading.level === 2) {
          seenH2 = true;
          continue;
        }

        expect(seenH2, `${fileName}: orphan h3 "${heading.text}"`).toBe(true);
      }
    }
  });
});
