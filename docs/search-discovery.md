# Search discovery

Public name: **A-Znk的blog**. The shared name, alternate names and description live in `src/lib/site.ts`. Page titles, visible brand, `og:site_name`, the existing `WebSite` node, RSS and the reading index use the same identity. Existing content URLs remain valid.

## Public project entrypoints (2026-10-18)

The author profile README and three relevant public project READMEs now link to the blog, AI Coding retrospective/topic and publication list. Public unauthenticated readback verified all four; existing source attribution, report blocks and product URLs were preserved. The blog repository also uses relevant topic labels and explicit topic/paper/author links. This is author-controlled discovery, not independent endorsement or confirmed search indexing. See [audit and evidence](discovery-audit.md) and [reference commits](discovery-links.json).

Release `2292de2` is live: the retrieval index grows from 11 to 14 linked targets, including the author and two papers with publication status and draft/prototype filtering. Person JSON-LD points to the canonical author profile by default. 121 unit tests, 9 targeted checks and all 191 CI E2E cases pass; fresh public readback verifies the index, author graph, repository entrypoints and original Google verification file. The existing sitemap, canonical and crawler policy remain in place.

## Current public hostname (2026-10-16)

Primary URL: **https://a-znk-blog.vercel.app/**. The previous `myblog-silk-one.vercel.app` hostname remains an accessible alias. The same Vercel projects serve the site and Waline; their public `SITE_URL` values now use the branded origin. Release `1a05291` completed both production deployments. All 19 production canonicals, the sitemap, robots/RSS and the original verification file were checked; anonymous comments remain healthy with the original one comment.

The new URL-prefix [Search Console property](https://search.google.com/search-console?resource_id=https%3A%2F%2Fa-znk-blog.vercel.app%2F) automatically verified ownership through the existing HTML file. `sitemap-index.xml` was submitted once: its initial “无法抓取” state subsequently became “成功”, with type “站点地图索引”. Its public child sitemap contains 19 URLs; this is not a claim that Google has indexed all of them.

Google's homepage live test passed (“网址可编入 Google 索引”). The **new hostname's manual indexing request was not accepted**: Google displayed “超出了配额”, saying the daily quota was exhausted and to try the next day. Do not treat the older hostname's accepted request below as an accepted request for this hostname. Actual indexing remains pending. Evidence: ignored `output/domain-branding-2026-10-16/`, including the live-test, quota and final successful-sitemap screenshots.


## Verified technical signals

- Public content is server-rendered and has canonical URLs; robots.txt allows crawling and points to the sitemap index.
- Sitemap: https://a-znk-blog.vercel.app/sitemap-index.xml
- Ordinary content remains indexable. The 404 page and raw Markdown mirrors retain their intentional noindex rules.
- The public repository README links to the actual site; its GitHub description and homepage also use the new identity.
- Validation artifacts and search observations are in ignored `output/branding-search-2026-10-15/`.

Production verification (2026-10-16): PR #5 / `d895679` is live. All 19 indexable pages were checked for the branded title, one correct WebSite node, stable canonical and normal indexing rules. Merge CI passed 124/124 E2E cases.

## Earlier setup on the previous hostname (2026-10-16)

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

## Primary-domain migration (2026-10-18)

New canonical: `https://a-znk.com/`. The existing branded `.vercel.app` and old project alias must permanently redirect non-verification content to the new domain with each path preserved. The original `googleb326e1b2b17b02a1.html` stays reachable on each legacy hostname so existing GSC ownership can be verified after migration. `www.a-znk.com` has a Vercel project-domain 301 redirect to the apex host. `SITE_URL` is updated for Production and Preview. New Google Search Console property/sitemap submission still requires a verified Google account action; check these after deployment.

## 中文搜索与自动化升级（2026-10-20）

新域名 `a-znk.com` 公开检测：普通和模拟 Baiduspider 请求可读；搜狗 `site:` 返回 0 条、360 无相关结果，百度查询要求安全验证，Bing 公开结果不足以判定。具体策略及待验证项目见 [中文搜索 SEO 手册](china-search-seo.md)。PR #34 新增直接 `/sitemap.xml`、内容更新时间、CI parity check、IndexNow 部署触发器和 `pnpm seo:audit`。实际搜索收录仍需站长平台数据确认；新域名的百度/搜狗/360 验证不应冒称已完成。

## 生产收录追踪（2026-10-20）

PR #34 已合并（dcc5b661）。正式域名 robots、直接和索引 Sitemap、RSS、IndexNow 验证文件均返回 200；19 个 URL 的可抓取性已模拟检查。[IndexNow Action #39439737841](https://github.com/Yuki-zik/myblog/actions/runs/39439737841) 返回 HTTP 202，仍待密钥验证。真实索引数量未知。第二轮拟加入有站点凭据才启用的百度收录 API、每周生产 SEO 监测、目录页中文检索摘要和论文 OG 分享图。详见 [中文搜索操作手册](china-search-seo.md)。
