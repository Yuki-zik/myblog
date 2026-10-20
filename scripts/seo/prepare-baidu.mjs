import { readFileSync, writeFileSync } from "node:fs";
import { extractSitemapUrls, selectChangedUrls } from "./indexnow-utils.mjs";

const ORIGIN = "https://a-znk.com";
const args = process.argv.slice(2);
const all = args.includes("--all");
const changedIndex = args.indexOf("--changed-files");
const outputIndex = args.indexOf("--output");

if (!all && changedIndex === -1) throw new Error("Specify --all or --changed-files <path>.");
if (changedIndex >= 0 && !args[changedIndex + 1]) throw new Error("--changed-files requires a file path.");
if (outputIndex >= 0 && !args[outputIndex + 1]) throw new Error("--output requires a file path.");

const changed = changedIndex < 0 ? [] :
  readFileSync(args[changedIndex + 1], "utf8").split(/\r?\n/).filter(Boolean);

async function main() {
  const response = await fetch(ORIGIN + "/sitemap.xml", { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Cannot read live sitemap (HTTP " + response.status + ").");
  const urls = extractSitemapUrls(await response.text(), ORIGIN);
  if (!urls.length) throw new Error("Public sitemap has no URLs.");
  const selected = [...new Set(selectChangedUrls(urls, changed, all))];

  // The official Baidu API URL is currently documented with HTTP, and TLS
  // verification for its HTTPS hostname has failed. Do not send credentials
  // over plaintext HTTP, silently bypass TLS, or pretend this is an API push.
  const body = selected.length ? selected.join("\n") + "\n" : "";
  if (outputIndex >= 0) {
    writeFileSync(args[outputIndex + 1], body, "utf8");
  } else {
    process.stdout.write(body);
  }
  console.error("Prepared " + selected.length + " canonical URL(s) for manual Baidu Search Resource Platform submission. No API request was made.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
