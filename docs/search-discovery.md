# Search discovery

Public name: **A-Znk的blog**. The shared name, alternate names and description live in `src/lib/site.ts`. Page titles, visible brand, `og:site_name`, the existing `WebSite` node, RSS and the reading index use the same identity. Existing content URLs remain valid.

## Verified technical signals

- Public content is server-rendered and has canonical URLs; robots.txt allows crawling and points to the sitemap index.
- Sitemap: https://myblog-silk-one.vercel.app/sitemap-index.xml
- Ordinary content remains indexable. The 404 page and raw Markdown mirrors retain their intentional noindex rules.
- The public repository README links to the actual site; its GitHub description and homepage also use the new identity.
- Validation artifacts and search observations are in ignored `output/branding-search-2026-10-15/`.

Production verification (2026-10-16): PR #5 / `d895679` is live. All 19 indexable pages were checked for the branded title, one correct WebSite node, stable canonical and normal indexing rules. Merge CI passed 124/124 E2E cases.

## Google Search Console setup (2026-10-16)

The URL-prefix property `https://myblog-silk-one.vercel.app/` is now verified in the site owner's Google account.

- Verification method: the original HTML file downloaded from this property's verification dialog. `public/googleb326e1b2b17b02a1.html` was released through [PR #6](https://github.com/Yuki-zik/myblog/pull/6), merge `16e82ec`. Its public URL returns HTTP 200 and exactly matches the downloaded and built bytes. Keep this file in future releases so ownership remains valid.
- Sitemap: `sitemap-index.xml` was submitted once. Search Console displayed “已成功提交站点地图” and the table status “成功”. The public sitemap contains 19 URLs; Google's initial discovered-page counter was still 0, so no claim is made that all pages were processed or indexed.
- Homepage URL Inspection: the indexed-data report displayed “网址尚未收录到 Google” and “Google 无法识别此网址”. This authenticated result supersedes the earlier inconclusive search/CAPTCHA observations.
- Google's live URL test displayed “网址可编入 Google 索引”. The homepage indexing request was accepted with “已请求编入索引” and confirmation that the URL entered the priority crawl queue. Do not repeatedly submit the same URL; Google says repetition does not improve queue order or priority.
- Current outcome: ownership and submission steps are complete; actual indexing and search visibility remain pending Google processing.

Validation: 116 local unit tests and the 20-page Astro check/build passed; PR and merged-main CI each passed 124 E2E cases. Both production deployments completed successfully. No application runtime or page layout was changed.

Local, ignored evidence is in `output/search-console-2026-10-16/`: `result.json`, file-byte comparisons, ownership/sitemap screenshots, homepage live-test output, and the accepted indexing-request screenshot. The authenticated [Search Console property](https://search.google.com/search-console?resource_id=https%3A%2F%2Fmyblog-silk-one.vercel.app%2F) is the place to check later processing and index status. Its dashboard initially said data was still being processed.

The local AEO audit remains a sample-based technical heuristic, not a Google ranking or indexing score. No content was padded, publication dates changed, or crawler/training permissions widened for this setup.

Google decides crawling, indexing and the displayed site name. Updating metadata or submitting a sitemap does not guarantee immediate inclusion or a particular ranking.

Sources: [Google site names](https://developers.google.com/search/docs/appearance/site-names), [request recrawling](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [site: operator limitations](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
