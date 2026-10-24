import assert from "node:assert/strict";
import { test } from "node:test";
import { changedPaths, extractSitemapUrls, selectChangedUrls } from "./indexnow-utils.mjs";

const urls = ["https://a-znk.com/", "https://a-znk.com/posts/hello", "https://a-znk.com/papers/x"];

test("only same-host direct sitemap URLs are usable", () => {
  const xml = '<urlset><url><loc>https://a-znk.com/</loc></url>' +
    '<url><loc>https://other.example/</loc></url></urlset>';
  assert.deepEqual(extractSitemapUrls(xml, "https://a-znk.com"), [urls[0]]);
  assert.throws(() => extractSitemapUrls("<sitemapindex/>", "https://a-znk.com"));
});

test("content edits submit only affected canonical URLs", () => {
  assert.deepEqual(
    selectChangedUrls(urls, ["src/content/posts/hello.md", "docs/README.md"]),
    [urls[1]]
  );
  assert.deepEqual(
    selectChangedUrls(urls, ["src/content/papers/x.md"]),
    [urls[2]]
  );
  assert.deepEqual(selectChangedUrls(urls, ["docs/README.md"]), []);
});

test("post cover edits submit the corresponding published article", () => {
  assert.deepEqual(selectChangedUrls(urls, ["src/content/posts/covers/hello.svg"]), [urls[1]]);
  assert.deepEqual(selectChangedUrls(urls, ["src/content/posts/covers/hello.png"]), [urls[1]]);
});

test("shared templates and SEO code trigger a complete refresh", () => {
  assert.deepEqual(selectChangedUrls(urls, ["src/pages/author.astro"]), urls);
  assert.deepEqual(selectChangedUrls(urls, [], true), urls);
  assert.equal(changedPaths(["src/content/posts/hello.md"]).all, false);
});


test("translated content submits its own canonical English URL", () => {
  const bilingual = [...urls, "https://a-znk.com/en/posts/hello"];
  assert.deepEqual(selectChangedUrls(bilingual, ["src/content/en/posts/hello.md"]), [bilingual[3]]);
  assert.deepEqual(selectChangedUrls(bilingual, ["src/content/posts/covers/hello.svg"]), [bilingual[1], bilingual[3]]);
  assert.deepEqual(selectChangedUrls(bilingual, ["src/lib/i18n/en.json"]), bilingual);
});
