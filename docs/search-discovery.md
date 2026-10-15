# Search discovery

Public name: **A-Znk的blog**. The shared name, alternate names and description live in `src/lib/site.ts`. Page titles, visible brand, `og:site_name`, the existing `WebSite` node, RSS and the reading index use the same identity. Existing content URLs remain valid.

## Verified technical signals

- Public content is server-rendered and has canonical URLs; robots.txt allows crawling and points to the sitemap index.
- Sitemap: https://myblog-silk-one.vercel.app/sitemap-index.xml
- Ordinary content remains indexable. The 404 page and raw Markdown mirrors retain their intentional noindex rules.
- The public repository README links to the actual site.
- Validation artifacts and search observations are in ignored `output/branding-search-2026-10-15/`.

## Google status observed during this change

A direct Google `site:myblog-silk-one.vercel.app` query reached a CAPTCHA. A separate public search returned no confirmed site result. Neither observation proves that the site is absent from Google's index. This automation session did not reach an owned Search Console property, so no URL Inspection result or indexing request is claimed.

The local AEO audit is a sample-based technical heuristic, not a Google ranking or indexing score. No content was padded, publication dates changed, or crawler/training permissions widened to improve that heuristic.

## Owner step in Google Search Console

1. Sign in to [Search Console](https://search.google.com/search-console). Reuse the existing property if one exists; otherwise add the URL-prefix property `https://myblog-silk-one.vercel.app/` and complete one of Google's ownership-verification methods.
2. In **Sitemaps**, submit `sitemap-index.xml` once.
3. Use **URL Inspection** for the homepage, check the live URL, and request indexing if appropriate. Inspect the site's important content pages in the same property.

An ownership-verification HTML tag must come from the actual property. It must not be invented. If HTML-tag verification is chosen, its public `google-site-verification` value can be added to the shared layout in a follow-up.

Google decides crawling, indexing and the displayed site name. Updating metadata or submitting a sitemap does not guarantee immediate inclusion or a particular ranking.

Sources: [Google site names](https://developers.google.com/search/docs/appearance/site-names), [request recrawling](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl), [site: operator limitations](https://developers.google.com/search/docs/monitor-debug/search-operators/all-search-site).
