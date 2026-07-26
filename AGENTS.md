# Agent Context & Handoff (MyBlog)

Last updated: 2026-04-11 (design manual + browser verification policy session)

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

## 2) Current Implementation Status

### 2.1 Core app (implemented)

- Framework: Astro + React island
- Routes implemented:
  - `/`
  - `/topics`
  - `/topics/[slug]`
  - `/posts/[slug]`
  - `/concepts/[slug]`
  - `/archives`
- Content collections implemented in `src/content.config.ts`:
  - `posts`
  - `topics`
  - `concepts`

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

## 3) Cloud/Deployment Progress

- GitHub repo created and pushed:
  - `https://github.com/Yuki-zik/myblog`
- Vercel project import completed (user screenshots indicate deployment is live)
- Waline server needs to be configured separately for each deployment environment

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

1. Add CI workflow (run `pnpm test` + `pnpm build` on PR).
2. Add production monitoring/logging for Waline load failures.
3. Decide whether to expose pageview / reaction features from Waline.
4. Continue expanding search / TOC / author E2E coverage.

## 8) Notes for Next Agent

- Repository is on `main` tracking `origin/main`.
- Keep paragraph anchor contract stable; downstream marginalia and footnote layout depend on it.
- Do not initialize Waline directly inside Astro markup; keep it inside the dedicated React wrapper.

## 9) Frontend Rewrite Guardrails

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
- `src/styles/home-reference.css` still owns the full-bleed home background and footer polish, but runtime switching no longer depends on `body:has(main.shell--home-reference)`. If a discover page loses its background, first check `runtime="discover"` in `BaseLayout` and `src/styles/discover.css`; if only the homepage loses fidelity, then inspect `home-reference.css`.
- The home `关注领域` section is no longer a server-picked quartet. Current behavior is: render the full topic pool, but on desktop constrain it to a **4-card viewport** with horizontal movement via prev/next controls, arrow keys, and wheel-to-horizontal mapping. If this section ever looks static again, inspect `src/pages/index.astro` and the `home-reference-domains-viewport` rules in `src/styles/home-reference.css` before changing the data layer.
- `src/components/post/PostCover.astro` + `src/styles/cards.css` now define the shared **manual cover stack** contract for non-reading surfaces: topic/concept cards, archive tiles, and the home featured card should reuse the same `ghost + main` image structure, white rim, misty blur spread, and hover lift instead of forking bespoke cover treatments. If homepage featured imagery diverges, fix the shared cover primitive first.
- The author page is no longer exempt from that card language: the "作者文章" section should prefer `PostCard.astro` over ad-hoc text-only lists so users can actually perceive the shared cover/hover system outside the home route. If author posts look visually disconnected again, start by checking whether `src/pages/author.astro` still renders `PostCard`.
- Archive pages still keep their time-ledger structure, but `archive-post-tile` should behave like a first-class shared card, not a static thumbnail row. Regressions to watch for are: only the image animates while the tile body stays inert, or the read cue/title no longer react on hover.
- The home primary CTA color is part of the reference fidelity contract. Regressions tend to show up first in `light` vs `system-on-dark` theme branches, so changes to `src/styles/home-reference.css` should be checked against both explicit dark mode and `:root[data-theme="system"]` with `prefers-color-scheme: dark`.
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
  - `discover`: `/`, `/topics`, `/topics/[slug]`, `/concepts/[slug]`, `/author`, `/archives`
  - `reading`: `/posts/[slug]`
