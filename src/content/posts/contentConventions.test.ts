import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const postsDir = resolve(process.cwd(), "src/content/posts");
const postFiles = readdirSync(postsDir).filter((file) => file.endsWith(".md"));

function getFileContent(fileName: string): string {
  return readFileSync(join(postsDir, fileName), "utf8");
}

function getMatches(source: string, pattern: RegExp): string[] {
  return Array.from(source.matchAll(pattern), (match) => match[1] ?? "").filter(Boolean);
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
});
