import { describe, expect, it } from "vitest";
import type { Root, Element } from "hast";
import { applyParagraphAnchors } from "./rehypeParagraphAnchors";

function runPlugin(tree: Root): Root {
  applyParagraphAnchors(tree);
  return tree;
}

function getAnchor(element: Element): string | undefined {
  return element.properties?.["data-anchor"] as string | undefined;
}

describe("rehypeParagraphAnchors", () => {
  it("为 root 和 section 段落按规则注入 anchor", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "root p1" }] },
        { type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: "Section A" }] },
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "section p1" }] },
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "section p2" }] }
      ]
    };

    runPlugin(tree);
    const [p1, , p2, p3] = tree.children as Element[];

    expect(getAnchor(p1)).toBe("root::p1");
    expect(getAnchor(p2)).toBe("section-a::p1");
    expect(getAnchor(p3)).toBe("section-a::p2");
    expect(p2.properties?.id).toBe("c-section-a::p1");
  });

  it("重复 heading 时 slug 稳定并自动去重", () => {
    const tree: Root = {
      type: "root",
      children: [
        { type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: "Repeat" }] },
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "first" }] },
        { type: "element", tagName: "h2", properties: {}, children: [{ type: "text", value: "Repeat" }] },
        { type: "element", tagName: "p", properties: {}, children: [{ type: "text", value: "second" }] }
      ]
    };

    runPlugin(tree);
    const [, firstParagraph, , secondParagraph] = tree.children as Element[];

    expect(getAnchor(firstParagraph)).toBe("repeat::p1");
    expect(getAnchor(secondParagraph)).toBe("repeat-1::p1");
  });

  it("排除 blockquote/li/table/details/figcaption 内的 p", () => {
    const tree: Root = {
      type: "root",
      children: [
        {
          type: "element",
          tagName: "blockquote",
          properties: {},
          children: [
            {
              type: "element",
              tagName: "p",
              properties: {},
              children: [{ type: "text", value: "inside blockquote" }]
            }
          ]
        },
        {
          type: "element",
          tagName: "p",
          properties: {},
          children: [{ type: "text", value: "normal paragraph" }]
        }
      ]
    };

    runPlugin(tree);
    const blockquote = tree.children[0] as Element;
    const paragraphInBlockquote = blockquote.children[0] as Element;
    const normalParagraph = tree.children[1] as Element;

    expect(getAnchor(paragraphInBlockquote)).toBeUndefined();
    expect(getAnchor(normalParagraph)).toBe("root::p1");
  });
});
