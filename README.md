# MyBlog v1

> AI 代理请先阅读 [Agents.md](./Agents.md) 了解项目背景、设计决策与协作规范。

Astro + React + Waline 的主题化知识博客首版，当前采用“博客前端 + 独立 Waline 服务 + Supabase PostgreSQL”三段式评论架构。

## 核心特性

- Topic 优先入口（文章作为知识节点）
- 文章页 Waline 评论
- 段落锚点与右侧旁注/脚注联动
- 独立部署的 Waline 服务端，不把评论后端揉进博客前端

## 评论系统架构

| 层 | 责任 | 仓库内落点 |
|---|---|---|
| blog frontend (client) | 渲染文章页并在客户端挂载 Waline | `src/pages/posts/[slug].astro`, `src/components/comments/WalineComments.tsx`, `src/styles/waline.css` |
| waline server | 独立评论服务进程，提供 `/api/comment` 与 `/ui` 管理后台 | `waline-server/` |
| database (postgres on supabase) | 评论、计数器、用户表存储 | `waline-server/sql/waline.pgsql` |

当前前端已经完成的接入方式：

- 文章页通过 `client:load` 挂载 `WalineComments`
- 评论 `path` 固定为 `/posts/<slug>`
- `PUBLIC_WALINE_SERVER_URL` 缺失时不会报错，而是渲染配置提示

这意味着：

- 更换博客域名时，只要文章路径仍是 `/posts/<slug>`，评论不会串文章
- 如果改动文章 slug，Waline 会视为新的评论线程

## 本地运行博客前端

```bash
pnpm install
pnpm dev
```

## 前端环境变量

复制 `.env.example` 为 `.env` 并填写：

```bash
PUBLIC_WALINE_SERVER_URL=https://comments.example.com
```

`PUBLIC_WALINE_SERVER_URL` 的用途：

- 它会被注入浏览器端，用于 `@waline/client` 初始化
- 它必须指向已部署好的 Waline server 地址，而不是 Supabase 地址
- 若不填写，文章页仍可正常渲染，只是评论区显示“当前未启用评论服务”的提示

## 文章编写：参考文献与脚注

新文章里，解释性注释和参考文献统一使用标准 GFM 脚注；正文引用位置决定右侧 rail 的出现位置。约定如下：

```md
这是解释性注释[^note-example]，相关资料可参考[^ref-example]

[^note-example]: 解释性说明文字。
[^ref-example]: Supabase Documentation - Row Level Security (RLS) for Postgres. <https://supabase.com/docs/guides/database/postgres/row-level-security>
```

- 右侧 rail 会按脚注第一次在正文中被引用的位置浮动，而不是把参考文献统一追加到末尾。
- 解释性注释使用 `note-*` 前缀，参考文献使用 `ref-*` 前缀；渲染层会据此前缀区分 `注释` 与 `引用`。
- `figures` frontmatter 继续保留，但 `figures[].sourceRefIds` 只允许指向 `ref-*` bibliography footnote。

## 评论部署方式

本仓库已经提供独立部署单元：[`waline-server/`](./waline-server/README.md)

推荐部署模型：

1. 博客前端继续作为 Astro 项目部署在现有 Vercel 项目。
2. 使用同一个 GitHub 仓库，再创建第二个 Vercel 项目，Root Directory 指向 `waline-server/`。
3. 使用 Supabase PostgreSQL 作为 Waline 存储。
4. 将 Waline 服务地址回填到博客前端的 `PUBLIC_WALINE_SERVER_URL`。

## 前端在不同环境如何配置

| 环境 | `PUBLIC_WALINE_SERVER_URL` 建议值 | 说明 |
|---|---|---|
| 本地开发 | 留空，或指向本地/预览 Waline 服务 | 留空时前端优雅降级，不阻塞页面开发 |
| Preview | 指向 Preview Waline 服务地址 | 避免预览评论写入生产评论库 |
| Production | 指向正式评论域名，如 `https://comments.example.com` | 建议与正式博客域名配对设置 `SECURE_DOMAINS` |

完整的 Waline server 部署、Supabase 初始化和后台注册步骤见：

- [`waline-server/README.md`](./waline-server/README.md)

## 测试

```bash
pnpm test
pnpm test:e2e
pnpm build
```

## 路由

- `/`
- `/topics`
- `/topics/[slug]`
- `/posts/[slug]`
- `/concepts/[slug]`
- `/archives`
