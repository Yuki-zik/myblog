# 项目概况 (MyBlog v1)

## 1. 目标与定位
这是一个基于 **Astro + React + Supabase** 的主题化知识博客（Theme-first knowledge blog）。核心特色是提供知识节点式的 Topic 优先入口，以及支持针对段落级别的短评系统。它允许通过 Supabase RLS 保障安全的数据读写，并原生支持匿名访客评论。

## 2. 架构图及核心模块
- **前端生成与聚合层**: `Astro (@astrojs/react, astro@5.17.3)` - 负责静态站点生成、服务端渲染和按需互动 (Astro Islands)。
- **交互组件层**: `React (react@19)` - 专门负责评论系统面板、评论发布等强交互逻辑。
- **内容处理层**: `src/lib/markdown/rehypeParagraphAnchors.ts` - 自定义 Rehype 插件，用于在 Markdown 解析阶段为有效段落生成并注入唯一锚点 ID (`sectionSlug::p0` 格式)。
- **评论与后端通信层**: `src/lib/comments/` - 封装了 Supabase 客户端 API 和类型验证 (`createComment`, `fetchVisibleComments`, `ensureAnonymousSession`)。
- **数据库层**: `Supabase` - 使用 PostgreSQL 存储评论数据，采用 RLS 策略 (读 `visible`，只创建专属作者)。

## 3. 技术栈和依赖
- **框架**: Astro, React
- **持久化**: `@supabase/supabase-js`, PostgreSQL
- **样式**: (基于现有项目未大量涉及 CSS，推测可能为纯原生或 Tailwind, 当前未写明框架)
- **工程化与测试**:
  - `pnpm`
  - 单元/集成测试: `vitest`
  - E2E测试: `@playwright/test`
  - GitHub Slugger, Hast/Unist 工具集(Markdown AST)

## Recent Architecture Updates (2026-02-22)

- Added site-level author profile config and post author resolver (src/lib/site.ts, src/lib/posts/author.ts).
- Post detail pages now render author metadata and expose <meta name=\"author\">.
- Added static search index endpoint (/search-index.json) and header instant search UI for posts/topics/concepts.
- Added post TOC generation from Astro headings (H2/H3) and a sticky/collapsible TOC component with active-section highlighting.
- Added /author page showing author profile summary and authored post list.
- Expanded test coverage for search indexing and TOC generation; validated build and existing E2E flows.- Added a second comment system for article-level discussions (bottom comment box) with separate Supabase schema/table (rticle_comments) to coexist with paragraph comments.
- Added markdown-rendered article comments with safe sanitization (eact-markdown, emark-gfm, ehype-sanitize).
- Added screenshot-inspired warm-tone comment UI and e2e coverage for article comment submit + coexistence with paragraph comments.
## Article Comments Addendum (ASCII-safe correction)

- Added a second comment system for article-level discussions (bottom comment box) with a separate Supabase table named article_comments, coexisting with paragraph comments.
- Added markdown-rendered article comments with safe sanitization using react-markdown, remark-gfm, and rehype-sanitize.
- Added screenshot-inspired warm-tone UI and E2E coverage for article comment submit + coexistence with paragraph comments.
