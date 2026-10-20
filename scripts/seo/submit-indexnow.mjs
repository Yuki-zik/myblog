import { readFileSync } from "node:fs";
import { extractSitemapUrls, selectChangedUrls } from "./indexnow-utils.mjs";

const SITE = "https://a-znk.com";
const HOST = "a-znk.com";
const KEY = "1f4849388e587d6cc6e6895197d146371b570010e26f487f";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const changesIndex = args.indexOf("--changed-files");
if (changesIndex !== -1 && !args[changesIndex + 1]) {
  throw new Error("--changed-files requires a file path");
}
if (!all && changesIndex === -1) {
  throw new Error("Specify --all or --changed-files <path>");
}
const changedFiles = changesIndex >= 0
  ? readFileSync(args[changesIndex + 1], "utf8").split(/\r?\n/).filter(Boolean)
  : [];

async function readResponse(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("HTTP " + response.status + " from " + url);
  return response.text();
}

async function main() {
  // Never notify a crawler before this deployment's ownership file is public.
  const keyLocation = SITE + "/" + KEY + ".txt";
  const keyBody = await readResponse(keyLocation);
  if (keyBody.trim() !== KEY) throw new Error("IndexNow ownership file content mismatch");

  const urls = extractSitemapUrls(await readResponse(SITE + "/sitemap.xml"), SITE);
  if (!urls.length) throw new Error("Empty public sitemap");
  const selected = [...new Set(selectChangedUrls(urls, changedFiles, all))];
  if (!selected.length) {
    console.log("IndexNow skipped: no changed canonical content URLs.");
    return;
  }
  console.log("IndexNow candidate canonical URLs: " + selected.length);
  if (dryRun) {
    for (const url of selected) console.log("DRY RUN " + url);
    return;
  }

  const response = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation,
      urlList: selected
    }),
    signal: AbortSignal.timeout(20000)
  });
  const body = (await response.text()).slice(0, 400);
  if (![200, 202].includes(response.status)) {
    throw new Error("IndexNow submission rejected (HTTP " + response.status + "): " + body);
  }
  console.log("IndexNow accepted " + selected.length + " URLs (HTTP " + response.status + "). Indexing is not guaranteed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
