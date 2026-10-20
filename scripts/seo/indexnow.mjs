#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { SITE_ORIGIN, sitemapUrls, selectUrlsForChanges } from "./url-selection.mjs";

const forceAll = process.argv.includes("--all") || process.env.GITHUB_EVENT_NAME === "workflow_dispatch";
const dryRun = process.argv.includes("--dry-run");
const before = process.env.BEFORE_SHA;
const after = process.env.AFTER_SHA || process.env.GITHUB_SHA;

function changedPaths() {
  if (forceAll) return [];
  if (!before || !after || /^0+$/.test(before)) {
    throw new Error("Missing GitHub before/after commit IDs; run with --all to submit a verified full sitemap.");
  }
  return execFileSync("git", ["diff", "--name-only", before, after], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  }).trim().split("\n").filter(Boolean);
}

async function readResponse(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
}

const key = (await readFile(new URL("../../public/indexnow-key.txt", import.meta.url), "utf8")).trim();
if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) throw new Error("IndexNow key format is invalid.");

const changes = changedPaths();
if (!forceAll && changes.length === 0) {
  console.log("No changed files to notify.");
  process.exit(0);
}

const sitemapResponse = await readResponse(SITE_ORIGIN + "/sitemap.xml");
if (!sitemapResponse.ok) throw new Error("Live canonical sitemap is unavailable: HTTP " + sitemapResponse.status);
const allUrls = sitemapUrls(await sitemapResponse.text());
if (!allUrls.length) throw new Error("Live sitemap has no canonical URLs; refusing to submit.");

const urls = selectUrlsForChanges(changes, allUrls, forceAll);
console.log("Live canonical URLs: " + allUrls.length + "; affected URLs: " + urls.length + ".");
if (!urls.length) process.exit(0);

if (dryRun) {
  for (const url of urls) console.log(url);
  process.exit(0);
}

const keyUrl = SITE_ORIGIN + "/indexnow-key.txt";
const keyResponse = await readResponse(keyUrl);
const publishedKey = keyResponse.ok ? (await keyResponse.text()).trim() : "";
if (publishedKey !== key) {
  throw new Error("IndexNow ownership key has not reached the canonical production domain.");
}

const response = await readResponse("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: new URL(SITE_ORIGIN).hostname,
    key,
    keyLocation: keyUrl,
    urlList: urls
  })
});
const body = (await response.text()).slice(0, 500);
if (![200, 202].includes(response.status)) {
  throw new Error("IndexNow submission rejected (HTTP " + response.status + "): " + body);
}
console.log("IndexNow accepted " + urls.length + " URLs (HTTP " + response.status + "). Acceptance is not indexing.");

if (process.env.GITHUB_STEP_SUMMARY) {
  const { appendFile } = await import("node:fs/promises");
  await appendFile(process.env.GITHUB_STEP_SUMMARY,
    "### IndexNow\n\nAccepted: **" + urls.length + "** URLs (HTTP " + response.status + ").\n\n" +
    "This indicates notification acceptance; confirmed indexing must be checked in webmaster consoles.\n");
}
