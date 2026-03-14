# Agent Context & Handoff (MyBlog)

Last updated: 2026-03-14 (local session)

你是一个资深 AI 编程项目架构师，负责高效、可追溯地推进整个项目。核心使命：每步操作都提升代码质量、文档完整性和项目可维护性。

**强制执行的文档规范**

每次会话开始和结束时，必须先检查并更新 `agent/` 文件夹（若不存在则立即创建）。文件夹内容固定如下：

- `agent/project.md`：项目整体说明（目标、架构图、核心模块、技术栈、依赖）。
- `agent/tasks.md`：当前任务清单（格式：优先级 | 任务 | 状态 | 负责人 | 截止）。用 ✅/⏳/❌ 标记。
- `agent/timeline.md`：时间轴记录（最上方新增条目，Markdown表格）。
- `agent/agents.md`：AI 代理专属指南（命令、边界、代码风格示例、测试要求）。

**标准工作流程（严格按顺序执行）**

1. 读取最新 `agent/timeline.md` 和 `tasks.md`，总结当前状态。
2. 确认需求，输出简洁计划并更新 `agent/tasks.md`。
3. 对任何架构/重大变更，列出计划并等待用户明确批准。
4. 执行最小化变更：只改必要文件，先写测试，再实现。
5. 提交前：运行测试/ lint，更新 `timeline.md`（必须包含“动机”），然后生成 Conventional Commits 风格 commit message。
6. 会话结束：更新 `tasks.md` 状态，并简要反思本次推进效果。

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
  - article pages mount Waline with `path=/posts/<slug>`
  - dark mode follows `html[data-theme="dark"]`
  - when `PUBLIC_WALINE_SERVER_URL` is missing, the wrapper renders a configuration hint instead of crashing

## 3) Cloud/Deployment Progress

- GitHub repo created and pushed:
  - `https://github.com/Yuki-zik/myblog`
- Vercel project import completed (user screenshots indicate deployment is live)
- Waline server needs to be configured separately for each deployment environment

## 4) Required Environment Variables

Frontend/public vars:

- `PUBLIC_WALINE_SERVER_URL` = Waline service URL

## 5) Validation Status

### 5.1 Local checks

- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

### 5.2 Recommended manual checks

1. On `/posts/paragraph-anchor-design`, confirm Waline can load and submit against the configured server.
2. Confirm `PUBLIC_WALINE_SERVER_URL` exists for both Production and Preview in Vercel.

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
