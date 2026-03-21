import type { Element, Root } from "hast";
import { visitParents } from "unist-util-visit-parents";

type HastNode = {
  type?: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: unknown[];
};

type VFileLike = {
  path?: string;
  data?: Record<string, unknown>;
};

export interface TufteRailFootnote {
  id: string;
  label: string;
  html: string;
  anchorId?: string;
  referenceOrder?: number;
}

export const TUFTE_MARKDOWN_FOOTNOTES_KEY = "tufteMarkdownFootnotes";
export const TUFTE_RAIL_FOOTNOTE_ID_PREFIX = "marginalia-footnote-";

function isElementNode(node: unknown): node is Element {
  if (!node || typeof node !== "object") {
    return false;
  }

  const candidate = node as HastNode;
  return candidate.type === "element" && typeof candidate.tagName === "string";
}

function getProperty(properties: Record<string, unknown> | undefined, key: string): unknown {
  if (!properties) {
    return undefined;
  }

  if (key in properties) {
    return properties[key];
  }

  const camelKey = key.replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());
  return properties[camelKey];
}

function hasTruthyDataProperty(element: Element, key: string): boolean {
  const value = getProperty(element.properties as Record<string, unknown> | undefined, key);
  return value === true || value === "" || value === "true" || value === 1;
}

function toClassList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item ?? "")))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }

  return [];
}

function hasClass(element: Element, className: string): boolean {
  return toClassList((element.properties as Record<string, unknown> | undefined)?.className).includes(className);
}

function addClass(element: Element, className: string): void {
  element.properties ??= {};
  const existing = toClassList((element.properties as Record<string, unknown>).className);
  if (!existing.includes(className)) {
    (element.properties as Record<string, unknown>).className = [...existing, className];
  }
}

function setDataFlag(element: Element, key: string): void {
  element.properties ??= {};
  (element.properties as Record<string, unknown>)[key] = true;
}

function relIncludesFootnote(element: Element): boolean {
  const relValue = getProperty(element.properties as Record<string, unknown> | undefined, "rel");
  const relList = toClassList(relValue);
  return relList.some((token) => token.toLowerCase().includes("footnote"));
}

function isFootnoteRefLink(element: Element): boolean {
  if (String(element.tagName) !== "a") {
    return false;
  }

  return (
    hasTruthyDataProperty(element, "data-footnote-ref") ||
    hasTruthyDataProperty(element, "dataFootnoteRef") ||
    relIncludesFootnote(element)
  );
}

function isFootnoteBackrefLink(element: Element): boolean {
  if (String(element.tagName) !== "a") {
    return false;
  }

  return (
    hasTruthyDataProperty(element, "data-footnote-backref") ||
    hasTruthyDataProperty(element, "dataFootnoteBackref")
  );
}

function isFootnoteContainer(element: Element): boolean {
  const tagName = String(element.tagName);
  if (tagName !== "section" && tagName !== "div") {
    return false;
  }

  return (
    hasTruthyDataProperty(element, "data-footnotes") ||
    hasTruthyDataProperty(element, "dataFootnotes") ||
    hasClass(element, "footnotes")
  );
}

function isFootnoteListItem(element: Element): boolean {
  if (String(element.tagName) !== "li") {
    return false;
  }

  const idValue = getProperty(element.properties as Record<string, unknown> | undefined, "id");
  const id = typeof idValue === "string" ? idValue : "";
  return id.includes("fn");
}

function supContainsFootnoteRef(element: Element): boolean {
  if (String(element.tagName) !== "sup") {
    return false;
  }

  return (element.children ?? []).some((child) => isElementNode(child) && isFootnoteRefLink(child));
}

function hasFootnoteContainerAncestor(ancestors: unknown[]): boolean {
  return ancestors.some((ancestor) => isElementNode(ancestor) && isFootnoteContainer(ancestor));
}

function normalizeFootnoteId(rawValue: string): string {
  const trimmed = rawValue.trim().replace(/^#/, "");
  return trimmed
    .replace(/^user-content-fnref-/, "")
    .replace(/^user-content-fn-/, "")
    .replace(/^fnref-/, "")
    .replace(/^fn-/, "");
}

function getParagraphAnchorFromAncestors(ancestors: unknown[]): string | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!isElementNode(ancestor) || String(ancestor.tagName) !== "p") {
      continue;
    }

    const value = getProperty(ancestor.properties as Record<string, unknown> | undefined, "data-anchor");
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function getListItemAncestor(ancestors: unknown[]): Element | undefined {
  for (let index = ancestors.length - 1; index >= 0; index -= 1) {
    const ancestor = ancestors[index];
    if (!isElementNode(ancestor) || String(ancestor.tagName) !== "li") {
      continue;
    }

    return ancestor;
  }

  return undefined;
}

