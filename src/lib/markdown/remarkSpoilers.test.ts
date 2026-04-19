import { describe, expect, it } from "vitest";
import { remarkSpoilers } from "./remarkSpoilers";

type TestNode = {
  type: string;
  name?: string;
  label?: string | null;
  value?: string;
  depth?: number;
  attributes?: Record<string, string>;
  children?: TestNode[];
  data?: {
    hName?: string;
    hProperties?: Record<string, unknown>;
  };
};

function text(value: string): TestNode {
  return { type: "text", value };
}

function paragraph(value: string): TestNode {
  return {
    type: "paragraph",
    children: [text(value)]
  };
}

function runTransform(children: TestNode[], path = "/repo/src/content/posts/spoiler-demo.md"): TestNode {
  const tree: TestNode = {
    type: "root",
    children
  };

  const transformer = remarkSpoilers();
  transformer(tree as never, {
    path,
    data: {}
  } as never);

  return tree;
}

describe("remarkSpoilers", () => {
  it("transforms block spoilers into details with a summary node", () => {
    const tree = runTransform([
      {
        type: "containerDirective",
        name: "spoiler",
        label: "结局剧透",
        children: [
          paragraph("这里是隐藏段落。"),
          {
            type: "list",
            children: [
              {
                type: "listItem",
                children: [paragraph("隐藏要点")]
              }
            ]
          }
        ]
      }
    ]);

    const spoiler = tree.children?.[0];
    expect(spoiler?.data?.hName).toBe("details");
    expect(spoiler?.data?.hProperties).toMatchObject({
      "data-spoiler": "",
      className: ["post-spoiler"]
    });

    const summary = spoiler?.children?.[0];
    expect(summary?.data?.hName).toBe("summary");
    expect(summary?.data?.hProperties).toMatchObject({
      "data-spoiler-summary": "",
      className: ["post-spoiler__summary"],
      "aria-label": "结局剧透"
    });
    expect(summary?.children).toEqual([text("结局剧透")]);
    expect(spoiler?.children?.[1]?.type).toBe("paragraph");
    expect(spoiler?.children?.[2]?.type).toBe("list");
  });

  it("renders unlabeled block spoilers with accessible blank-summary semantics", () => {
    const tree = runTransform([
      {
        type: "containerDirective",
        name: "spoiler",
        children: [paragraph("隐藏内容")]
      }
    ]);

    const spoiler = tree.children?.[0];
    const summary = spoiler?.children?.[0];

    expect(summary?.data?.hProperties).toMatchObject({
      "data-spoiler-summary": "",
      "data-spoiler-blank": "",
      "aria-label": "点击揭示剧透"
    });
    expect(summary?.children ?? []).toHaveLength(0);
  });

  it("transforms inline spoilers into toggle buttons", () => {
    const tree = runTransform([
      {
        type: "paragraph",
        children: [
          text("行内 "),
          {
            type: "textDirective",
            name: "spoiler",
            children: [text("隐藏答案")]
          },
          text(" 示例。")
        ]
      }
    ]);

    const inlineSpoiler = tree.children?.[0]?.children?.[1];
    expect(inlineSpoiler?.data?.hName).toBe("button");
    expect(inlineSpoiler?.data?.hProperties).toMatchObject({
      type: "button",
      "data-spoiler-inline": "",
      className: ["post-inline-spoiler"],
      "aria-pressed": "false",
      "aria-label": "点击揭示剧透"
    });
  });

  it("rejects spoiler directives outside posts", () => {
    expect(() =>
      runTransform(
        [
          {
            type: "containerDirective",
            name: "spoiler",
            children: [paragraph("不应该允许")]
          }
        ],
        "/repo/src/content/topics/knowledge-network.md"
      )
    ).toThrow(/spoiler directives are only supported in posts/i);
  });

  it("rejects headings inside block spoilers", () => {
    expect(() =>
      runTransform([
        {
          type: "containerDirective",
          name: "spoiler",
          children: [
            {
              type: "heading",
              depth: 2,
              children: [text("不会进入目录的标题")]
            }
          ]
        }
      ])
    ).toThrow(/does not allow markdown headings/i);
  });

  it("rejects footnotes inside block spoilers", () => {
    expect(() =>
      runTransform([
        {
          type: "containerDirective",
          name: "spoiler",
          children: [
            {
              type: "paragraph",
              children: [
                text("脚注 "),
                {
                  type: "footnoteReference",
                  identifier: "note-hidden"
                } as TestNode
              ]
            }
          ]
        }
      ])
    ).toThrow(/does not allow footnotes/i);
  });

  it("rejects nested spoilers", () => {
    expect(() =>
      runTransform([
        {
          type: "containerDirective",
          name: "spoiler",
          children: [
            {
              type: "containerDirective",
              name: "spoiler",
              label: "内层",
              children: [paragraph("嵌套内容")]
            }
          ]
        }
      ])
    ).toThrow(/does not allow nested spoilers/i);
  });
});
