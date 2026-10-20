import { readFileSync } from "node:fs";
import { extractSitemapUrls, selectChangedUrls } from "./indexnow-utils.mjs";
import { parseBaiduResult, validateBaiduSite } from "./baidu-utils.mjs";

const ORIGIN = "https://a-znk.com";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const changesIndex = args.indexOf("--changed-files");
if (!all && changesIndex === -1) {
  throw new Error("Use --all or --changed-files <path>.");
}
if (changesIndex !== -1 && !args[changesIndex + 1]) {
  throw new Error("--changed-files requires a file path.");
}
const changed = changesIndex < 0 ? [] :
  readFileSync(args[changesIndex + 1], "utf8").split(/\r?\n/).filter(Boolean);

async function main() {
  const token = process.env.BAIDU_PUSH_TOKEN?.trim();
  const configuredSite = process.env.BAIDU_SITE?.trim();

  // There is no authenticated Baidu API access until the owner has verified
  // this property and configured both the GitHub secret and repository variable.
  if (!dryRun && !token) {
    console.log("Baidu URL submission skipped: BAIDU_PUSH_TOKEN is not configured.");
    return;
  }
  if (!dryRun && !configuredSite) {
    throw new Error("BAIDU_PUSH_TOKEN is present; set BAIDU_SITE to the exact verified property.");
  }
  const site = configuredSite ? validateBaiduSite(configuredSite) : undefined;
  const sitemapResponse = await fetch(ORIGIN + "/sitemap.xml", {
    signal: AbortSignal.timeout(20000)
  });
  if (!sitemapResponse.ok) throw new Error("Public sitemap unavailable (HTTP " + sitemapResponse.status + ").");
  const urls = extractSitemapUrls(await sitemapResponse.text(), ORIGIN);
  if (!urls.length) throw new Error("Public sitemap is empty.");

  const selected = [...new Set(selectChangedUrls(urls, changed, all))];
  if (!selected.length) {
    console.log("Baidu submission skipped: no modified indexable URLs.");
    return;
  }
  if (dryRun) {
    console.log("Baidu dry-run: " + selected.length + " canonical URLs; property: " + (site ?? "unconfigured"));
    for (const url of selected) console.log("DRY RUN " + url);
    return;
  }

  // Never print the token or the complete endpoint in logs.
  const endpoint = new URL("https://data.zz.baidu.com/urls");
  endpoint.searchParams.set("site", site);
  endpoint.searchParams.set("token", token);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/plain; charset=utf-8" },
    body: selected.join("\n"),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error("Baidu API returned HTTP " + response.status + ".");
  let result;
  try {
    result = JSON.parse(await response.text());
  } catch {
    throw new Error("Baidu API returned invalid JSON.");
  }
  const { accepted, remaining } = parseBaiduResult(result, selected.length);
  console.log("Baidu normal indexing API accepted " + accepted + " URL(s); remaining quota: " + (remaining ?? "not reported") + ". Indexing is not guaranteed.");
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Baidu submission failed.");
  process.exitCode = 1;
});
