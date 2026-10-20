import { strict as assert } from "node:assert";

const origin = "https://a-znk.com";
async function get(path, userAgent) {
  const response = await fetch(origin + path, {
    redirect: "follow",
    headers: userAgent ? { "User-Agent": userAgent } : {},
    signal: AbortSignal.timeout(20000)
  });
  assert.equal(response.status, 200, path + " status");
  return { text: await response.text(), response };
}

const { text: robots } = await get("/robots.txt");
assert.match(robots, /Sitemap: https:\/\/a-znk\.com\/sitemap\.xml/);

const { text: sitemap } = await get("/sitemap.xml");
assert.match(sitemap, /<urlset /);
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
assert.ok(urls.length >= 1 && urls.every((url) => url.startsWith(origin + "/")));
assert.equal(new Set(urls).size, urls.length, "unique canonicals");

for (const path of ["/", "/posts/ant-ai-coding-review", "/papers"]) {
  const { text, response } = await get(path, "Baiduspider (+http://www.baidu.com/search/spider.html)");
  assert.match(text, /<html[^>]+lang="zh-CN"/, path + " lang");
  assert.match(text, /<link rel="canonical" href="https:\/\/a-znk\.com\//, path + " canonical");
  assert.doesNotMatch(response.headers.get("x-robots-tag") ?? "", /noindex/i);
  assert.ok(!/<meta name="robots" content="noindex/.test(text), path + " robots");
}

console.log("SEO live audit passed: " + urls.length + " sitemap URLs, crawler-readable HTML and canonical URLs.");
