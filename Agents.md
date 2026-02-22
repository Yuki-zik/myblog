# Agent Context & Handoff (MyBlog)

Last updated: 2026-02-20 (local session)

你是一个资深AI编程项目架构师，负责高效、可追溯地推进整个项目。核心使命：每步操作都提升代码质量、文档完整性和项目可维护性。

**强制执行的文档规范**  

每次会话开始和结束时，必须先检查并更新 `agent/` 文件夹（若不存在则立即创建）。文件夹内容固定如下：

- `agent/project.md`：项目整体说明（目标、架构图、核心模块、技术栈、依赖）。  

- `agent/tasks.md`：当前任务清单（格式：优先级 | 任务 | 状态 | 负责人 | 截止）。用 ✅/⏳/❌ 标记。  

- `agent/timeline.md`：时间轴记录（最上方新增条目，Markdown表格）。每条必须包含：  

  | 日期时间 | 任务/变更 | 修改文件 | 实现逻辑 | 修改动机 | 结果/备注 |  

  示例：  

  | 2026-02-21 10:30 | 添加用户认证模块 | src/auth.py, tests/test_auth.py | 使用JWT + bcrypt，分离 concerns | 解决安全漏洞并便于未来扩展 | 已通过单元测试，性能开销<5ms |  

- `agent/agents.md`：AI代理专属指南（命令、边界、代码风格示例、测试要求）。参考AGENTS.md最佳实践：明确“Always/Ask/Never”规则、运行命令、示例代码片段。

**标准工作流程（严格按顺序执行）**  

1. 读取最新 `agent/timeline.md` 和 `tasks.md`，总结当前状态。  

2. 确认需求 → 输出简洁计划（更新 `agent/tasks.md`）。  

3. 对任何架构/重大变更，列出计划并等待用户明确批准。  

4. 执行最小化变更：只改必要文件，先写测试，再实现。  

5. 提交前：运行测试/ lint，更新 timeline.md（必须包含“动机”），然后生成 commit 消息（Conventional Commits 格式）。  

6. 会话结束：更新 tasks.md 状态，并简要反思本次推进效果。

**额外铁律**  

- 所有变更必须在 timeline.md 中留下可审计记录，动机一栏绝不省略。  

- 保持 human-in-the-loop：重大决定前必须询问。  

- 使用清晰的 Markdown 结构，避免模糊描述。  

- 如果发现文档与代码不一致，立即修正并记录在 timeline.md。  

## 1) Project Goal

Build a theme-first knowledge blog with paragraph-level short comments:

- Topic pages are the main entrypoint.
- Each paragraph (`<p>`) in posts can be commented.
- Comment data is self-hosted in Supabase with RLS.
- Anonymous visitors can comment via Supabase anonymous auth.
- Keep v1 simple and extensible (future: text-selection comments, moderation flow, graph/backlinks).

## 2) Current Implementation Status

### 2.1 Core app (implemented)

- Framework: Astro + React island
- Routes implemented:
  - `/`
  - `/topics`
  - `/topics/[slug]`
  - `/posts/[slug]`
  - `/concepts/[slug]`
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
- Excludes paragraphs inside: `blockquote`, `li`, `table`, `details`, `figcaption`.

### 2.3 Comment system (implemented)

- Supabase client: `src/lib/supabaseClient.ts`
- Comment API: `src/lib/comments/api.ts`
  - `ensureAnonymousSession()`
  - `fetchVisibleComments(postSlug)`
  - `createComment(input)`
- UI component: `src/components/comments/ParagraphComments.tsx`
  - scans `p[data-anchor]`
  - shows paragraph comment count (`N`)
  - expandable thread panel
  - quick tags
  - optimistic update + rollback on failure
  - max length validation
  - warmup anonymous session on load

### 2.4 Supabase schema/RLS (implemented in SQL migration)

- Migration file:
  - `supabase/migrations/20260220_000001_comments.sql`
- Includes:
  - enums `comment_status`, `comment_tag`
  - `public.comments` table
  - length constraint (1..200)
  - indexes
  - RLS enabled
  - policies:
    - read only `visible`
    - insert only `authenticated` with `auth.uid() = author_id`

## 3) Cloud/Deployment Progress

Based on this session:

- GitHub repo created and pushed:
  - `https://github.com/Yuki-zik/myblog`
- Vercel project import completed (user screenshots indicate deployment is live).
- Supabase API key setup discussed and applied.
- User confirmed anonymous user records can now be observed in Supabase Auth Users.

## 4) Required Environment Variables

Frontend/public vars:

- `PUBLIC_SUPABASE_URL` = Supabase Project URL
- `PUBLIC_SUPABASE_ANON_KEY` = Supabase Publishable/anon-equivalent key

Optional:

- `PUBLIC_COMMENTS_REQUIRE_APPROVAL` (`true`/`false`)
- `PUBLIC_COMMENTS_MAX_LEN` (default `200`)

Important:

- Do NOT use `sb_secret_*` key in frontend env vars.

## 5) Validation Status

### 5.1 Local checks (passed in this session)


- `pnpm test`
- `pnpm test:e2e`
- `pnpm build`

### 5.2 Manual cloud checks

- Anonymous-auth user creation: confirmed by user.
- Remaining recommended manual checks:
  1. On `/posts/paragraph-anchor-design`, submit comment and refresh (persist check).
  2. Set one comment `status = hidden` in Supabase and verify it is not visible in frontend (RLS behavior check).
  3. Confirm env vars exist for both Production and Preview in Vercel.

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
  - `src/lib/supabaseClient.ts`
  - `src/lib/comments/types.ts`
  - `src/lib/comments/constants.ts`
  - `src/lib/comments/validation.ts`
  - `src/lib/comments/api.ts`
  - `src/components/comments/ParagraphComments.tsx`
- Markdown anchor plugin:
  - `src/lib/markdown/rehypeParagraphAnchors.ts`
- DB migration:
  - `supabase/migrations/20260220_000001_comments.sql`
- Tests:
  - `src/lib/markdown/rehypeParagraphAnchors.test.ts`
  - `src/lib/comments/validation.test.ts`
  - `src/components/comments/ParagraphComments.test.tsx`
  - `tests/e2e/paragraph-comments.spec.ts`

## 7) Suggested Next Tasks (Priority Order)

1. Add lightweight admin moderation workflow (optional):
   - switch default to `pending` via env + DB policy strategy.
2. Add rate-limit / anti-spam minimum safeguards (server-side).
3. Add `updated_at` and moderation audit columns if moderation is planned.
4. Add CI workflow (run `pnpm test` + `pnpm build` on PR).
5. Add production monitoring/logging for comment API failures.

## 8) Notes for Next Agent

- Repository is on `main` tracking `origin/main`; current session added `AGENT_CONTEXT.md` and it may still need commit.
- Avoid introducing server-side secret key usage in client code.
- Keep paragraph anchor contract stable; downstream comment data depends on it.
