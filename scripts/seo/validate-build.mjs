#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const out = await readFile("dist/sitemap-0.xml", "utf8");
const entries = [...out.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((entry) => ({
  url: entry[1].match(/<loc>([^<]+)<\/loc>/)?.[1],
  lastmod: entry[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1]
}));

assert.ok(entries.length >= 19, "Expected complete public route coverage.");
assert.ok(entries.every((entry) => entry.url), "Every sitemap entry must have loc.");
const base = new URL(entries[0].url).origin;
assert.ok(entries.some((entry) => entry.url === base + "/"), "Homepage must use slash-form canonical.");
assert.equal(new Set(entries.map((entry) => entry.url)).size, entries.length, "No duplicates.");

const articleEntries = entries.filter((entry) => new URL(entry.url).pathname.startsWith("/posts/"));
assert.ok(articleEntries.length >= 4, "Published posts must be in sitemap.");
assert.ok(
  articleEntries.every((entry) => entry.lastmod && !Number.isNaN(Date.parse(entry.lastmod))),
  "Each published post must publish its real frontmatter date in lastmod."
);

const robots = await readFile("dist/robots.txt", "utf8");
assert.ok(robots.includes("Sitemap: " + base + "/sitemap.xml"), "robots.txt must point to direct sitemap.");
const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
assert.ok(
  vercel.rewrites.some((rule) => rule.source === "/sitemap.xml" && rule.destination === "/sitemap-0.xml"),
  "Vercel must serve direct sitemap URL with HTTP 200."
);
console.log("Build sitemap contract PASS: " + entries.length + " URLs; " + articleEntries.length + " posts with lastmod.");
