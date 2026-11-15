import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { extractSitemapUrls } from "./indexnow-utils.mjs";

const ORIGIN = (process.env.SEO_AUDIT_ORIGIN ?? "https://a-znk.com").replace(/\/$/, "");
const BAIDU_UA = "Baiduspider (+http://www.baidu.com/search/spider.html)";
const KEY = "1f4849388e587d6cc6e6895197d146371b570010e26f487f";

async function read(path, userAgent) {
  const url = ORIGIN + path;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: userAgent ? { "User-Agent": userAgent } : {},
        signal: AbortSignal.timeout(20000)
      });
      assert.equal(response.status, 200, url + " must respond HTTP 200");
      return { body: await response.text(), headers: response.headers };
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

const robots = (await read("/robots.txt")).body;
assert.ok(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), "robots.txt sitemap origin");
assert.match(robots, /User-agent: \*/);
assert.match(robots, /User-agent: OAI-SearchBot/);
for (const geoPath of ["/llms.txt", "/en/llms.txt", "/llms-full.txt", "/en/llms-full.txt"]) {
  const { body, headers } = await read(geoPath);
  assert.ok(body.startsWith("# "), geoPath + " must start with Markdown heading");
  const robotsTag = headers.get("x-robots-tag") ?? "";
  if (geoPath.endsWith("llms-full.txt")) {
    assert.match(robotsTag, /noindex/i, geoPath + " must send X-Robots-Tag noindex");
  } else {
    assert.ok(!/noindex/i.test(robotsTag), geoPath + " must remain indexable");
  }
}
for (const mdPath of ["/posts/myblog-design-manual.md", "/papers/duap-multilingual-speech-privacy.md"]) {
  const { body, headers } = await read(mdPath);
  assert.ok(body.startsWith("# "), mdPath + " must start with Markdown heading");
  assert.match(headers.get("x-robots-tag") ?? "", /noindex/i, mdPath + " must send X-Robots-Tag noindex");
}
for (const dataPath of ["/papers/duap-multilingual-speech-privacy.bib", "/agents/dataset.json", "/agents/dataset.csv"]) {
  const { body, headers } = await read(dataPath);
  assert.ok(body.trim().length > 20, dataPath + " must be non-empty");
  assert.match(headers.get("x-robots-tag") ?? "", /noindex/i, dataPath + " must send X-Robots-Tag noindex");
}
const { body: directXml } = await read("/sitemap.xml");
assert.match(directXml, /<urlset\b/);
const urls = extractSitemapUrls(directXml, ORIGIN);
const allLocs = [...directXml.matchAll(/<loc>([^<]+)<\/loc>/g)];
assert.ok(urls.length >= 1, "public sitemap cannot be empty");
assert.equal(urls.length, allLocs.length, "foreign URLs are forbidden");
assert.equal(new Set(urls).size, urls.length, "sitemap cannot contain duplicate URLs");

const { body: oldIndex } = await read("/sitemap-index.xml");
assert.match(oldIndex, /<sitemapindex\b/);
const { body: oldChild } = await read("/sitemap-0.xml");
const oldUrls = extractSitemapUrls(oldChild, ORIGIN);
const normalize = (url) => new URL(url).toString();
assert.deepEqual(
  urls.map(normalize).sort(),
  oldUrls.map(normalize).sort(),
  "direct and indexed sitemaps must agree"
);

const localKey = readFileSync(new URL("../../public/" + KEY + ".txt", import.meta.url), "utf8").trim();
assert.equal(localKey, KEY, "IndexNow key file must match the checked-in key");
assert.equal((await read("/" + KEY + ".txt")).body.trim(), KEY, "IndexNow key must be public");

const issues = [];
let ogPaperCount = 0;
let shortDescriptions = 0;
const work = async (url) => {
  const path = new URL(url).pathname;
  const { body, headers } = await read(path, BAIDU_UA);
  const locale = /^\/en(?:\/|$)/.test(path) ? "en" : "zh-CN";
  assert.ok(body.includes(`lang="${locale}"`), path + " html language");
  assert.match(body, /<title[^>]*>[^<]+<\/title>/, path + " title");
  const description = body.match(/<meta name="description" content="([^"]+)"/)?.[1];
  assert.ok(description, path + " description");
  if (description.length < 45) shortDescriptions++;
  assert.match(body, /<h1\b/, path + " heading");
  assert.ok(!/<meta name="robots" content="noindex/i.test(body), path + " noindex meta");
  assert.ok(!/noindex/i.test(headers.get("x-robots-tag") ?? ""), path + " noindex header");
  const canonical = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  assert.equal(canonical, normalize(url), path + " canonical URL");
  const og = body.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  assert.ok(og, path + " og:image");
  if ((path.startsWith("/papers/") || path.startsWith("/en/papers/")) && !/paper-status--prototype/.test(body)) {
    const expectedOgPath = path.startsWith("/en/")
      ? "/og/en" + path.slice("/en".length) + ".png"
      : "/og" + path + ".png";
    assert.equal(og, ORIGIN + expectedOgPath, path + " paper OG image");
    ogPaperCount++;
  }
};

for (let i = 0; i < urls.length; i += 3) {
  await Promise.all(urls.slice(i, i + 3).map(async (url) => {
    try {
      await work(url);
    } catch (error) {
      issues.push({ url, error: error instanceof Error ? error.message : String(error) });
    }
  }));
}

for (const item of issues) console.error("SEO audit failure:", item.url, item.error);
assert.equal(issues.length, 0, "production HTML audits must pass");
console.log("Production SEO audit passed: " + urls.length +
  " canonical multilingual pages, " + ogPaperCount +
  " papers with OG images, " + shortDescriptions +
  " short search descriptions for editorial review.");
