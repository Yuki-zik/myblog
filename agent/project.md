# 项目概况 (MyBlog v1)

## 1. 目标与定位

这是一个基于 **Astro + React + Waline** 的主题化知识博客（Theme-first knowledge blog）。核心定位是 Topic 优先的知识组织与沉浸式长文阅读；评论系统已从站内 Supabase 方案切换为 Waline，段落锚点则保留为阅读侧栏、脚注与旁注定位的基础设施。

## 2. 架构图及核心模块

- **前端生成与聚合层**: `Astro (@astrojs/react, astro@5.17.3)` — 负责静态站点生成、服务端渲染和按需互动 (Astro Islands)。
- **交互组件层**: `React (react@19)` — 承担 Waline 挂载、局部交互组件和测试友好的客户端封装。
- **Waline 服务端部署层**: `waline-server/index.cjs` + `waline-server/vercel.json` — 与博客前端解耦的独立部署单元，推荐作为同仓库下第二个 Vercel 项目部署。
- **评论数据存储层**: `Supabase PostgreSQL` + `waline-server/sql/waline.pgsql` — 承担 Waline 评论、计数器和后台用户表存储。
- **内容处理层**: `src/lib/markdown/rehypeParagraphAnchors.ts` — 在 Markdown 解析阶段为有效段落生成唯一锚点 ID（格式：`sectionSlug::p0`），供阅读侧栏和脚注关联使用。
- **评论集成层**: `src/components/comments/WalineComments.tsx` — 统一封装 Waline `init()` 调用、主题切换适配和缺省配置提示。
- **搜索与导航层**: `src/lib/search/index.ts`, `src/components/search/HeaderSearch.astro` — 静态搜索索引端点（`/search-index.json`）+ 客户端即时搜索 UI。
- **目录组件层**: `src/lib/posts/toc.ts`, `src/components/post/PostToc.astro` — 从 Astro headings 提取 H2/H3，渲染带当前章节高亮的固定/折叠 TOC。
- **主题系统层**: `src/styles/tokens.css` + `src/styles/*.css` — 基于 five-color foundation 的 semantic token contract，并在现有 Astro + React 架构内吸收 Astro Theme Pure 的阅读优先视觉语言；页面、结构区、阅读区和 Waline 集成样式都通过同一套 light/dark 语义 token 驱动。

## 3. 技术栈和依赖

- **框架**: Astro 5.x, React 19
- **评论系统**: `@waline/client` + `@waline/vercel`
- **样式**: 原生 CSS 模块化体系（`src/styles/tokens.css` + `base/layout/home/cards/search/theme-toggle/footer/archives/toc/article/waline`），无 CSS 框架
- **Markdown 渲染**: `remark-gfm` + 自定义 rehype 插件（脚注与段落锚点）
- **评论存储**: Supabase PostgreSQL（由独立 Waline server 消费）
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

### 评论集成
- `src/components/comments/WalineComments.tsx`
- `src/styles/waline.css`
- `waline-server/index.cjs`
- `waline-server/vercel.json`
- `waline-server/env.example`
- `waline-server/sql/waline.pgsql`

### 主题与样式系统
- `src/styles/tokens.css`
- `src/styles/base.css`, `layout.css`, `home.css`, `cards.css`, `search.css`, `theme-toggle.css`, `footer.css`, `archives.css`, `toc.css`, `article.css`, `waline.css`
- `src/styles/themeContract.test.ts`

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
- `src/lib/markdown/rehypeTufteFootnotes.ts`

### 测试
- `src/lib/markdown/rehypeParagraphAnchors.test.ts`
- `src/lib/markdown/rehypeTufteFootnotes.test.ts`
- `src/components/comments/WalineComments.test.tsx`
- `tests/e2e/paragraph-comments.spec.ts`

## 5. 环境变量

| 变量名 | 必填 | 说明 |
|---|---|---|
| `PUBLIC_WALINE_SERVER_URL` | ✅ | 博客前端公开环境变量，指向 Waline 服务端地址 |
| `SITE_NAME` | Waline server ✅ | 评论站点名称 |
| `SITE_URL` | Waline server ✅ | 博客正式地址 |
| `SERVER_URL` | Waline server ✅ | Waline 服务自身地址 |
| `JWT_TOKEN` | Waline server ✅ | Waline 后台与登录令牌密钥 |
| `PG_HOST` / `POSTGRES_HOST` | Waline server ✅ | Supabase PostgreSQL 主机 |
| `PG_PORT` / `POSTGRES_PORT` | Waline server ✅ | Supabase PostgreSQL 端口 |
| `PG_DB` / `POSTGRES_DATABASE` | Waline server ✅ | 数据库名 |
| `PG_USER` / `POSTGRES_USER` | Waline server ✅ | 数据库用户名 |
| `PG_PASSWORD` / `POSTGRES_PASSWORD` | Waline server ✅ | 数据库密码 |
| `PG_SSL` / `POSTGRES_SSL` | Waline server ✅ | 是否启用 SSL，Supabase 建议为 `true` |

## 6. 部署状态

- GitHub 仓库：`https://github.com/Yuki-zik/myblog`（分支 `main`）
- 托管平台：Vercel（已连接 GitHub，自动部署）
- 评论后端：仓库内已补充 `waline-server/` 独立部署单元；仍需创建单独 Vercel 项目并连接 Supabase PostgreSQL
