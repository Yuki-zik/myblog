#!/usr/bin/env node
import { SITE_ORIGIN, canonicalizeUrl, sitemapUrls } from "./url-selection.mjs";

const errors = [];
const EXPECTED_MINIMUM = 19;

async function get(path) {
  const response = await fetch(SITE_ORIGIN + path, {
    signal: AbortSignal.timeout(20000),
    headers: { "User-Agent": "AZnkSEOHealthCheck/1.0" }
  });
  return { response, body: await response.text() };
}
function check(condition, message) {
  if (!condition) errors.push(message);
}
function extractHead(html) {
  return html.split(/<\/head>/i)[0];
}

try {
  const sitemap = await get("/sitemap.xml");
  check(sitemap.response.status === 200, "Direct sitemap.xml must return HTTP 200.");
  check(/xml/i.test(sitemap.response.headers.get("content-type") || ""), "Sitemap must serve XML.");
  const urls = sitemapUrls(sitemap.body);
  check(urls.length >= EXPECTED_MINIMUM, "Sitemap contains fewer than " + EXPECTED_MINIMUM + " canonical URLs.");
  check(urls.length === [...new Set(urls)].length, "Duplicate canonical sitemap URLs found.");

  const child = await get("/sitemap-0.xml");
  const childUrls = sitemapUrls(child.body);
  check(child.response.status === 200, "Astro sitemap-0.xml must return HTTP 200.");
  check(JSON.stringify(urls.sort()) === JSON.stringify(childUrls.sort()), "Direct sitemap and Astro sitemap differ.");

  const robots = await get("/robots.txt");
  check(robots.response.status === 200, "robots.txt must return HTTP 200.");
  check(robots.body.includes("Sitemap: " + SITE_ORIGIN + "/sitemap.xml"), "robots.txt should advertise the direct sitemap.");
  check(!/Disallow:\s*\/\s*(?:\n|$)/.test(robots.body), "Robots must not disallow the whole site.");

  for (let offset = 0; offset < urls.length; offset += 4) {
    const chunk = urls.slice(offset, offset + 4);
    await Promise.all(chunk.map(async (url) => {
      try {
        const path = new URL(url).pathname;
        const { response, body } = await get(path);
        const head = extractHead(body);
        const canonical = head.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1];
        check(response.status === 200, path + ": expected HTTP 200, got " + response.status);
        check(canonicalizeUrl(canonical) === canonicalizeUrl(url), path + ": canonical does not match sitemap.");
        check(/<title>[^<]+<\/title>/i.test(head), path + ": missing title.");
        check(/<meta\s+name=["']description["']/i.test(head), path + ": missing description.");
        check(/<html[^>]*lang=["']zh-CN["']/i.test(body), path + ": missing zh-CN language.");
        check(!/<meta\s+name=["']robots["'][^>]*noindex/i.test(head), path + ": unintentionally noindex.");
        check(!/noindex/i.test(response.headers.get("x-robots-tag") || ""), path + ": X-Robots-Tag noindex.");
      } catch (error) {
        errors.push(url + ": " + String(error));
      }
    }));
  }

  const missing = await get("/seo-check-expected-404-20261020");
  check(missing.response.status === 404, "Unknown paths must serve real HTTP 404.");
  check(/noindex/i.test(extractHead(missing.body)), "404 must be noindex.");
  const key = await get("/indexnow-key.txt");
  check(key.response.status === 200, "Public IndexNow verification file must return HTTP 200.");
  check(/^[A-Za-z0-9-]{8,128}\s*$/.test(key.body), "IndexNow ownership file content invalid.");
  console.log("Checked " + urls.length + " sitemap entries and robots, canonical metadata, 404, IndexNow ownership.");
} catch (error) {
  errors.push("Audit aborted: " + String(error));
}
if (errors.length) {
  console.error("SEO health audit FAILED:\n" + errors.map((value) => "- " + value).join("\n"));
  process.exitCode = 1;
} else {
  console.log("SEO health audit PASS. This does not prove search engine indexing.");
}
if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    "### a-znk.com technical SEO\n\n" +
    (errors.length ? "**FAIL**\n\n" + errors.join("\n") : "**PASS**: Sitemap/robots/canonicals/404/keyfile checks.") +
    "\n\nActual index coverage must be read from each webmaster dashboard.\n");
}
