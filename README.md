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
Astro + React + Waline 的主题化博客首版，实现：

- Topic 优先入口（文章作为知识节点）
- 文章页 Waline 评论
- 段落锚点与右侧旁注/脚注联动
- 轻量可替换的外部评论服务接入

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
  * 文末评论由 Waline 挂载，正文段落锚点继续服务目录/脚注/旁注定位。
* **时间归档页 (`/archives`)**：
  * 提供传统的、按年/月垂直组织的时间轴视图，方便快速追溯错过的文章。

## 本地运行

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

- `PUBLIC_WALINE_SERVER_URL`

## Waline 初始化

1. 自行部署或准备可用的 Waline 服务端。
2. 将服务端地址写入 `PUBLIC_WALINE_SERVER_URL`。
3. 启动站点后，文章页会在文末自动挂载 Waline 评论区。

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
