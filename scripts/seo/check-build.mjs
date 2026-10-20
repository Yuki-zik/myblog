import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (file) => readFileSync(resolve("dist", file), "utf8");
const extract = (xml) =>
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].replace(/&amp;/g, "&"));
const normalize = (url) => url.replace(/\/$/, "");
const assert = (condition, message) => {
  if (!condition) throw new Error("SEO build validation: " + message);
};

const direct = read("sitemap.xml");
const astro = read("sitemap-0.xml");
const robots = read("robots.txt");
const directUrls = extract(direct);
const astroUrls = extract(astro);

assert(direct.includes("<urlset "), "/sitemap.xml must be a URL-set XML sitemap");
assert(directUrls.length > 0, "no public URLs found");
assert(
  JSON.stringify(directUrls.map(normalize).sort()) ===
  JSON.stringify(astroUrls.map(normalize).sort()),
  "direct sitemap and Astro sitemap index must describe the same public URLs"
);
assert(new Set(directUrls).size === directUrls.length, "duplicate URLs");
assert(directUrls.every((url) => url.startsWith(new URL(directUrls[0]).origin + "/")), "foreign URL");
assert(!directUrls.some((url) => /\.(md|json|xml)(?:$|\?)/.test(url)), "non-HTML route");
assert(robots.includes("Sitemap: " + new URL("/sitemap.xml", directUrls[0]).toString()), "robots sitemap mismatch");
assert(read("index.html").includes('rel="canonical"'), "homepage canonical missing");

console.log("SEO build check passed: " + directUrls.length + " canonical pages.");
