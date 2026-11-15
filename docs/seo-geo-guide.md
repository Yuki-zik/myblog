# SEO & GEO Architecture Guide (`a-znk.com`)

This document describes the end-to-end **SEO** (Search Engine Optimization, Bilingual SEO, and Scholarly SEO) and **GEO** (Generative Engine Optimization — AI search engines, retrieval-augmented generation, and LLM citation readiness) system implemented for `A-Znk的blog` / `A-Znk Blog` (`https://a-znk.com/`).

---

## 1. Design Principles & Non-Goals

1. **Canonical Single Origin**: `https://a-znk.com` is the sole canonical origin (`trailingSlash: "never"`). Legacy `.vercel.app` origins redirect via HTTP 301 except for `public/googleb326e1b2b17b02a1.html`.
2. **Zero Content Fabrication**: Structured data (`schema.org` JSON-LD), Highwire `citation_*` tags, sitemap `<lastmod>`, and `/llms*.txt` corpora only emit source-verified facts. Prototype or draft entries never appear as published papers, and missing `publicationDate` values are never synthesized from `year`.
3. **HTML for Search Ranking, Clean Markdown for AI Retrieval**:
   - Canonical HTML routes (`42` bilingual pages across `zh-CN` and `en`) are indexed in `/sitemap.xml` and `/sitemap-0.xml` with `index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1`.
   - Machine-oriented Markdown mirrors (`*.md`) and full-corpus bundles (`/llms-full.txt`, `/en/llms-full.txt`) remain **crawlable** in `robots.txt` for AI retrieval agents, while carrying `X-Robots-Tag: noindex, follow` in `vercel.json` and staying excluded from XML sitemaps so search engines never split ranking signals between HTML and raw text.
4. **Zero Translation Drift**: Chinese Markdown under `src/content/{posts,papers,topics,concepts}` remains the single authoritative source (`src/data/translation-state.json`).

---

## 2. GEO (Generative Engine Optimization) Surface

| Endpoint | Locale | Indexing Header | Purpose |
| --- | --- | --- | --- |
| `/llms.txt` | `zh-CN` | Indexable discovery index | `llmstxt.org`-compliant curated index with author entity disambiguation (`A-Znk` / `Qianli Ma`, USTC, ORCID `0009-0005-2060-4172`), published papers (DOI + `.md` mirrors), topics, posts, concepts, and `## Optional` corpus pointers. |
| `/en/llms.txt` | `en` | Indexable discovery index | English edition of `/llms.txt` pointing to `/en/*` canonical routes and `/en/*.md` mirrors. |
| `/llms-full.txt` | `zh-CN` | `X-Robots-Tag: noindex, follow` | Single-request full-text Markdown corpus compiling author profile, published paper dossiers (abstracts, DOIs, BibTeX), topics, concepts, and complete non-draft posts. |
| `/en/llms-full.txt` | `en` | `X-Robots-Tag: noindex, follow` | Full-text English Markdown corpus for single-pass RAG/LLM ingestion. |
| `/posts/<slug>.md`, `/en/posts/<slug>.md` | `zh-CN` / `en` | `X-Robots-Tag: noindex, follow` | Self-contained clean Markdown mirror per article with canonical URL, author, ISO dates, topics, concepts, summary, and full body. |
| `/papers/<slug>.md`, `/en/papers/<slug>.md` | `zh-CN` / `en` | `X-Robots-Tag: noindex, follow` | Self-contained clean Markdown mirror per published/accepted/preprint paper with authors, venue, year, DOI, external links, abstract, body notes, and BibTeX. |
| `/knowledge-graph.json` | Bilingual IDs | Static JSON | Validated topic–post–concept adjacency graph used by `/map` and machine readers. |
| `/rss.xml`, `/en/rss.xml` | `zh-CN` / `en` | Feed XML | RSS 2.0 feeds with Dublin Core `<dc:creator>`, Atom `rel="self"` link, and deterministic `<lastBuildDate>`. |

### HTML `<head>` Autodiscovery Links
Every indexable HTML page advertises machine-readable alternates in `<head>`:
- `<link rel="alternate" type="application/rss+xml" href="https://a-znk.com/rss.xml">` (or `/en/rss.xml` on English pages)
- `<link rel="alternate" type="text/plain" href="https://a-znk.com/llms.txt">` (or `/en/llms.txt` on English pages)
- `<link rel="alternate" type="text/markdown" href="https://a-znk.com/posts/<slug>.md">` on all post and non-prototype paper detail pages (localized to `/en/...` on English pages)