function getElementAnchorId(element: Element): string | undefined {
  const value = getProperty(element.properties as Record<string, unknown> | undefined, "data-anchor");
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getListItemIndex(element: Element, ancestors: unknown[]): number | undefined {
  const parent = ancestors[ancestors.length - 1];
  const siblings =
    parent && typeof parent === "object" && Array.isArray((parent as HastNode).children)
      ? (parent as HastNode).children
      : undefined;
  if (!Array.isArray(siblings)) {
    return undefined;
  }

  let itemIndex = 0;
  for (const sibling of siblings) {
    if (!isElementNode(sibling) || String(sibling.tagName) !== "li") {
      continue;
    }

    itemIndex += 1;
    if (sibling === element) {
      return itemIndex;
    }
  }

  return undefined;
}

function ensureListItemAnchor(element: Element, ancestors: unknown[], baseAnchorId: string): string {
  const existing = getElementAnchorId(element);
  if (existing) {
    return existing;
  }

  const listItemIndex = getListItemIndex(element, ancestors) ?? 1;
  const anchorId = `${baseAnchorId}::li${listItemIndex}`;
  element.properties ??= {};
  (element.properties as Record<string, unknown>).id = `c-${anchorId}`;
  (element.properties as Record<string, unknown>)["data-anchor"] = anchorId;
  return anchorId;
}

function isPostContentFile(file: VFileLike | undefined): boolean {
  const rawPath = String(file?.path ?? "");
  if (!rawPath) {
    return false;
  }

  const normalized = rawPath.replace(/\\/g, "/");
  return normalized.includes("/content/posts/");
}

function ensureAstroFrontmatterStore(file: VFileLike): Record<string, unknown> {
  file.data ??= {};
  const astroData = ((file.data as Record<string, unknown>).astro ??= {}) as Record<string, unknown>;
  return (astroData.frontmatter ??= {}) as Record<string, unknown>;
}

function cloneNode<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function propertyNameToAttrName(key: string): string {
  if (key === "className") {
    return "class";
  }
  return key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function serializeAttributes(properties: Record<string, unknown> | undefined): string {
  if (!properties) {
    return "";
  }

  const entries = Object.entries(properties)
    .filter(([key]) => key !== "id")
    .flatMap(([key, value]) => {
      if (value === undefined || value === null || value === false) {
        return [];
      }

      const attrName = propertyNameToAttrName(key);
      if (value === true) {
        return [[attrName, ""] as const];
      }

      if (Array.isArray(value)) {
        return [[attrName, value.map((item) => String(item)).join(" ")] as const];
      }

      return [[attrName, String(value)] as const];
    });

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([name, value]) => (value === "" ? ` ${name}` : ` ${name}="${escapeHtml(value)}"`))
    .join("");
}

function serializeHastNode(node: unknown): string {
  if (!node || typeof node !== "object") {
    return "";
  }

  const candidate = node as Record<string, unknown>;
  const type = candidate.type;

  if (type === "text") {
    return escapeHtml(String(candidate.value ?? ""));
  }

  if (type === "root") {
    const children = Array.isArray(candidate.children) ? candidate.children : [];
    return children.map((child) => serializeHastNode(child)).join("");
  }

  if (!isElementNode(candidate)) {
    return "";
  }

  const tagName = candidate.tagName;
  const attrs = serializeAttributes(candidate.properties as Record<string, unknown> | undefined);
  const children = (candidate.children ?? []).map((child) => serializeHastNode(child)).join("");
  return `<${tagName}${attrs}>${children}</${tagName}>`;
}

function stripBackrefs(node: unknown): unknown | null {
  if (!node || typeof node !== "object") {
    return node;
  }

  if (isElementNode(node) && isFootnoteBackrefLink(node)) {
    return null;
  }

  const cloned = cloneNode(node as Record<string, unknown>);
  if (Array.isArray((cloned as HastNode).children)) {
    (cloned as HastNode).children = ((cloned as HastNode).children ?? [])
      .map((child) => stripBackrefs(child))
      .filter((child) => child !== null);
  }

  if (isElementNode(cloned) && typeof cloned.properties === "object") {
    delete (cloned.properties as Record<string, unknown>).id;
  }

  return cloned;
}

function extractFootnotesForRail(
  tree: Root,
  refMetaByFootnoteId?: Map<string, { anchorId?: string; referenceOrder: number }>
): TufteRailFootnote[] {
  const container = (tree.children ?? []).find((child) => isElementNode(child) && isFootnoteContainer(child));
  if (!isElementNode(container)) {
    return [];
  }

  const orderedList = (container.children ?? []).find(
    (child) => isElementNode(child) && String(child.tagName) === "ol"
  );

  if (!isElementNode(orderedList)) {
    return [];
  }

  const items = ((orderedList.children ?? []).filter(
    (child): child is Element => isElementNode(child) && isFootnoteListItem(child)
  ) ?? []) as Element[];

  return items.map((item, index) => {
    const idValue = getProperty(item.properties as Record<string, unknown> | undefined, "id");
    const normalizedId = normalizeFootnoteId(typeof idValue === "string" ? idValue : String(index + 1));
    const sanitizedChildren = ((item.children ?? [])
      .map((child: unknown) => stripBackrefs(child))
      .filter((child: unknown): child is NonNullable<unknown> => child !== null) ?? []) as Root["children"];
    const html = serializeHastNode({ type: "root", children: sanitizedChildren }).trim();

    return {
      id: normalizedId || String(index + 1),
      label: String(index + 1),
      html,
      anchorId: refMetaByFootnoteId?.get(normalizedId)?.anchorId,
      referenceOrder: refMetaByFootnoteId?.get(normalizedId)?.referenceOrder
    };
  });
}

function removeFootnoteContainerFromTree(tree: Root): void {
  tree.children = (tree.children ?? []).filter((child) => !(isElementNode(child) && isFootnoteContainer(child)));
}

function rewriteFootnoteRefTargetsForRail(tree: Root): void {
  visitParents(tree, "element", (node) => {
    const element = node as Element;
    if (!isFootnoteRefLink(element)) {
      return;
    }

    element.properties ??= {};
    const hrefValue = getProperty(element.properties as Record<string, unknown>, "href");
    if (typeof hrefValue !== "string") {
      return;
    }

    const footnoteId = normalizeFootnoteId(hrefValue);
    if (!footnoteId) {
      return;
    }

    (element.properties as Record<string, unknown>).href = `#${TUFTE_RAIL_FOOTNOTE_ID_PREFIX}${footnoteId}`;
    (element.properties as Record<string, unknown>)["data-footnote-rail-target"] = footnoteId;
  });
}

export function applyTufteFootnoteClasses(tree: Root): void {
  visitParents(tree, "element", (node, ancestors) => {
    const element = node as Element;

    if (isFootnoteContainer(element)) {
      addClass(element, "tufte-footnotes");
      setDataFlag(element, "data-tufte-footnotes");
    }

    if (supContainsFootnoteRef(element)) {
      addClass(element, "tufte-footnote-sup");
    }

    if (isFootnoteRefLink(element)) {
      addClass(element, "tufte-footnote-ref");
      setDataFlag(element, "data-footnote-ref-anchor");
    }

    if (isFootnoteBackrefLink(element)) {
      addClass(element, "tufte-footnote-backref");
    }

    if (isFootnoteListItem(element) && hasFootnoteContainerAncestor(ancestors)) {
      addClass(element, "tufte-footnote-item");
    }
  });
}

function collectFootnoteRefMeta(tree: Root): Map<string, { anchorId?: string; referenceOrder: number }> {
  const meta = new Map<string, { anchorId?: string; referenceOrder: number }>();
  let order = 0;
  let lastAnchorId: string | undefined;

  visitParents(tree, "element", (node, ancestors) => {
    const element = node as Element;
    const ownAnchorId = getElementAnchorId(element);
    if (ownAnchorId) {
      lastAnchorId = ownAnchorId;
    }

    if (!isFootnoteRefLink(element) || hasFootnoteContainerAncestor(ancestors)) {
      return;
    }

    const hrefValue = getProperty(element.properties as Record<string, unknown> | undefined, "href");
    if (typeof hrefValue !== "string") {
      return;
    }

    const footnoteId = normalizeFootnoteId(hrefValue);
    if (!footnoteId || meta.has(footnoteId)) {
      return;
    }

    order += 1;
    const paragraphAnchorId = getParagraphAnchorFromAncestors(ancestors);
    const listItemAncestor = paragraphAnchorId ? undefined : getListItemAncestor(ancestors);
    const anchorId =
      paragraphAnchorId ||
      (listItemAncestor && lastAnchorId ? ensureListItemAnchor(listItemAncestor, ancestors, lastAnchorId) : undefined);

    meta.set(footnoteId, {
      anchorId,
      referenceOrder: order
    });
  });

  return meta;
}

export function rehypeTufteFootnotes() {
  return (tree: Root, file?: VFileLike) => {
    applyTufteFootnoteClasses(tree);

    if (!file || !isPostContentFile(file)) {
      return;
    }

    const refMeta = collectFootnoteRefMeta(tree);
    const footnotes = extractFootnotesForRail(tree, refMeta);
    const frontmatter = ensureAstroFrontmatterStore(file);
    frontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY] = footnotes;

    if (footnotes.length === 0) {
      return;
    }

    rewriteFootnoteRefTargetsForRail(tree);
    removeFootnoteContainerFromTree(tree);
  };
}
