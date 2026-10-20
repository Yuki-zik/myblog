import test from "node:test";
import assert from "node:assert/strict";
import { enrichSitemapEntry, parseFrontmatterLastmod } from "./sitemap-meta.mjs";

test("post uses explicit updated metadata over original publication date", () => {
  const markdown = "---\ndate: \"2026-01-01T10:00:00+08:00\"\nupdated: \"2026-10-12T16:00:00+08:00\"\n---\nHello";
  assert.equal(parseFrontmatterLastmod(markdown, "posts"), "2026-10-12T08:00:00.000Z");
});

test("paper uses publicationDate and ignores unverified publication year alone", () => {
  assert.equal(
    parseFrontmatterLastmod("---\npublicationDate: '2026-09-01T00:00:00+08:00'\n---\ntext", "papers"),
    "2026-08-31T16:00:00.000Z"
  );
  assert.equal(parseFrontmatterLastmod("---\nyear: 2026\n---\n", "papers"), undefined);
});

test("date metadata must be valid and inside frontmatter", () => {
  assert.equal(parseFrontmatterLastmod("---\ndate: garbage\n---\nupdated: 2026-10-19", "posts"), undefined);
});

test("root path is normalized to the slash-form canonical", async () => {
  assert.deepEqual(
    await enrichSitemapEntry({ url: "https://a-znk.com" }),
    { url: "https://a-znk.com/" }
  );
});

test("existing post metadata is exposed, unrelated routes remain unchanged", async () => {
  const post = await enrichSitemapEntry({ url: "https://a-znk.com/posts/ant-ai-coding-review" });
  assert.equal(post.url, "https://a-znk.com/posts/ant-ai-coding-review");
  assert.match(post.lastmod, /^\d{4}-\d{2}-\d{2}T/);
  assert.deepEqual(
    await enrichSitemapEntry({ url: "https://a-znk.com/topics/agent-engineering" }),
    { url: "https://a-znk.com/topics/agent-engineering" }
  );
});
