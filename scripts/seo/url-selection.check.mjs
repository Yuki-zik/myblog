import test from "node:test";
import assert from "node:assert/strict";
import { canonicalizeUrl, sitemapUrls, selectUrlsForChanges } from "./url-selection.mjs";

const all = [
  "https://a-znk.com/",
  "https://a-znk.com/posts/foo",
  "https://a-znk.com/papers/bar",
  "https://a-znk.com/topics/ai-coding"
];

test("canonical URLs reject external hosts and parameters", () => {
  assert.equal(canonicalizeUrl("https://a-znk.com"), "https://a-znk.com/");
  assert.equal(canonicalizeUrl("https://evil.example/posts/foo"), undefined);
  assert.equal(canonicalizeUrl("https://a-znk.com/posts/foo?track=1"), undefined);
});

test("sitemap parsing deduplicates normal URLs", () => {
  const xml = "<urlset><url><loc>https://a-znk.com</loc></url><url><loc>https://a-znk.com/</loc></url></urlset>";
  assert.deepEqual(sitemapUrls(xml), ["https://a-znk.com/"]);
});

test("only modified published content is announced", () => {
  assert.deepEqual(selectUrlsForChanges([
    "src/content/posts/foo.md",
    "src/content/posts/foo.md",
    "src/content/posts/draft.md",
    "src/content/papers/bar.md",
    "src/content/posts/covers/foo.png",
    "docs/notes.md"
  ], all), ["https://a-znk.com/papers/bar", "https://a-znk.com/posts/foo"]);
});

test("global markup change or manual dispatch announces all", () => {
  assert.deepEqual(selectUrlsForChanges(["src/layouts/BaseLayout.astro"], all), [...all].sort());
  assert.deepEqual(selectUrlsForChanges([], all, true), [...all].sort());
});

test("non-content changes do not cause unnecessary re-submissions", () => {
  assert.deepEqual(selectUrlsForChanges(["README.md", "src/styles/site.css"], all), []);
});
