import { describe, expect, it } from "vitest";
import type { Element, Root } from "hast";
import {
  TUFTE_MARKDOWN_FOOTNOTES_KEY,
  TUFTE_RAIL_FOOTNOTE_ID_PREFIX,
  applyTufteFootnoteClasses,
  rehypeTufteFootnotes
} from "./rehypeTufteFootnotes";

function getClassList(element: Element): string[] {
  const value = element.properties?.className;
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === "string") {
    return value.split(/\s+/).filter(Boolean);
  }
  return [];
}

function createFootnoteTree(): {
  tree: Root;
  footnoteRefLink: Element;
  footnotes: Element;
  footnoteItem: Element;
  footnoteBackref: Element;
} {
  const footnoteRefLink: Element = {
    type: "element",
    tagName: "a",
    properties: { href: "#user-content-fn-1", dataFootnoteRef: true },
    children: [{ type: "text", value: "1" }]
  };

  const sup: Element = {
    type: "element",
    tagName: "sup",
    properties: {},
    children: [footnoteRefLink]
  };

  const footnoteBackref: Element = {
    type: "element",
    tagName: "a",
    properties: { href: "#user-content-fnref-1", dataFootnoteBackref: true },
    children: [{ type: "text", value: "↩" }]
  };

  const footnoteItem: Element = {
    type: "element",
    tagName: "li",
    properties: { id: "user-content-fn-1" },
    children: [
      {
        type: "element",
        tagName: "p",
        properties: {},
        children: [
          { type: "text", value: "Footnote " },
          { type: "element", tagName: "code", properties: {}, children: [{ type: "text", value: "code" }] },
          { type: "text", value: " " },
          footnoteBackref
        ]
      }
    ]
  };

  const footnotes: Element = {
    type: "element",
    tagName: "section",
    properties: { dataFootnotes: true, className: ["footnotes"] },
    children: [
      {
        type: "element",
        tagName: "ol",
        properties: {},
        children: [footnoteItem]
      }
    ]
  };

  const tree: Root = {
    type: "root",
    children: [
      {
        type: "element",
        tagName: "p",
        properties: { dataAnchor: "root::p1" },
        children: [{ type: "text", value: "Text" }, sup]
      },
      footnotes
    ]
  };

  return {
    tree,
    footnoteRefLink,
    footnotes,
    footnoteItem,
    footnoteBackref
  };
}