### AI Crawler Policy (`/robots.txt`)
`src/pages/robots.txt.ts` explicitly permits mainstream search and AI citation/grounding crawlers (`OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `Claude-SearchBot`, `Claude-User`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `Bytespider`, `DuckAssistBot`, plus `*`) on all public HTML, `.md`, and `llms*.txt` paths while disallowing internal UI search indexes (`/search-index.json`, `/en/search-index.json`) to avoid crawl budget waste.

---

## 3. Entity Graph & Structured Data (`schema.org` JSON-LD)

`src/lib/seo/jsonLd.ts` emits a unified `@graph` on every page, localized via `localizeStructuredData` in `src/lib/i18n/index.ts`:

- **Shared Base Nodes (every page)**:
  - `WebSite` (`https://a-znk.com/#website`): localized name, cross-locale `alternateName`, description, `inLanguage`, and `publisher` pointing to `#person-a-znk`.
  - `Person` (`https://a-znk.com/#person-a-znk`): links `A-Znk` (`alternateName: "Qianli Ma"`) across `sameAs` (`GitHub`, `Google Scholar`, `ORCID 0009-0005-2060-4172`, `Zhihu`), `jobTitle` (USTC AI security researcher role), `description`, and `knowsAbout`.
- **Route-Specific Nodes**:
  - `/author`, `/en/author` → `ProfilePage` (`mainEntity: { "@id": "https://a-znk.com/#person-a-znk" }`) + `BreadcrumbList`
  - `/posts/<slug>`, `/en/posts/<slug>` → `BlogPosting` (`headline`, `datePublished`, `dateModified`, `wordCount`, `timeRequired` ISO-8601 duration, `isAccessibleForFree: true`, `image`, `about`, `mentions`) + `BreadcrumbList`
  - `/papers/<slug>`, `/en/papers/<slug>` → `ScholarlyArticle` (ordered `author` list with co-author ORCID `sameAs`, `isPartOf` `PublicationIssue`, DOI `identifier` + `https://doi.org/...` `sameAs`, `isAccessibleForFree: true`, `image`) + `BreadcrumbList` (falls back to `WebPage` for `prototype` entries)
  - `/concepts/<slug>`, `/en/concepts/<slug>` → `DefinedTerm` (`inDefinedTermSet`) + `CollectionPage` + `BreadcrumbList`
  - `/topics`, `/topics/<slug>`, `/papers`, `/archives`, `/agents` (and `/en/*`) → `CollectionPage` + `BreadcrumbList`
  - `/privacy`, `/en/privacy` → `WebPage` + `BreadcrumbList`

---

## 4. Scholarly SEO, Bilingual SEO & Social Cards

- **Google Scholar / Highwire Press (`src/lib/seo/highwire.ts`)**:
  - Emits `citation_title`, ordered `citation_author`, `citation_publication_date`, `citation_journal_title` / `citation_conference_title`, `citation_doi`, localized `citation_abstract_html_url`, `citation_language` (`zh` / `en`), and optional repository `citation_pdf_url` for non-prototype papers.
- **Bilingual Parity (`src/layouts/BaseLayout.astro`)**:
  - Reciprocal `hreflang="zh-CN"`, `hreflang="en"`, and `hreflang="x-default"` links plus self-referencing `<link rel="canonical">` and `og:locale` / `og:locale:alternate`.
- **100% Open Graph & Twitter Card Coverage (`src/pages/og/[...route].ts`)**:
  - Generates 1200×630 PNG cards for all 8 fixed top-level routes (`home`, `author`, `papers`, `topics`, `archives`, `map`, `agents`, `privacy`) and all `posts`, `topics`, `concepts`, and non-prototype `papers` in both `zh-CN` (`/og/...`) and `en` (`/og/en/...`), with `og:image:alt`, `og:image:width`, `og:image:height`, and `twitter:image:alt`.

---

## 5. Automated Verification & Operations

Run all build-time and E2E gates locally before pushing:

```bash
pnpm seo:test              # IndexNow diff-to-URL mapping unit tests
pnpm test                  # Vitest suite (JSON-LD, Highwire, Sitemap, llms.txt, i18n)
pnpm build                 # Full Astro typecheck + static build
pnpm seo:check-build       # Sitemap parity, 42-page canonical/description/OG/JSON-LD, and GEO .md/llms corpus audit
pnpm i18n:check            # Reciprocal hreflang, English CJK leak check, marginalia & schema language check
pnpm i18n:check-lifecycle  # Translation state hash integrity check
```

After deploying to `https://a-znk.com`:

```bash
pnpm seo:audit             # Live production HTTP 200, sitemap parity, OG image, and /llms*.txt audit
```

### External Webmaster Checklist (Manual Account Actions)
- **Google Search Console**: Submit `https://a-znk.com/sitemap.xml` and inspect `/author`, `/papers/duap-multilingual-speech-privacy`, and `/en/papers/duap-multilingual-speech-privacy`.
- **Bing Webmaster Tools & IndexNow**: Automatically notified on production deploys via `.github/workflows/indexnow.yml` using `public/1f4849388e587d6cc6e6895197d146371b570010e26f487f.txt`.
- **Baidu Search Resource Platform**: Download the `baidu-urls` artifact generated by `.github/workflows/indexnow.yml` and paste into Baidu's URL submission panel (see `docs/china-search-seo.md`).
- **ORCID & Google Scholar**: Add `https://a-znk.com/author` as personal homepage on ORCID (`0009-0005-2060-4172`) and Google Scholar (`NTwrnCIAAAAJ`) to close the bidirectional `sameAs` trust loop.
