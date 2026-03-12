# 项目概况 (MyBlog v1)

## 1. 目标与定位

这是一个基于 **Astro + React + Supabase** 的主题化知识博客（Theme-first knowledge blog）。核心特色是提供知识节点式的 Topic 优先入口，以及支持针对段落级别的短评系统。它允许通过 Supabase RLS 保障安全的数据读写，并原生支持匿名访客评论。

## 2. 架构图及核心模块

- **前端生成与聚合层**: `Astro (@astrojs/react, astro@5.17.3)` — 负责静态站点生成、服务端渲染和按需互动 (Astro Islands)。
- **交互组件层**: `React (react@19)` — 专门负责评论系统面板、评论发布等强交互逻辑。
- **内容处理层**: `src/lib/markdown/rehypeParagraphAnchors.ts` — 自定义 Rehype 插件，在 Markdown 解析阶段为有效段落生成并注入唯一锚点 ID（格式：`sectionSlug::p0`）。
- **评论与后端通信层**: `src/lib/comments/` — 封装 Supabase 客户端 API 和类型验证（`createComment`, `fetchVisibleComments`, `ensureAnonymousSession`）。
- **文章级评论层**: `src/lib/articleComments/` — 独立的文章底部评论模块，对应独立的 Supabase 表 `article_comments`，与段落评论并行存在。
- **搜索与导航层**: `src/lib/search/index.ts`, `src/components/search/HeaderSearch.astro` — 静态搜索索引端点（`/search-index.json`）+ 客户端即时搜索 UI。
- **目录组件层**: `src/lib/posts/toc.ts`, `src/components/post/PostToc.astro` — 从 Astro headings 提取 H2/H3，渲染带当前章节高亮的固定/折叠 TOC。
- **数据库层**: `Supabase` — 使用 PostgreSQL 存储评论数据，采用 RLS 策略（读 `visible`，只创建专属作者）。

## 3. 技术栈和依赖

- **框架**: Astro 5.x, React 19
- **持久化**: `@supabase/supabase-js`, PostgreSQL（云托管 Supabase）
- **样式**: 原生 CSS（`src/styles/global.css`），无 CSS 框架
- **Markdown 渲染**: `react-markdown`, `remark-gfm`, `rehype-sanitize`（文章评论）
- **工程化与测试**:
  - 包管理：`pnpm`
  - 单元/集成测试：`vitest`
  - E2E 测试：`@playwright/test`
  - Markdown AST 工具：GitHub Slugger, Hast/Unist

## 4. 关键文件索引

### 项目配置
- `package.json`, `astro.config.mjs`, `tsconfig.json`
- `vitest.config.ts`, `playwright.config.ts`

### 内容模型
- `src/content.config.ts`
- `src/content/posts/*`, `src/content/topics/*`, `src/content/concepts/*`

### 段落评论域
- `src/lib/supabaseClient.ts`
- `src/lib/comments/types.ts`, `constants.ts`, `validation.ts`, `api.ts`
- `src/components/comments/ParagraphComments.tsx`

### 文章级评论域
- `src/lib/articleComments/*`
- `src/components/comments/ArticleComments.tsx`
- `src/styles/article-comments.css`

### 搜索
- `src/lib/search/index.ts`
- `src/pages/search-index.json.ts`
- `src/components/search/HeaderSearch.astro`

### 目录 (TOC)
- `src/lib/posts/toc.ts`
- `src/components/post/PostToc.astro`

### 作者
- `src/lib/site.ts`, `src/lib/posts/author.ts`
- `src/pages/author.astro`

### Markdown 锚点插件
- `src/lib/markdown/rehypeParagraphAnchors.ts`

### DB Migrations
- `supabase/migrations/20260220_000001_comments.sql` — 段落评论表
- `supabase/migrations/20260222_000002_article_comments.sql` — 文章评论表

### 测试
- `src/lib/markdown/rehypeParagraphAnchors.test.ts`
- `src/lib/comments/validation.test.ts`
- `src/components/comments/ParagraphComments.test.tsx`
- `tests/e2e/paragraph-comments.spec.ts`
- `tests/e2e/article-comments.spec.ts`

## 5. 环境变量

| 变量名 | 必填 | 说明 |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | ✅ | Supabase 项目 URL |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase 可发布 anon key（不得使用 service_role key） |
| `PUBLIC_COMMENTS_REQUIRE_APPROVAL` | 可选 | `true`/`false`，评论是否需要审核 |
| `PUBLIC_COMMENTS_MAX_LEN` | 可选 | 默认 200，评论最大字符数 |

## 6. 部署状态

- GitHub 仓库：`https://github.com/Yuki-zik/myblog`（分支 `main`）
- 托管平台：Vercel（已连接 GitHub，自动部署）
- Supabase：已开启 Anonymous Sign-Ins；RLS 已配置
