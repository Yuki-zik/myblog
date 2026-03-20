import { describe, expect, it } from "vitest";
import { buildTocTree, flattenTocTree } from "./toc-utils";

describe("buildTocTree", () => {
  it("groups h3 items under the previous h2", () => {
    const tree = buildTocTree([
      { depth: 2, slug: "anchor-rules", text: "锚点规则", index: 1, numberLabel: "1" },
      { depth: 3, slug: "optimistic-ui", text: "状态与回滚", index: 2, numberLabel: "1.1" },
      { depth: 2, slug: "engineering", text: "工程边界", index: 3, numberLabel: "2" }
    ]);

    expect(tree).toEqual([
      {
        id: "anchor-rules",
        title: "锚点规则",
        level: 2,
        children: [{ id: "optimistic-ui", title: "状态与回滚", level: 3 }]
      },
      {
        id: "engineering",
        title: "工程边界",
        level: 2,
        children: []
      }
    ]);
  });

  it("skips orphan h3 items before the first h2", () => {
    const tree = buildTocTree([
      { depth: 3, slug: "orphan", text: "孤立子标题", index: 1, numberLabel: "1.1" },
      { depth: 2, slug: "anchor-rules", text: "锚点规则", index: 2, numberLabel: "1" }
    ]);

    expect(tree).toEqual([
      {
        id: "anchor-rules",
        title: "锚点规则",
        level: 2,
        children: []
      }
    ]);
  });
});

describe("flattenTocTree", () => {
  it("preserves the reading order of h2 and h3 entries", () => {
    const flat = flattenTocTree([
      {
        id: "anchor-rules",
        title: "锚点规则",
        level: 2,
        children: [{ id: "optimistic-ui", title: "状态与回滚", level: 3 }]
      }
    ]);

    expect(flat.map((item) => item.id)).toEqual(["anchor-rules", "optimistic-ui"]);
  });
});
