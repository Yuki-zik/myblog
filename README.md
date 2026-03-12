<!--
 * @Author: Yuki-zik 226004241@nbu.edu.cn
 * @Date: 2026-02-20 23:09:42
 * @LastEditors: Yuki-zik 226004241@nbu.edu.cn
 * @LastEditTime: 2026-02-21 01:08:50
 * @FilePath: \myblog\README.md
 * @Description: 
 * 
 * Copyright (c) 2026 by ${git_name_email}, All Rights Reserved. 
-->
# MyBlog v1

> 📖 AI 代理请先阅读 [`Agents.md`](./Agents.md) 以了解项目背景、设计决策、当前架构状态和开发规范。
Astro + React + Supabase 的主题化博客首版，实现：

- Topic 优先入口（文章作为知识节点）
- 段落级短评（`post_slug + anchor_id`）
- Supabase 自有评论数据与 RLS
- 匿名身份评论（Anonymous Sign-In）

## 🎨 博客界面与交互设计核心

本博客在设计上主打**极简的沉浸式阅读**与**高度上下文相关的互动**，并原生支持深浅色模式（Dark/Light Mode）。

主要设计特色与界面流转如下：

### 1. 全局布局 (BaseLayout)
* **导航栏**：包含“首页”、“主题”和“归档”三个核心入口，以及一个动态判断系统偏好的主题切换器（Theme Toggle）。
* **响应式内容区**：文章和主题采用中心化固定最大宽度（`.shell`）布局，保障长文阅读的舒适度。

### 2. 核心界面清单
* **首页 (`/`) & 主题列表 (`/topics`)**：
  * 主打 **卡片式网格布局 (Grid)**，展示预设的核心“主题 (Topics)”。
  * 传达的理念是：“每个主题都是知识网络入口，而不是时间流末端”。
* **主题详情页 (`/topics/[slug]`)**：
  * **主题地图**，聚合了当前主题的描述、专属入门路径（Entry Posts）、带有封面的相关文章列表、相关概念（Pill-list 胶囊样式），以及同级关联主题。
* **文章阅读页 (`/posts/[slug]`)**：
  * 顶部全宽或大版型的封面图（Hero Variant），展示发布及更新时间、标签（Topics）。
  * 正文区通过自定义 Markdown 插件解析，自动分离 `<p>` 标签并注入锚点。
* **时间归档页 (`/archives`)**：
  * 提供传统的、按年/月垂直组织的时间轴视图，方便快速追溯错过的文章。

### 3. 创新交互组件：段落短评 (Paragraph Comments)
* **按需浮动图标**：在文章的每一个独立段落边缘，计算挂载点并以 React Portal 的方式注入一个交互聊天泡泡（Bubble），展示该段落当前的评论数。
* **内联抽屉面板**：点击气泡后，会在当前段落下展开局部的评论阅读与发布面板（不会跳转页面）。
* **快速标签与限制**：支持选中短评预设标签（如“补充说明”、“不同看法”），提供严格的字数限制与错误反馈 UI。


## 本地运行

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_COMMENTS_REQUIRE_APPROVAL`（可选）
- `PUBLIC_COMMENTS_MAX_LEN`（可选，默认 200）

## Supabase 初始化

1. 在 Supabase SQL Editor 执行：`supabase/migrations/20260220_000001_comments.sql`
2. 在 Auth 设置中开启 **Anonymous Sign-Ins**

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