describe("rehypeTufteFootnotes", () => {
  it("adds stable classes and data hooks for footnote refs and footnote section", () => {
    const { tree, footnoteRefLink, footnotes, footnoteItem, footnoteBackref } = createFootnoteTree();

    applyTufteFootnoteClasses(tree);

    const sup = ((tree.children[0] as Element).children?.[1] ?? null) as Element;
    expect(getClassList(sup)).toContain("tufte-footnote-sup");
    expect(getClassList(footnoteRefLink)).toContain("tufte-footnote-ref");
    expect(footnoteRefLink.properties?.["data-footnote-ref-anchor"]).toBe(true);
    expect(getClassList(footnotes)).toContain("tufte-footnotes");
    expect(footnotes.properties?.["data-tufte-footnotes"]).toBe(true);
    expect(getClassList(footnoteItem)).toContain("tufte-footnote-item");
    expect(getClassList(footnoteBackref)).toContain("tufte-footnote-backref");
  });

  it("extracts post footnotes to Astro frontmatter, rewrites refs, and removes body footnote section", () => {
    const { tree, footnoteRefLink } = createFootnoteTree();
    const transformer = rehypeTufteFootnotes();
    const file = {
      path: "C:/repo/src/content/posts/example.md",
      data: {}
    };

    transformer(tree, file);

    const frontmatter = ((file.data as any).astro?.frontmatter ?? {}) as Record<string, unknown>;
    const extracted = frontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY] as Array<Record<string, string>>;

    expect(Array.isArray(extracted)).toBe(true);
    expect(extracted).toHaveLength(1);
    expect(extracted[0]?.id).toBe("1");
    expect(extracted[0]?.label).toBe("1");
    expect(extracted[0]?.type).toBe("note");
    expect(extracted[0]?.anchorId).toBe("root::p1");
    expect(extracted[0]?.referenceOrder).toBe(1);
    expect(extracted[0]?.html).toContain("Footnote");
    expect(extracted[0]?.html).toContain("<code>code</code>");
    expect(extracted[0]?.html).not.toContain("data-footnote-backref");

    expect(footnoteRefLink.properties?.href).toBe(`#${TUFTE_RAIL_FOOTNOTE_ID_PREFIX}1`);
    expect(footnoteRefLink.properties?.["data-footnote-rail-target"]).toBe("1");
    expect(tree.children.some((child) => (child as Element).tagName === "section")).toBe(false);
  });

  it("classifies prefixed footnote ids into reference and note types", () => {
    const refLink: Element = {
      type: "element",
      tagName: "a",
      properties: { href: "#user-content-fn-ref-paper", dataFootnoteRef: true },
      children: [{ type: "text", value: "1" }]
    };
    const noteLink: Element = {
      type: "element",
      tagName: "a",
      properties: { href: "#user-content-fn-note-side", dataFootnoteRef: true },
      children: [{ type: "text", value: "2" }]
    };

    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: { dataAnchor: "root::p1", id: "c-root::p1" },
          children: [
            { type: "text", value: "Ref" },
            { type: "element", tagName: "sup", properties: {}, children: [refLink] }
          ]
        },
        {
          type: "element",
          tagName: "p",
          properties: { dataAnchor: "root::p2", id: "c-root::p2" },
          children: [
            { type: "text", value: "Note" },
            { type: "element", tagName: "sup", properties: {}, children: [noteLink] }
          ]
        },
        {
          type: "element",
          tagName: "section",
          properties: { dataFootnotes: true, className: ["footnotes"] },
          children: [
            {
              type: "element",
              tagName: "ol",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "li",
                  properties: { id: "user-content-fn-ref-paper" },
                  children: [
                    {
                      type: "element",
                      tagName: "p",
                      properties: {},
                      children: [{ type: "text", value: "Reference footnote." }]
                    }
                  ]
                },
                {
                  type: "element",
                  tagName: "li",
                  properties: { id: "user-content-fn-note-side" },
                  children: [
                    {
                      type: "element",
                      tagName: "p",
                      properties: {},
                      children: [{ type: "text", value: "Explanatory note." }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const transformer = rehypeTufteFootnotes();
    const file = {
      path: "C:/repo/src/content/posts/example.md",
      data: {}
    };

    transformer(tree, file);

    const frontmatter = ((file.data as any).astro?.frontmatter ?? {}) as Record<string, unknown>;
    const extracted = frontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY] as Array<Record<string, string>>;

    expect(extracted).toEqual([
      expect.objectContaining({
        id: "ref-paper",
        label: "1",
        type: "reference",
        anchorId: "root::p1",
        referenceOrder: 1
      }),
      expect.objectContaining({
        id: "note-side",
        label: "2",
        type: "note",
        anchorId: "root::p2",
        referenceOrder: 2
      })
    ]);
  });

  it("keeps non-post files footnotes in place while still applying classes", () => {
    const { tree, footnotes } = createFootnoteTree();
    const transformer = rehypeTufteFootnotes();
    const file = {
      path: "C:/repo/src/content/concepts/example.md",
      data: {}
    };

    transformer(tree, file);

    expect(getClassList(footnotes)).toContain("tufte-footnotes");
    expect(tree.children.some((child) => (child as Element).tagName === "section")).toBe(true);
    const frontmatter = ((file.data as any).astro?.frontmatter ?? {}) as Record<string, unknown>;
    expect(frontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY]).toBeUndefined();
  });

  it("anchors footnotes referenced from list items to synthetic list-item anchors", () => {
    const footnoteRefLink: Element = {
      type: "element",
      tagName: "a",
      properties: { href: "#user-content-fn-note-5", dataFootnoteRef: true },
      children: [{ type: "text", value: "5" }]
    };

    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "p",
          properties: { dataAnchor: "考试中::p3", id: "c-考试中::p3" },
          children: [{ type: "text", value: "途中按顺序遇到这些坑：" }]
        },
        {
          type: "element",
          tagName: "ul",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "li",
              properties: {},
              children: [
                { type: "text", value: "过于要求最小 MVP" },
                {
                  type: "element",
                  tagName: "sup",
                  properties: {},
                  children: [footnoteRefLink]
                }
              ]
            }
          ]
        },
        {
          type: "element",
          tagName: "section",
          properties: { dataFootnotes: true, className: ["footnotes"] },
          children: [
            {
              type: "element",
              tagName: "ol",
              properties: {},
              children: [
                {
                  type: "element",
                  tagName: "li",
                  properties: { id: "user-content-fn-note-5" },
                  children: [
                    {
                      type: "element",
                      tagName: "p",
                      properties: {},
                      children: [{ type: "text", value: "这里很关键。" }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const transformer = rehypeTufteFootnotes();
    const file = {
      path: "C:/repo/src/content/posts/example.md",
      data: {}
    };

    transformer(tree, file);

    const listItem = ((tree.children[1] as Element).children?.[0] ?? null) as Element;
    const frontmatter = ((file.data as any).astro?.frontmatter ?? {}) as Record<string, unknown>;
    const extracted = frontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY] as Array<Record<string, string>>;

    expect(listItem.properties?.id).toBe("c-考试中::p3::li1");
    expect(listItem.properties?.["data-anchor"]).toBe("考试中::p3::li1");
    expect(extracted[0]?.anchorId).toBe("考试中::p3::li1");
    expect(extracted[0]?.referenceOrder).toBe(1);
  });
});
