import type { Root, Element } from "hast";
import Slugger from "github-slugger";
import { toString } from "hast-util-to-string";
import { visitParents } from "unist-util-visit-parents";

const EXCLUDED_ANCESTORS = new Set([
  "blockquote",
  "li",
  "table",
  "details",
  "figcaption"
]);

const HEADING_TAGS = new Set(["h2", "h3", "h4", "h5", "h6"]);

function hasExcludedAncestor(ancestors: unknown[]): boolean {
  return ancestors.some((ancestor) => {
    if (!ancestor || typeof ancestor !== "object") {
      return false;
    }

    const element = ancestor as Partial<Element>;
    return element.type === "element" && EXCLUDED_ANCESTORS.has(String(element.tagName));
  });
}

export function applyParagraphAnchors(tree: Root): void {
  const slugger = new Slugger();
  let sectionSlug = "root";
  const sectionCounters = new Map<string, number>([["root", 0]]);

  visitParents(tree, "element", (node, ancestors) => {
    const element = node as Element;
    const tagName = String(element.tagName);

    if (HEADING_TAGS.has(tagName)) {
      const headingText = toString(element).trim();
      sectionSlug = headingText ? slugger.slug(headingText) : "section";
      if (!sectionCounters.has(sectionSlug)) {
        sectionCounters.set(sectionSlug, 0);
      }
      return;
    }

    if (tagName !== "p" || hasExcludedAncestor(ancestors)) {
      return;
    }

    const currentIndex = (sectionCounters.get(sectionSlug) ?? 0) + 1;
    sectionCounters.set(sectionSlug, currentIndex);

    const anchorId = `${sectionSlug}::p${currentIndex}`;
    element.properties ??= {};
    element.properties.id = `c-${anchorId}`;
    element.properties["data-anchor"] = anchorId;
  });
}

export function rehypeParagraphAnchors() {
  return (tree: Root) => {
    applyParagraphAnchors(tree);
  };
}
