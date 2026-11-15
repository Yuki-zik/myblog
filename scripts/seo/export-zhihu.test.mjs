import test from "node:test";
import assert from "node:assert/strict";
import { convertMarkdownForZhihu } from "./export-zhihu.mjs";

test("convertMarkdownForZhihu expands Tufte footnotes, rewrites relative links to a-znk.com, and strips spoilers", () => {
  const sample = `---
title: 测试文章
summary: 一句清晰的核心摘要。
---

这是第一段[^note-1]，并引用[主题页](/topics/agent-engineering)与 :spoiler[隐藏词]。

[^note-1]: 这是边注正文。
`;
  const output = convertMarkdownForZhihu(sample, {
    canonicalPath: "/posts/test-post",
    kind: "post"
  });

  assert(output.includes("https://a-znk.com/posts/test-post"));
  assert(output.includes("[主题页](https://a-znk.com/topics/agent-engineering)"));
  assert(!output.includes("[^note-1]"));
  assert(output.includes("[1]"));
  assert(output.includes("1. 这是边注正文。"));
  assert(output.includes("隐藏词"));
  assert(!output.includes(":spoiler"));
});

test("convertMarkdownForZhihu preserves inline code spans, fenced blocks, and undefined footnote markers verbatim", () => {
  const sample = `---
title: 代码语法保护测试
summary: 验证代码块与行内反引号不被误替换。
---

把解释性注释写成 \`[^note-example]\` 或 \`:spoiler[secret]\` 或 \`[示例](/posts/demo)\`，而未定义的正文引用[^unknown-id]也保持原样。

\`\`\`markdown
[^note-in-fence]: 这里不应被提取为脚注
[相对链接](/posts/keep-relative)
\`\`\`
`;
  const output = convertMarkdownForZhihu(sample, {
    canonicalPath: "/posts/paragraph-anchor-design",
    kind: "post"
  });

  assert(output.includes("`[^note-example]`"));
  assert(output.includes("`:spoiler[secret]`"));
  assert(output.includes("`[示例](/posts/demo)`"));
  assert(output.includes("[^unknown-id]"));
  assert(output.includes("[^note-in-fence]: 这里不应被提取为脚注"));
  assert(output.includes("[相对链接](/posts/keep-relative)"));
  assert(!output.includes("## 附注与参考说明"));
});
