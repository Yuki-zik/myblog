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
// Existence alone misses duplicate IDs and semantically wrong anchors.
for (const url of urls) {
  const document = new JSDOM(await readFile(resolve(root, url.pathname.slice(1), "index.html"), "utf8")).window.document;
  const ids = [...document.querySelectorAll("[id]")].map(node => node.id);
  assert.equal(new Set(ids).size, ids.length, `${url.pathname}: duplicate element IDs`);
  for (const note of document.querySelectorAll("[data-footnote-rail-item]")) {
    const anchor = note.getAttribute("data-anchor-id");
    if (!anchor) continue;
    const host = document.getElementById("c-" + anchor);
    assert(host, `${url.pathname}: missing note paragraph ${anchor}`);
    assert([...host.querySelectorAll("[data-footnote-rail-target]")].some(ref => ref.getAttribute("data-footnote-rail-target") === note.getAttribute("data-footnote-rail-item")), `${url.pathname}: note ${note.id} bound to the wrong paragraph/list item`);
  }
}
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
      if (/^\/(?:posts|topics|concepts|papers|author|archives|map|agents)(?:\/|$)/.test(target)) {
        assert(paths.has(target), `${path}: missing source fallback ${target}`);
        const equivalent = "/en" + (target === "/" ? "" : target);
        assert(!paths.has(equivalent) || link.closest("[data-translation-notice]") || link.hasAttribute("data-source-fallback"), `${path}: avoid Chinese fallback when translation exists: ${target}`);
      }
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
    // A translated page can pass every overflow/SEO check yet bypass the
    // post-only Markdown pipeline. Verify the complete citation contract.
    if (path.startsWith("/en/posts/")) {
      const body = document.querySelector("[data-post-body]");
      assert(body, `${path}: missing article body`);
      const references = [...body.querySelectorAll("a[data-footnote-ref]")];
      const ids = [...new Set(references.map(ref => ref.getAttribute("data-footnote-rail-target")))].sort();
      const sourceIds = [...new Set([...original.querySelectorAll("[data-post-body] a[data-footnote-ref]")].map(ref => ref.getAttribute("data-footnote-rail-target")))].sort();
      if (document.body.dataset.translationState !== "stale") {
        assert.deepEqual(ids, sourceIds, `${path}: translated references must preserve source footnote identities`);
      } else assert(document.querySelector("[data-translation-notice]"), `${path}: stale translation requires visible notice`);
      assert(!ids.includes(null), `${path}: references bypassed the margin-note compiler`);
      assert.equal(body.querySelectorAll("[data-footnotes]").length, 0, `${path}: raw endnotes leaked into article body`);
      const notes = [...document.querySelectorAll("[data-footnote-rail-item]")];
      assert.deepEqual(notes.map(note => note.getAttribute("data-footnote-rail-item")).sort(), ids, `${path}: missing or duplicate margin notes`);
      for (const ref of references) {
        const id = decodeURIComponent(ref.getAttribute("href").slice(1));
        assert(document.getElementById(id)?.matches("[data-footnote-rail-item]"), `${path}: reference target does not resolve to a margin note: ${id}`);
      }
      for (const note of document.querySelectorAll("[data-marginalia-bubble]")) {
        assert(note.querySelector(".post-scholar-footnote-body")?.textContent.trim(), `${path}: empty note ${note.id}`);
        const anchor = note.getAttribute("data-anchor-id");
        if (anchor) assert(document.getElementById("c-" + anchor), `${path}: missing translated paragraph anchor ${anchor}`);
        assert(!note.querySelector("[data-footnote-backref]"), `${path}: duplicated raw back-reference`);
      }
      assert(![...body.querySelectorAll("h2, h3")].some(h => h.id === "footnote-label"), `${path}: endnote label leaked into TOC`);
    }
    document.querySelectorAll('script, style, [data-language-switch], pre, code, .katex, [data-note-type=reference], [lang=zh-CN]').forEach(node => node.remove());
    const walker = document.createTreeWalker(document.body, 4);
    const untranslated = [];
    while (walker.nextNode()) if (/[\u3400-\u9fff]/.test(walker.currentNode.textContent)) untranslated.push(walker.currentNode.textContent.trim());
    assert.deepEqual(untranslated, [], `${path}: untranslated interface text`);
  } catch (error) { errors.push(error.message); }
}
const search = JSON.parse(await readFile(resolve(root, "en/search-index.json"), "utf8"));
for (const item of search) {
  assert(item.url === "/en" || item.url.startsWith("/en/") || item.languageLabel, `Chinese fallback must be explicitly labelled: ${item.url}`);
  assert(paths.has(item.url), `English search returns a missing page: ${item.url}`);
}
const rss = await readFile(resolve(root, "en/rss.xml"), "utf8");
assert(rss.includes("<language>en</language>"), "English RSS language missing");
assert(rss.includes("/en/posts/"), "English RSS article URLs missing");
if (errors.length) throw new Error(errors.join("\n"));
console.log(`Bilingual build check passed: ${english.length} English pages, ${english.length} reciprocal Chinese pages, ${search.length} English search entries.`);
