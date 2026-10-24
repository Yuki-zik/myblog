import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const root = resolve("dist");
const sitemap = await readFile(resolve(root, "sitemap.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]));
const paths = new Set(urls.map(url => url.pathname));
const english = urls.filter(url => /^\/en(?:\/|$)/.test(url.pathname));
assert(english.length >= 6, "English public routes are missing from sitemap");
const errors = [];
for (const url of english) {
  const path = url.pathname;
  const source = path.replace(/^\/en/, "") || "/";
  try {
    assert(paths.has(source), `Missing Chinese counterpart: ${source}`);
    const file = resolve(root, path.slice(1), "index.html");
    const document = new JSDOM(await readFile(file, "utf8")).window.document;
    assert.equal(document.documentElement.lang, "en", `${path}: HTML language`);
    assert.equal(document.querySelector('link[rel="canonical"]')?.href, url.href, `${path}: own canonical`);
    const alternates = [...document.querySelectorAll('link[rel="alternate"][hreflang]')];
    for (const [lang, expected] of [["en", path], ["zh-CN", source], ["x-default", source]]) {
      assert.equal(alternates.find(link => link.hreflang === lang)?.href, new URL(expected, url).href, `${path}: ${lang} alternate`);
    }
    const original = new JSDOM(await readFile(resolve(root, source.slice(1), "index.html"), "utf8")).window.document;
    assert.equal(original.querySelector('link[hreflang="en"]')?.href, url.href, `${source}: reciprocal alternate`);
    assert.equal(new URL(document.querySelector('[data-language-switch]')?.href, url).pathname, source, `${path}: corresponding-page switch`);
    assert(!document.querySelector('meta[name="robots"]')?.content.includes("noindex"), `${path}: English edition must be indexable`);
    assert(document.title.trim(), `${path}: title`);
    assert(document.querySelector('meta[name="description"]')?.content.trim(), `${path}: description`);
    for (const link of document.querySelectorAll('a[href^="/"]:not([data-language-switch])')) {
      const target = new URL(link.getAttribute("href"), url).pathname;
      assert(!/^\/(?:posts|topics|concepts|papers|author|archives|map)(?:\/|$)/.test(target), `${path}: link returns to Chinese: ${target}`);
      if (/^\/en(?:\/|$)/.test(target) && !/\.[a-z]+$/.test(target)) assert(paths.has(target), `${path}: broken English link ${target}`);
    }
    for (const image of document.querySelectorAll('meta[property="og:image"]')) {
      const target = new URL(image.content, url);
      if (target.origin === url.origin) await access(resolve(root, target.pathname.slice(1)));
    }
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      const graph = JSON.parse(script.textContent)["@graph"];
      for (const node of graph ?? []) if (node.inLanguage) assert.equal(node.inLanguage, "en", `${path}: schema language`);
    }
    document.querySelectorAll('script, style, [data-language-switch]').forEach(node => node.remove());
    const walker = document.createTreeWalker(document.body, 4);
    const untranslated = [];
    while (walker.nextNode()) if (/[\u3400-\u9fff]/.test(walker.currentNode.textContent)) untranslated.push(walker.currentNode.textContent.trim());
    assert.deepEqual(untranslated, [], `${path}: untranslated interface text`);
  } catch (error) { errors.push(error.message); }
}
const search = JSON.parse(await readFile(resolve(root, "en/search-index.json"), "utf8"));
for (const item of search) {
  assert(item.url.startsWith("/en/"), `English search returns a Chinese route: ${item.url}`);
  assert(paths.has(item.url), `English search returns a missing page: ${item.url}`);
}
const rss = await readFile(resolve(root, "en/rss.xml"), "utf8");
assert(rss.includes("<language>en</language>"), "English RSS language missing");
assert(rss.includes("/en/posts/"), "English RSS article URLs missing");
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Bilingual build check passed: ${english.length} English pages, ${english.length} reciprocal Chinese pages, ${search.length} English search entries.`);
