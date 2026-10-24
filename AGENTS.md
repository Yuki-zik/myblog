# Agent Context & Handoff (A-Znk的blog)

Agent instruments redesign locally validated (2026-10-24): user rejected the large combined metric panel. Work directly on Mac mini at /Users/a-znk/Code/myblog-agent-widgets, branch feat/agent-widgets-mini-20261024. Four separately reusable compact widgets should have distinct silhouettes and real keyboard/touch interactions; /agents is the dedicated page, and the Chinese homepage gets only a compact entry. Keep SSR measurements separate from visibly labeled interaction examples; the daily schema does not contain task timelines, so never fabricate real intervals. Preserve the shared UiControllers initialization boundary and existing bilingual/reading changes.

Agent observatory (2026-10-24, PR #48 live at https://a-znk.com/agents): `/agents` and the homepage widget share `src/lib/agents/observatory.ts` and reviewed data in `src/data/agent-observatory.json`. Preserve null for missing measurements, distinct task IDs, recorded-day coverage, and the separation between personal observations, benchmark results, randomized field studies, and self-reports. Never manufacture a historical per-person Agent count curve, productivity multiplier, or zero-valued empty state. Keep existing six header links and page-controller boundaries. Maintenance: `docs/agent-observatory.md`. Merged production commit 46ffc8f matches the fully tested tree: 159 unit tests and 326 browser tests in CI 40104474504, 39 canonical pages and 19 translation pairs. Preserve the published bilingual main: this first observatory edition is Chinese only, and its widget appears only on the Chinese homepage. Live entry, research disclosure, canonical, Markdown download and Chinese/English homepage navigation were verified. Original v1/v2 review screenshots and revision provenance are retained in `docs/visual-history/2026-10-24-agent-observatory/`.

Bilingual editions (2026-10-24): Chinese URLs remain stable; English content is fully built under /en using shared templates and matching src/content/en collection ids. Keep reciprocal zh-CN/en/x-default hreflang and self-canonicals only for published translation pairs. Localize UI through src/lib/i18n/en.json and internal content links through localizePath; preserve images, DOI/authors/quotes/code, Chinese reading anchors and shared Waline thread paths. The language control sits beside search, outside the six-link mobile navigation row. Run pnpm i18n:check after build and preserve both Chinese and English browser contracts. Authoring and release rules: docs/bilingual-publishing.md.

TOC reading inset (2026-10-22, PR #46 live): auto-follow targets the active link, never its whole parent branch. TocSidebar's scroll-padding defines the comfortable reading area; matching trailing padding lets the final link keep its bottom inset (96–112px at the tested600/760/1000px heights). toc-client adjusts only scrollBody.scrollTop and leaves the document untouched; do not replace it with ancestor-scrolling scrollIntoView. Preserve heading activation, anchor landing, collapse and mobile contracts. Browser tests include short windows, resize, collapse/expand and backward clicks; evidence: docs/visual-history/2026-10-22-toc-reading-inset/.

Composition coverage (2026-10-22, PR #45 live): author research/writing chapter heads span the full content measure; do not restore heading-only side columns. Shared editorial-rhythm.css uses data-editorial-grid="lead" or "paired" across author research/writing/practice/focus, topics, topic reading, home recents and archive months (9 routes). Above1100px use12-column7/5+5/7 pairs with24px offsets; lead/singleton/unmatched final records span fully. At<=1100px keep source-order single columns. editorial-posts.css owns common author/topic reading cards; paired desktop cards retain consistent internal direction, mobile stacks. Home dates/topics occupy a horizontal header. Topic narrow plates retain intrinsic ratios and useful captions; archive narrow titles use balanced wrapping. Preserve accepted home hero, capsule, reader, original images and data. Rules/evidence: docs/ordered-asymmetry.md and docs/visual-history/2026-10-22-editorial-rhythm/.

Paper figures (2026-10-22, PR #44 live): the author-provided DUAP Fig.3 PNG remains unchanged. Shared PaperFigure renders author/publication/detail previews with intrinsic ratio, original colors and original-file viewing; use only one ImageViewer per page. figureLabel is independent of optional sourcePage: unknown PDF pages stay absent. The illustrated author-publication chapter head spans the content to provide useful image width, with the existing Chinese subtitle as a lead. PDF crop pipeline v2 preserves the crop ratio without a fixed canvas or upscaling and never replaces a manually selected cover. Distinguish author-chosen previews, PDF-generated candidates and metadata synchronization. Research/maintenance: docs/paper-preview-research.md and docs/paper-automation.md; evidence: docs/visual-history/2026-10-22-paper-figures/.

Ordered asymmetry (2026-10-22, PR #43 baseline): archive posters use PostCover poster with intrinsic dimensions, no frame/background/padding; year labels span the content above each year. The initial practice/focus12-column7/5+5/7 rhythm is now covered by PR #45's shared1100px breakpoint. Preserve data, keyboard order and the accepted white/orange, hero, capsule and reader. No random transforms or per-record bespoke positioning. Rules: docs/ordered-asymmetry.md; historical screenshots: docs/visual-history/2026-10-21-ordered-asymmetry/.

Content dossiers (2026-10-21, PR #42 live): ContentDossier and content-dossier.css own paper surfaces, locator/title/body hierarchy, optional imagery and native details for author practice/focus, recent home notes, archive and paper records. Add future content through existing profile/collection data. Pass hasMedia explicitly when the media slot is conditional: Astro may retain an empty named slot. asLink records cannot contain nested links/details. Keep core information visible and preserve approved home hero, carousel, reading runtime and capsule. See docs/content-dossiers.md; judge real main content, not only decorative reference panels.

Editorial imagery (2026-10-21, PR #40 live): imagery is a site-wide design principle. Prefer real article/paper visuals and a small sourced collection of historical science/engineering plates. Use images to explain or identify content, with honest captions and attribution; do not imply historical illustrations are modern model results. Preserve originals and reuse the existing accessible image viewer for light interaction, with keyboard and reduced-motion support. Avoid mechanically decorating every component. Rules and provenance: docs/editorial-imagery.md. EditorialFigure uses one existing ImageViewer per page; keep topic reading links separate from image-preview links and preserve the original artwork in dark mode.

Discovery composition (2026-10-20): PR #33's small refinements were rejected as insufficient by the user. PR #37 (2606048, live) makes /map's real interactive workspace the first-screen subject, with reading trails secondary; /author uses a spanning masthead, independent original portrait and an early real-publication entry. Preserve graph relations, mobile list default, accessible descriptions and all author content. Recent-note date/topic alignment and the approved home gateway/capsule remain. Capture whole-screen evidence in docs/visual-history/2026-10-20-composition-redesign/; wait for avatar decode before visual acceptance. Node-title wrapping preserves source text and Latin words without orphan CJK lines.

SEO phase 2 (2026-10-20): preserve canonical a-znk.com, legacy redirects, Google ownership file, direct/indexed sitemap parity, and current layout. Baidu normal-indexing API is documented as HTTP and HTTPS certificate verification fails; do not send credentials over plaintext HTTP or bypass TLS. The production workflow generates a baidu-urls text artifact for manual submission through the authenticated Baidu webmaster UI. IndexNow HTTP 202 means pending key verification. Weekly Production SEO audit checks public HTML, robots, sitemap, key and paper OG metadata. See docs/china-search-seo.md.

Search discovery (2026-10-20, PR #34): keep canonical origin a-znk.com and the existing .vercel.app redirects/Google verification file. /sitemap.xml is a directly submit-able urlset, while Astro's sitemap index stays available; keep their HTML URL sets identical (pnpm seo:check-build). Only trusted frontmatter dates become lastmod. IndexNow is notified from successful production deployment status or manual Actions dispatch; publish/verify ownership key before calling IndexNow. IndexNow is not a Baidu/Sogou/360 submission service. Operational playbook: docs/china-search-seo.md; run pnpm seo:audit after production deploy.

Header label contract (2026-10-19): the desktop grid gives the navigation `max-content` width; labels use `white-space: nowrap` and do not flex-shrink. Preserve six horizontal links in the mobile second row. Page overflow checks do not detect CJK glyphs wrapping inside a link; keep the rendered-text-line regression in `tests/e2e/header-nav-nowrap.spec.ts`. Do not restore symmetric `1fr / search / 1fr` sizing or compensate by hiding navigation.

Wander / 漫游 (2026-10-19): `/map` is now the reader-facing exploration space; keep its URL and the `/knowledge-graph.json` endpoint stable. Reuse `lib/knowledge/explore.ts` for filters, real adjacency and validated reading paths; never fabricate graph edges. `ExploreGateway` is the rich home/topic entry, the sixth nav destination is 漫游, and `KnowledgeGraph` now receives build-time data with diagram/list/preview interaction. Preserve mobile list default, query `focus` validation, keyboard controls and no-JavaScript links. Old starfield CSS was removed, not globally restyled. Protect the accepted home hero, article layout, comments and header collapse; 320px navigation padding is intentionally narrower for six links. Evidence: `docs/visual-history/2026-10-19-wander/`; tests: `explore.spec.ts` and `lib/knowledge/explore.test.ts`.

Research Atlas design pass (2026-10-19): Preserve the already accepted home and article reading systems. New author dossier uses scoped `src/styles/author-atlas.css` and strictly site-owned `SITE_AUTHOR_PROFILE` / published-or-accepted `papers` with `author.self`; do not invent credentials or treat prototypes as published. Other discovery folios use scoped `src/styles/discovery-polish.css`, `drawing-index.css` and real topic `why` / paper keywords. Protect navigation, Waline API rewrites, responsive overflow, mobile header, graph hydration, article margin notes and 404 status/noindex. Visual history and test contract: `docs/visual-history/2026-10-19-research-atlas/`, `tests/e2e/research-atlas.spec.ts`.
Waline comment width (2026-10-19): `.post-waline-comments-section` in `src/styles/article.css` must keep `width: 100%` alongside its established 49rem/52rem max-width. This Grid child uses auto inline margins: removing the width shrinks the whole Waline editor to its intrinsic size (~446px at a 1493px viewport), unlike the adjacent pager. Do not compensate with broad `.wl-*` internal overrides. Five viewport regressions: `tests/e2e/waline-reading-width.spec.ts`; visual evidence: `docs/visual-history/2026-10-19-comment-width/`.

Article cover/entry rule (2026-10-19): Keep the entire cover as the existing keyboard-accessible image-viewer trigger, without a visible zoom-label overlay. For posts whose first rendered body block is h2, tighten only the header-to-first-section spacing; preserve the real mobile TOC and paragraph-first breathing room. Regression: tests/e2e/article-entry-clean.spec.ts.
Waline mainland network repair (2026-10-19 candidate): a first-party `/_waline/api/:path*` Vercel rewrite proxies read/write API calls to the EXISTING Waline deployment; the front-end auto-selects same-origin proxy only for the known legacy backend. VPS mirror calls canonical proxy. Preserve existing Waline DB, comment paths, admin access, and no-cache behavior. Verify production mainland comment readback before claiming fixed. See docs/waline-mainland-access.md.

Style unification in progress (2026-10-18): preserve all accepted reading layouts, artwork, capsule geometry, routes, anchors and interactions. Unify shared orange/paper tokens, page chrome, editorial indexes and controls. Do not replace the site with a template or flatten reading/graph semantics.

Header blank-strip repair (2026-10-18): do not start shrinking the sticky capsule before the header's reserved document-flow height has scrolled away. `UiControllers.astro` exports measured `header.offsetHeight` as `--header-collapse-start`; keep both surface and content scroll timelines synchronized, including mobile two-row header geometry. At <=900px keep a stable `--header-band: 96px` minimum across scroll states, or search dialog body-scroll-lock will lose ~5px of reading position. Evidence and regression: `docs/visual-history/2026-10-18-header-empty-strip/` and `tests/e2e/capsule-header.spec.ts`.

Last updated: 2026-10-18 (author/paper retrieval and contextual public repository links live; 121 unit / 191 E2E checks and public readback verified)

Discovery work (2026-10-18, live): profile/three related project READMEs link to the blog with public readback. Preserve those contextual links, existing project homepages and source attribution. llms.txt includes author and non-draft/non-prototype papers with status; Person.url defaults to /author. Keep indexability and author-controlled links separate from confirmed search indexing. Evidence: docs/discovery-audit.md and docs/discovery-links.json.

Capsule header (2026-10-18, PR #21 live): drawing pages reuse the default floating capsule surface, scroll geometry and content inset; drawing remains a palette marker. Mobile surfaces cover both rows in normal/reduced motion with 8px block padding. Preserve the shared controller/search nodes and do not reintroduce drawing surface/content-width overrides. Margin-note hash lookup decodes the URL fragment and uses getElementById; encoded heading fragments are not CSS selectors. See docs/visual-history/2026-10-18-capsule-header/.

Reading typography (2026-10-18, PR #20 live): article h2/h3 markers scale at 0.8/0.84em, with hanging h2 text for narrow multiline headings. Keep reading serif text, UI numerals/labels and genuine mono code roles. Keep the note-number gutter at 6px so larger UI numerals preserve the existing readable note measure. GFM presence-only data flags may be true or empty strings; strip rail backrefs without removing source links or changing anchor IDs. See docs/visual-history/2026-10-18-reading-typography/.

Article cover viewer (2026-10-18, PR #19 live): Article cover links keep the original asset href and open the conditional ImageViewer native dialog through UiControllers. Preserve fit/original-size modes, close/Esc/backdrop dismissal, focus/scroll restoration and the cover/rail pointer contracts. Image dimensions must switch synchronously (transition-property:none) so native zoom centering uses current scroll bounds. See docs/visual-history/2026-10-18-image-viewer/.

Article spacing/depth (2026-10-18, PR #17/#18 live): preserve wide-screen paper clearance, 56px desktop entry-to-body spacing, soft cover/ghost depth and real hover. Empty wide scholar rails pass pointers through; actual .post-scholar-item nodes keep pointer-events:auto. See docs/visual-history/2026-10-18-cover-air/.

Discover proportions (2026-10-18, PR #16 live): preserve the 1100px topic-index two-column boundary, 200px home topic cards, normal-flow research signature and discover-editorial author/concept scope. The signature remains one native details with its existing 1024px controller. Default discover headers must cover both mobile rows in reduced-motion mode. See docs/visual-history/2026-10-18-discover-proportions/ for sources and v0–v4 acceptance.

Article covers retain original artwork and the 1.45:1 title/cover relationship. The PR #15 framed treatment is historical; PR #17/#18 restore soft floating depth and remove its hard backing. Both visual versions are retained under docs/visual-history/.

你是一个资深 AI 编程项目架构师，负责高效、可追溯地推进整个项目。核心使命：每步操作都提升代码质量、文档完整性和项目可维护性。

**强制执行的文档规范**

每次会话开始和结束时，必须先检查并更新 `agent/` 文件夹（若不存在则立即创建），并维护仓库根目录 `AGENTS.md`。标准文件如下：

- `agent/project.md`：项目整体说明（目标、架构图、核心模块、技术栈、依赖）。
- `agent/tasks.md`：当前任务清单（格式：优先级 | 任务 | 状态 | 负责人 | 截止）。用 ✅/⏳/❌ 标记。
- `agent/timeline.md`：时间轴记录（最上方新增条目，Markdown表格）。
- `AGENTS.md`：项目根目录唯一 AI 代理专属指南（命令、边界、代码风格示例、测试要求）。

**标准工作流程（严格按顺序执行）**

1. 读取最新 `agent/timeline.md` 和 `tasks.md`，总结当前状态。
2. 确认需求，输出简洁计划并更新 `agent/tasks.md`。
3. 对任何架构/重大变更，列出计划并等待用户明确批准。
4. 执行最小化变更：只改必要文件，先写测试，再实现。
5. 提交前：运行测试/ lint，更新 `timeline.md`（必须包含“动机”），然后生成 Conventional Commits 风格 commit message。
6. 会话结束：更新 `tasks.md` 状态，并简要反思本次推进效果。

**并行与子 Agent 推理强度**

- 默认并行处理独立任务（检索、文档核对、测试排查、可拆分实现），并确保写入范围不重叠。
- 子 Agent 推理强度分级：`low` / `medium` / `high` / `xhigh`，默认 `xhigh`。
- 关键路径收敛和最终集成由主 Agent 完成。

## 1) Project Goal

Build a theme-first knowledge blog with Waline-powered article comments:

- Topic pages are the main entrypoint.
- Post paragraphs still receive stable anchors for TOC / marginalia / footnote positioning.
- Article comments are mounted with Waline instead of in-repo Supabase logic.
- Keep v1 simple and extensible (future: moderation, richer comment UX, graph/backlinks).
- Keep research outputs distinct from blog posts: papers use structured publication metadata and a compact year-grouped ledger.

## 2) Current Implementation Status

### 2.1 Core app (implemented)

- Framework: Astro + React island
- Routes implemented:
  - `/`
  - `/topics`
  - `/topics/[slug]`
  - `/posts/[slug]`
  - `/papers`
  - `/papers/[slug]`
  - `/concepts/[slug]`
  - `/archives`
  - `/404` (shared recovery page for missing routes; HTTP 404 and noindex)
- Content collections implemented in `src/content.config.ts`:
  - `posts`
  - `topics`
  - `concepts`
  - `papers`

### 2.2 Paragraph anchor system (implemented)

- Rehype plugin: `src/lib/markdown/rehypeParagraphAnchors.ts`
- Rule:
  - `anchor_id = ${sectionSlug}::p${indexInSection}`
  - Injects:
    - `id="c-${anchor_id}"`
    - `data-anchor="${anchor_id}"`
- Excludes paragraphs inside: `blockquote`, `li`, `table`, `details`, `figcaption`
- Still used by TOC / marginalia / footnote positioning; no longer used for paragraph comments

### 2.3 Comment system (implemented)

- Waline wrapper: `src/components/comments/WalineComments.tsx`
- Waline theme integration: `src/styles/waline.css`
- Rule:
  - article pages mount Waline with `path=/posts/<slug>` and `client:visible`
  - dark mode follows `html[data-color-scheme="dark"]` (computed from the tri-state `data-theme` + `prefers-color-scheme`)
  - when `PUBLIC_WALINE_SERVER_URL` is missing, the wrapper renders a configuration hint instead of crashing
  - when Waline `init()` throws, the wrapper renders a runtime error hint instead of tearing down the page

### 2.4 Paper system (implemented)

- Content collection: `src/content/papers/*`
- Routes:
  - `/papers`: server-rendered, newest-year-first publication ledger
  - `/papers/[slug]`: standalone scholarly detail page with abstract, resources, citation, BibTeX, and Markdown sections
- Paper authors, venue, identifiers, and resources are structured data; do not flatten them back to display strings.
- `prototype` entries must remain visibly labeled as non-published work. Never present a design sample as an accepted or published paper.
- Paper pages participate in `/search-index.json` and emit `ScholarlyArticle` JSON-LD.
- Do not mount Waline, the post scholar rail, or post paragraph-comment behavior on paper pages unless explicitly requested.
- The author's Scholar profile is `NTwrnCIAAAAJ`. Treat it as a discovery source, then verify title, author order, venue, year, DOI, volume, issue, and pages against Crossref plus a second scholarly index before publishing.
- Do not persist Scholar citation counts; they are volatile. Do not copy publisher abstracts verbatim—write an original concise summary from verified metadata.
- Paper PDF enrichment is documented in `docs/paper-automation.md`. Use `pnpm papers:enrich` for analysis, `--apply` only for a reviewed/high-confidence pipeline figure, and `pnpm papers:check` to validate committed cover provenance.
- Never bypass a publisher paywall. Prefer `.paper-sources/<slug>.pdf` for an author-owned copy or an explicit open `resources[type=pdf]` URL.

## 3) Cloud/Deployment Progress

- Primary public URL: `https://a-znk-blog.vercel.app/`. `myblog-silk-one.vercel.app` remains an accessible alias; canonical/OG, RSS, robots and sitemap use the branded hostname. Frontend and Waline `SITE_URL` settings use the new origin.

- GitHub repo created and pushed:
  - `https://github.com/Yuki-zik/myblog`
- Vercel has separate `myblog` and `waline` projects. Do not infer production health from a successful local build or a Waline deployment.
- Release status and required production checks are tracked in `docs/production-readiness.md`.
- Waline server and frontend public configuration must be verified separately for each deployment environment.

- Public site names and descriptions come from `SITE_NAME` / `SITE_DESCRIPTION` in `src/lib/site.ts`; header, footer, document titles, Open Graph, RSS and the existing WebSite JSON-LD share these values.
- Google Search Console ownership is verified for both `https://a-znk-blog.vercel.app/` and the previous hostname using `public/googleb326e1b2b17b02a1.html`. Keep that exact file. The new-domain sitemap was read successfully; the new homepage passed the live test but its manual indexing request hit the daily quota on 2026-10-16. See `docs/search-discovery.md`.

## 4) Required Environment Variables

Frontend/public vars:

- `PUBLIC_WALINE_SERVER_URL` = Waline service URL

Build-time vars:

- `SITE_URL` = canonical / OG absolute URL base used by Astro `site` and page metadata

## 5) Validation Status

### 5.1 Local checks

- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

`pnpm test:e2e` owns its production server: `playwright.config.ts` runs
`pnpm build && pnpm preview`. Do not switch it back to `pnpm dev` or pre-start a
server on port 4173. Keep `reuseExistingServer: false` and the
`ASTRO_PREVIEW_BACKGROUND=1` child-process flag: Astro 7.2 otherwise detects
coding agents and detaches the preview process before Playwright can own it.
The same commit has previously reported 55/55 against
dev and 53/55 against the built output; the build exposed the real
layout/timing failures.

### 5.2 Recommended manual checks

1. On `/posts/paragraph-anchor-design`, confirm Waline can load and submit against the configured server.
2. Confirm `PUBLIC_WALINE_SERVER_URL` exists for both Production and Preview in Vercel.

### 5.3 Conditional browser/screenshot review

Do **not** treat screenshot review as a blanket requirement for every change. Use a real browser plus at least one targeted screenshot only when the change can be "technically green but visually or behaviorally wrong" in the browser.

Trigger browser/screenshot review when a change affects one or more of these areas:

- rendered layout, spacing, typography, color, theme, cover art, cards, or any other visual presentation
- a new page/route/content surface whose correctness depends on how the page actually renders in the browser
- browser-owned behavior such as responsive breakpoints, scroll states, sticky/fixed positioning, modals/lightboxes/drawers, TOC/highlight sync, theme toggle, localStorage-backed UI state, reduced-motion, or React/Astro hydration boundaries
- user-reported issues described in visual or interaction terms, such as "错位", "太宽", "不显示", "会跳", "层级不对"

You can skip browser/screenshot review when the change is limited to:

- server-only, build-only, config-only, schema-only, or test-only work with no user-visible rendering impact
- documentation or pure content edits that do not introduce new visual assets, new routes, new interactive mounts, or template/layout changes
- internal refactors already covered by automated checks where browser state, media queries, and visual composition are not part of the risk

When browser review is triggered, keep it scoped:

1. Run the project checks first.
2. Open only the affected route(s) and state(s) in a real browser.
3. Capture screenshot evidence only for the surfaces touched by the change; do not mechanically screenshot the whole site.
4. If the change is responsive or theme-sensitive, inspect only the impacted breakpoint/theme combinations rather than every matrix permutation.

The user requested versioned visual backups on 2026-10-17. For visual redesigns, retain before/proposal/implementation/production screenshots with route, theme, viewport and source revision under `docs/visual-history/`; append versions instead of overwriting prior captures. Keep this scoped to the affected surfaces and states.

## 6) Key Files Index (for new agent)

- Project config:
  - `package.json`
  - `astro.config.mjs`
  - `tsconfig.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
- Content model:
  - `src/content.config.ts`
  - `src/content/posts/*`
  - `src/content/topics/*`
  - `src/content/concepts/*`
  - `src/content/papers/*`
- Comment domain:
  - `src/components/comments/WalineComments.tsx`
  - `src/styles/waline.css`
- Markdown anchor plugins:
  - `src/lib/markdown/rehypeParagraphAnchors.ts`
  - `src/lib/markdown/rehypeTufteFootnotes.ts`
- Tests:
  - `src/lib/markdown/rehypeParagraphAnchors.test.ts`
  - `src/lib/markdown/rehypeTufteFootnotes.test.ts`
  - `src/components/comments/WalineComments.test.tsx`
  - `tests/e2e/paragraph-comments.spec.ts`

## 7) Suggested Next Tasks (Priority Order)

1. Follow the operational caveats in `docs/production-readiness.md`: the 2026-09-06 release is live, but Free-plan database pausing and historical credential rotation need explicit ongoing decisions.
2. Add production monitoring/logging for Waline load failures.
3. Decide whether to expose pageview / reaction features from Waline.
4. Continue expanding search / TOC / author E2E coverage.

## 8) Notes for Next Agent

- As of 2026-09-06, PR #1 is merged and the production release tracks `main`. Always recheck the local branch and upstream before acting.
- The visual pass and release fixes were published through PR #2 (`93364ad`) on 2026-10-15. Production tracks `main`; fresh anonymous page/search/RSS/comment checks passed. See `docs/production-readiness.md` and `docs/visual-interaction-pass.md`.
- Waline smoke now verifies valid/invalid query parsing and that PostgreSQL connection/SQL logging stays disabled. Keep the `think-validator` compatibility override until the upstream Waline dependency range includes the fix.
- Keep paragraph anchor contract stable; downstream marginalia and footnote layout depend on it.
- When moving GFM footnotes to the scholar rail, retain their screen-reader label as a hidden non-heading element so `aria-describedby` remains valid without adding a TOC entry. The build clears Astro's content cache because helper-only Markdown plugin changes can otherwise reuse stale HTML.
- Do not initialize Waline directly inside Astro markup; keep it inside the dedicated React wrapper.
- Missing routes use `src/pages/404.astro` with `noindex` and the shared discover shell. Keep their HTTP 404 status; do not turn missing URLs into redirects or successful responses.

## 9) Frontend Rewrite Guardrails

- The homepage now follows the user-approved full-canvas architectural drawing direction: white paper, cool blue-gray line art, a large A-Znk name at upper-left and the complete `research.ts` signature as an opaque lower-left annotation. Its `headerVariant="drawing"` retains paper/orange navigation colors and shares the restored capsule geometry. Other routes retain the shared editorial shell. Keep the real author-profile tracks/counts and the single native details/controller hooks. See `docs/architectural-home.md` for the design, asset provenance and validation scope.
- Topics, topic detail, archives and papers index opt into `DrawingIndexShell`/`DrawingPageHeader` and the drawing header. Their CSS is scoped to `.drawing-index` or discover+drawing. `PostCard compactMetadata` defaults to false. PR #13 implements the user-approved readers: posts use `data-reading-design="edge"`, papers use `data-reading-design="metadata"`, both keep `runtime="reading"` and opt into the drawing header. `reading-drawing.css` owns the scoped shared paper palette; `article-drawing.css` / `paper-drawing.css` own each reader's visual refinement. Preserve TOC pinning, scholar rail, footnotes, anchors and content. See `docs/reading-drawing.md` and `docs/visual-history/`.
- Mobile TOC selection must close its native details synchronously before computing the scroll target. Do not reintroduce the 40ms delayed close or a separate JS breakpoint: that produced overscroll and missed the 1181–1280px layout. Tests cover real selection/visible heading at 390/1024/1240px.
- Both discover and reading bodies must use `overflow-x: clip`, not `hidden`: hidden creates a competing body scroll container and breaks viewport sticky positioning. TOC tests must assert actual viewport pinning after document scroll, not only active-item state inside the TOC.

### 9.0 Styling stack: Tailwind CSS v4 (authoritative)

The site now uses Tailwind CSS v4 via `@tailwindcss/vite`. `src/styles/tailwind.css` is the entry and is imported first by `BaseLayout.astro`. Three rules are load-bearing — breaking any of them causes silent, site-wide visual damage:

- **Do not import preflight.** Only `tailwindcss/theme.css` (`layer theme`) and `tailwindcss/utilities.css` (`layer utilities`) are imported. Article bodies rely on the browser default `list-style` (`.post-body ul/ol` in `article.css` only sets padding), so preflight would silently delete every bullet and number in every post. Never change this to `@import "tailwindcss";`.
- **Utilities are layered, legacy CSS is not.** Everything in `src/styles/*.css` is unlayered, and unlayered CSS always outranks `@layer utilities`. A Tailwind class therefore has no effect until the competing legacy declaration is deleted. This is intentional: it makes the migration reversible one component at a time. When migrating, always pair "add utility" with "delete the old declaration" — never leave both.
- **Theme tokens are bridged by reference, not by value.** `@theme inline` points `--color-*`, `--font-*`, `--text-*`, `--shadow-elev-*` and `--spacing-*` back at `tokens.css`. Hard-coding a literal there freezes the light palette and breaks dark mode. `tokens.css` remains the single runtime source of truth.

Related invariants:

- Dark mode is selected by `html[data-color-scheme="dark"]`, never `html[data-theme="dark"]` — the latter is inert whenever the user is on `system`, which is the default.
- Tailwind owns the `--radius-*` namespace, so those literals are mirrored in both `tailwind.css` and `tokens.css`; `src/styles/tailwindTheme.test.ts` fails if they drift.
- `src/styles/themeContract.test.ts` still scans every `.css` file in `src/styles`, including `tailwind.css`.

- Treat the repo as **two runtimes**: the shared editorial shell (`src/layouts/BaseLayout.astro` + global chrome/styles) and the article-specific scholarly reader (`src/pages/posts/[slug].astro` + TOC/rail/comments runtime). Do not plan the rewrite as “all pages same difficulty”.
- The home route remains the most reference-faithful page (`src/pages/index.astro` + `src/styles/home-reference.css` + `src/components/home/HomeReferenceFooter.astro` + `src/lib/home/selectors.ts`), but non-article discover routes now share a common runtime shell via `src/components/discover/*`, `src/styles/discover.css`, and `runtime="discover"` on `BaseLayout`. Treat homepage-specific classes as refinements on top of the shared discover family, not a separate ad-hoc island.
- `src/layouts/BaseLayout.astro` now emits explicit `body/main[data-runtime]` and `footerVariant`; `src/components/UiControllers.astro` owns reveal/theme/header/back-to-top/domains-carousel/social-stats/reading-progress initialization. Do not reintroduce page-scoped inline scripts unless the user explicitly approves breaking that controller boundary.
- Homepage research signature uses one native `details` node; `UiControllers` sets the initial and cross-breakpoint state at 1024px. Do not duplicate the terminal or force closed `details` contents visible with CSS.
- Search keeps one field/results set: desktop uses the header dropdown; at <=900px the same nodes move into a native top-layer dialog. Preserve scroll/focus restoration, layout occupancy of the hidden trigger, VisualViewport resizing, and IME guards. Active-result scrolling must move only the result list.
- Discover pages use `body { overflow-x: clip }` so the sticky header follows the document viewport. `overflow-x: hidden` creates a body scroll container and can leave focused search above the viewport; preserve focus/open search visibility when the header's scroll state is hidden.
- Article reading entries lead with metadata/title/summary in DOM order; wide screens place the supporting cover beside the header, narrow screens below it. The user restored the whole article floating paper on 2026-10-18: above 1280px the existing layout pseudo-element carries main text and notes, while single-column articles have their own surface. The optional `bodyClass` gives only posts an `article-paper-page` canvas; paper readers remain unchanged. Covers retain original artwork and full-image `contain`: the >=1420px title card uses 1.45fr/1fr with 40–60px gap, 32px trailing padding and a centered 440px cover cap; single-column covers cap at 400px and shrink to the available width. A thin paper rim, soft shadow and diffused image ghost provide depth; there is no hard offset backing. Preserve real cover hover through empty note-rail space while keeping note items interactive; disable hover motion for reduced-motion users. The cover wrapper must not inherit a fixed aspect-ratio. Keep inline code foreground paired with its paper background, and retain Shiki's paired light/dark syntax backgrounds.
- `src/styles/home-reference.css` still owns the full-bleed home background and footer polish, but runtime switching no longer depends on `body:has(main.shell--home-reference)`. If a discover page loses its background, first check `runtime="discover"` in `BaseLayout` and `src/styles/discover.css`; if only the homepage loses fidelity, then inspect `home-reference.css`.
- The home `关注领域` section is no longer a server-picked quartet. Current behavior is: render the full topic pool, but on desktop constrain it to a **4-card viewport** with horizontal movement via prev/next controls, arrow keys, and wheel-to-horizontal mapping. If this section ever looks static again, inspect `src/pages/index.astro` and the `home-reference-domains-viewport` rules in `src/styles/home-reference.css` before changing the data layer.
- `src/components/post/PostCover.astro` + `src/styles/cards.css` now define the shared **manual cover stack** contract for non-reading surfaces: topic/concept cards, archive tiles, and the home featured card should reuse the same `ghost + main` image structure, white rim, misty blur spread, and hover lift instead of forking bespoke cover treatments. If homepage featured imagery diverges, fix the shared cover primitive first.
- The author page is no longer exempt from that card language: the "作者文章" section should prefer `PostCard.astro` over ad-hoc text-only lists so users can actually perceive the shared cover/hover system outside the home route. If author posts look visually disconnected again, start by checking whether `src/pages/author.astro` still renders `PostCard`.
- Archive pages still keep their time-ledger structure, but `archive-post-tile` should behave like a first-class shared card, not a static thumbnail row. Regressions to watch for are: only the image animates while the tile body stays inert, or the read cue/title no longer react on hover.
- Drawing-page orange tokens live in `tokens.css` under the drawing body and resolved dark selectors. Use bright pigment for surfaces/markers, contrast-safe ink for small text, and retain the original artwork. Keep the author name accessible as A-Znk and decorative section indices hidden from heading names.
- Home CTAs are underlined text links with visible keyboard focus and real topic/paper destinations. The architectural image uses Astro responsive assets with eager/high-priority loading; dark treatment follows `data-color-scheme="dark"`, including system-on-dark. The code annotation stays opaque in both themes so text contrast does not depend on the drawing behind it.
- The current `参考项目/` directory contains a small Vite/Tailwind UI demo (`remix_-misty-shadows-ui-gallery.zip`) that is useful as a **visual reference only**. Do not treat it as an architecture reference for routing, content modeling, comments, or build setup.
- Preserve these contracts unless the user explicitly approves breaking them:
  - paragraph anchor ids from `src/lib/markdown/rehypeParagraphAnchors.ts`
  - `note-*` / `ref-*` GFM footnote semantics from `src/lib/markdown/rehypeTufteFootnotes.ts`
  - scholar rail ordering/model from `src/lib/posts/postScholarRail.ts`
  - search endpoint `/search-index.json`
  - Waline mount boundary in `src/components/comments/WalineComments.tsx`
- Suggested rewrite order:
  1. Shared shell / chrome (`BaseLayout`, header, search, theme toggle, footer)
  2. Home + topic/concept/list pages + card language
  3. Article reading runtime (`article.css`, TOC, scholar rail, reading layout)
  4. Author / archives special pages
- The main CSS hotspots are `src/styles/article.css`, `src/styles/layout.css`, `src/styles/author.css`, `src/styles/cards.css`, and `src/styles/toc.css`. Prefer further decomposition before large visual changes in those files.
- Current runtime map:
  - `discover`: `/`, `/topics`, `/topics/[slug]`, `/concepts/[slug]`, `/papers`, `/author`, `/archives`, `/404`
  - `reading`: `/posts/[slug]`, `/papers/[slug]` (dedicated paper layout; no post-only rail/comments)
