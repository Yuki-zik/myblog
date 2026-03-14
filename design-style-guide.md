# design-style-guide

> 状态更新（2026-02-23）：本文件中的“P0 问题”是审计快照；代码已在后续补丁中修复（键盘焦点可见性与主文章 Markdown 基础排版）。
> 状态更新（2026-03-14）：评论系统已迁移到 Waline，本文中所有 `ParagraphComments` / `ArticleComments` / `comments.css` / `article-comments.css` 相关条目均属于历史快照，需以 `src/components/comments/WalineComments.tsx` 与 `src/styles/waline.css` 为准。

## 风格定位

一句话风格定义：以内容阅读为核心、用浅色自然系底色 + 玻璃感头部 + 圆角卡片承载信息，并在文章页叠加“段落短评 + 目录联动”的知识博客界面风格。

- 5 个关键词
  - 主题化知识导航（`/topics`、`/concepts`、`/posts` 组合；`src/pages/*.astro`）
  - 自然冷暖混合底色（`--bg-layer` 渐变背景；`src/styles/global.css`）
  - 圆角卡片 + 细边框（`.card`、`.post-card`、`.author-posts`；`src/styles/global.css`）
  - 轻量交互反馈（hover 位移 + 边框变化；`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css`）
  - 阅读辅助增强（段落锚点评论 + TOC 滚动高亮；`src/lib/markdown/rehypeParagraphAnchors.ts`, `src/components/post/PostToc.astro`, `src/components/comments/ParagraphComments.tsx`）

- 3 个“明确不追求”的反面特征
  - 不追求 Tailwind 原子类驱动（未发现 Tailwind 依赖/配置；`package.json`, 仓库内无 `tailwind.config.*`）
  - 不追求重型组件库统一皮肤（主要是全局 CSS + 组件语义类；`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css`）
  - 不追求强烈霓虹/高饱和科技感（主色为 `--accent` 青绿、背景低对比渐变；`src/styles/global.css` 变量）

证据点（样式体系优先级/覆盖关系）：
- 全局基座：`src/layouts/BaseLayout.astro` 导入 `src/styles/global.css`
- 页面级附加（文章页专属）：`src/pages/posts/[slug].astro` 导入 `src/styles/article-comments.css` 与 `src/styles/comments.css`
- 组件内无 `<style>`：`rg -n "<style" src` 无结果
- 无 CSS Module：`src/components` 下仅 `.astro/.tsx` + `src/styles/*.css`，未发现 `*.module.css`
- 局部 token 覆盖：`.article-comments { --ac-* }`（`src/styles/article-comments.css`）、`.archives-page { --archive-* }`（`src/styles/global.css`）
- 少量内联样式覆盖：`src/pages/index.astro`, `src/pages/topics/index.astro`（`style="margin-top: 0.6rem"`）；`src/components/post/PostCover.astro`（`fallbackStyle` 设置 `--cover-*`）

## 设计 Token

### 颜色（含暗色模式映射）

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `color.bg` | Light: `#f4f8f5` / Dark: `#0f1417` | `src/styles/global.css` `:root --bg` / `:root[data-theme="dark"] --bg` | 页面基底色（配合 `--bg-layer`） |
| `color.bgLayer` | 多层 radial + linear gradient（明/暗各一套） | `src/styles/global.css` `--bg-layer` | 全站背景氛围层 |
| `color.surface` | Light: `#ffffff` / Dark: `#172126` | `src/styles/global.css` `--surface` | 卡片/面板主表面 |
| `color.surfaceSoft` | Light: `#f7fbf8` / Dark: `#1c2730` | `src/styles/global.css` `--surface-soft` | 次级表面（搜索结果项、封面底） |
| `color.text` | Light: `#182120` / Dark: `#e5eeea` | `src/styles/global.css` `--text` | 主文字 |
| `color.subtle` | Light: `#55635f` / Dark: `#a2b4ae` | `src/styles/global.css` `--subtle` | 次要文字/说明文字 |
| `color.line` | Light: `#d4ddd8` / Dark: `#29373a` | `src/styles/global.css` `--line` | 细边框/分隔线 |
| `color.lineStrong` | Light: `#bccac4` / Dark: `#3b4c50` | `src/styles/global.css` `--line-strong` | 强调边框（输入框/按钮） |
| `color.accent` | Light: `#0d7f70` / Dark: `#55c8b0` | `src/styles/global.css` `--accent` | 链接与强调色 |
| `color.accentStrong` | Light: `#0a665a` / Dark: `#72dcc6` | `src/styles/global.css` `--accent-strong` | hover/强化文本 |
| `color.accentSoft` | Light: `#d5eee7` / Dark: `#203b36` | `src/styles/global.css` `--accent-soft` | pill 背景、focus ring 混色来源 |
| `color.info` | Light: `#2667a6` / Dark: `#80b8f0` | `src/styles/global.css` `--info` | 搜索 topic badge / 信息态文本 |
| `color.danger` | Light: `#b53b3b` / Dark: `#e67e7e` | `src/styles/global.css` `--danger` | 错误语义（评论错误态基础） |
| `color.headerBg` | Light: `rgba(247,251,248,.88)` / Dark: `rgba(20,29,33,.82)` | `src/styles/global.css` `--header-bg` | 粘性头部半透明背景 |
| `color.toc.*` | `--toc-bg`, `--toc-title`, `--toc-text`, `--toc-num`, `--toc-active`（明暗映射） | `src/styles/global.css` | 文章目录颜色体系 |
| `color.paragraphComment.*` | `--comment-*`（明暗映射） | `src/styles/global.css` | 段落短评泡泡/线程/标签/输入/错误信息 |
| `color.articleComment.*` | `--ac-*`（在 `.article-comments` 和 dark override 内定义） | `src/styles/article-comments.css` | 文章底部评论区独立暖色主题 |
| `color.archive.*` | `--archive-*`（`.archives-page` + dark override） | `src/styles/global.css` | 归档页视觉局部主题（蓝灰/深色卡面） |

### 字体

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `font.family.base` | `"IBM Plex Sans", "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif` | `src/styles/global.css` `body` | 全站正文/按钮/表单默认字体 |
| `font.family.heading` | 未单独定义（继承 `body`） | `src/styles/global.css`（`h1,h2,h3` 仅改行高与字距） | 标题与正文统一字体风格 |
| `font.family.code` | 未显式定义（浏览器/渲染器默认 monospace） | 未找到 `code/pre { font-family }`（`src/styles/global.css`, `src/styles/article-comments.css`） | 代码字体未品牌化 |

### 字号层级（H1–H6/正文/注释/按钮/代码）

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `font.size.h1` | `clamp(2rem, 3.2vw, 3rem)` | `src/styles/global.css` `h1` | 全站一级标题（页面标题/文章标题） |
| `font.heading.common` | `line-height: 1.22; letter-spacing: -0.01em` | `src/styles/global.css` `h1,h2,h3` | H1-H3 标题紧凑排版 |
| `font.size.h2` | 未显式定义（UA 默认） | `src/styles/global.css`（无 `h2 { font-size }`） | 依赖浏览器默认字号 |
| `font.size.h3` | 未显式定义（UA 默认） | `src/styles/global.css`（无 `h3 { font-size }`） | 依赖浏览器默认字号 |
| `font.size.h4-h6` | 未显式定义（UA 默认） | `src/styles/global.css`（无对应规则） | 依赖浏览器默认字号 |
| `font.size.body` | 未显式定义（通常浏览器默认 `16px`） | `src/styles/global.css` `body`（无 `font-size`） | 正文与大多数组件继承 |
| `font.lineHeight.body` | `1.68` | `src/styles/global.css` `body` | 全站阅读行高 |
| `font.size.subtle.small` | 常见 `0.82rem` / `0.86rem` / `0.92rem` | `src/styles/global.css` `.header-search-status`, `.post-card-date`; `src/styles/comments.css` `.comment-empty`; `src/styles/article-comments.css` `.article-comments-markdown-hint` | 注释/元信息字号分层（非统一 token） |
| `font.size.button.themeToggle` | `0.86rem` | `src/styles/global.css` `.theme-toggle` | 头部主题切换按钮 |
| `font.size.button.commentBubble` | `0.82rem` | `src/styles/comments.css` `.comment-bubble` | 段落评论气泡按钮 |
| `font.size.button.tag` | `0.78rem` | `src/styles/comments.css` `.tag` | 段落评论标签按钮 |
| `font.size.code.inlineArticleComment` | `0.88em` | `src/styles/article-comments.css` `.article-comment-markdown code` | 文章评论区内联代码 |
| `font.size.tocTitle` | `1.4rem` | `src/styles/global.css` `.post-toc-title` | 目录标题 |
| `font.size.articleCommentsTitle` | `clamp(1.7rem, 3vw, 2.2rem)` | `src/styles/article-comments.css` `.article-comments-title` | 文章底部评论标题 |

### 间距尺度（隐式尺度，未抽象为变量）

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `space.pageShellInline` | `calc(100vw - 2rem)`（两侧合计约 `2rem`） | `src/styles/global.css` `.shell` | 页面主容器水平留白 |
| `space.sectionBlock` | `2rem` | `src/styles/global.css` `.content-section` | 区块垂直间距 |
| `space.gridGap.base` | `1rem` | `src/styles/global.css` `.grid` | 通用 grid 间距 |
| `space.gridGap.postCard` | `1.2rem` | `src/styles/global.css` `.post-card-grid` | 文章卡片列表间距 |
| `space.cardPadding.base` | `1.05rem 1.1rem` | `src/styles/global.css` `.card` | 通用卡片内边距 |
| `space.postCardPadding` | `0.95rem 1rem 1.08rem` | `src/styles/global.css` `.post-card-body` | 文章卡片内容区内边距 |
| `space.articleCommentsPadding` | `1.4rem 1.4rem 1.1rem`（移动端 `1rem 0.9rem 0.95rem`） | `src/styles/article-comments.css` `.article-comments`; media rule | 文章底部评论容器内边距 |
| `space.paragraphReserveRight` | `4.65rem` | `src/styles/global.css` `.post-body p` | 为段落评论气泡预留右侧空间 |

### 圆角

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `radius.pill` | `999px` | `src/styles/global.css` `.theme-toggle`, `.pill-list a`; `src/styles/comments.css` `.comment-bubble`, `.tag`; `src/styles/article-comments.css` `.article-comment-provider` | 药丸按钮/标签/徽标 |
| `radius.card.m` | `16px` | `src/styles/global.css` `.card`; 移动端 `.post-card`/`.post-cover--hero` | 通用卡片/移动端收敛圆角 |
| `radius.card.l` | `18px` | `src/styles/global.css` `.home-archive-entry`, `.author-posts`; `src/styles/article-comments.css` `.article-comments-list-wrap` | 面板卡片 |
| `radius.card.xl` | `20px` | `src/styles/global.css` `.post-card`, `.post-cover--hero`, `.archives-page` | 重要卡片/封面容器 |
| `radius.card.2xl` | `22px` | `src/styles/global.css` `.author-hero`; `src/styles/article-comments.css` `.article-comments` | 大型强调模块 |
| `radius.panel.sm` | `8px` / `10px` / `12px` / `14px` | `src/styles/comments.css` `.submit`, `.comment-item`, `.comment-thread-panel`; `src/styles/article-comments.css` `.article-comment-item`, `.article-comments-auth-btn` | 交互子组件细粒度层级 |

### 阴影

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `shadow.base` | Light: `0 18px 44px rgba(17,44,39,.08)` / Dark: `0 18px 44px rgba(0,0,0,.36)` | `src/styles/global.css` `--shadow` | 通用卡片与封面阴影 |
| `shadow.searchPanel` | `0 20px 44px rgba(10,30,26,.16)` | `src/styles/global.css` `.header-search-panel` | 搜索浮层 |
| `shadow.postCard.hover` | `0 22px 50px rgba(10,48,45,.17)` | `src/styles/global.css` `.post-card:hover` | 卡片 hover 提升 |
| `shadow.archiveTile` | `0 10px 24px rgba(36,42,58,.24)`（dark 覆盖更重） | `src/styles/global.css` `.archives-page --archive-tile-shadow` | 归档贴片/年份砖块 |
| `shadow.articleComments` | `0 18px 44px rgba(33,23,16,.07)` | `src/styles/article-comments.css` `.article-comments` | 文章底部评论模块整体 |
| `shadow.articleSubmit` | `0 10px 20px rgba(234,143,99,.24)` | `src/styles/article-comments.css` `.article-comments-submit` | 文章评论提交按钮 |

### 边框

| Token 名称 | 取值 | 来源位置（文件/变量） | 用途说明 |
|---|---|---|---|
| `border.width.base` | `1px`（全站主流） | `src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css` 多处 | 卡片、输入框、分隔线、按钮统一细边框 |
| `border.color.default` | `var(--line)` | `src/styles/global.css` `.card`, `.post-card`, `.site-header`, `.home-archive-entry` | 常规边界 |
| `border.color.strong` | `var(--line-strong)` | `src/styles/global.css` `.header-search-input`, `.theme-toggle` | 交互元素默认边界 |
| `border.color.focusSearch` | `color-mix(in srgb, var(--accent) 58%, var(--line-strong) 42%)` | `src/styles/global.css` `.header-search-input:focus` | 搜索输入聚焦 |
| `border.color.accentHover` | 多处 `color-mix(... var(--accent) ... var(--line) ...)` | `src/styles/global.css` `.card:hover`, `.post-card:hover`, `.header-search-result-link:hover` | hover 强调边界 |
| `border.color.validationError` | `rgba(178, 71, 71, 0.42)`（文章评论输入） | `src/styles/article-comments.css` `[aria-invalid="true"]` | 表单错误态 |

## 布局系统

### 全局布局规则

- 页面主容器：`src/styles/global.css` `.shell { width: min(980px, calc(100vw - 2rem)); margin: 0 auto; }`
  - 证据点：`src/styles/global.css` `.shell`
- 顶部导航：粘性头部 + 毛玻璃背景
  - `position: sticky; top: 0; z-index: 20; backdrop-filter: blur(10px)`（`.site-header`）
  - 证据点：`src/styles/global.css` `.site-header`
- 头部内部布局：`flex + wrap`，在小屏时搜索框换行到第三位
  - `.site-header .shell`, `.header-search`, `@media (max-width: 900px)` 的 `.header-search { order: 3; flex: 1 0 100%; }`
  - 证据点：`src/styles/global.css` `.site-header .shell`, `.header-search`, `@media (max-width: 900px)`
- 响应式断点（显式出现）
  - `1060px`：归档网格 `4 -> 3` 列
  - `900px`：文章阅读布局单列、TOC 移动化、头部搜索换行
  - `760px`：作者统计单列、归档网格进一步收缩、文章评论区移动布局
  - `768px`：头部/卡片/段落评论适配
  - `1080px`：文章评论表单 `3 -> 2` 列
  - 证据点：`src/styles/global.css` 与 `src/styles/article-comments.css` 的 `@media (...)`

### 关键页面结构概览

#### 首页（`/`）

结构说明：主题入口 + 最新文章 + 归档入口的三段式首页，复用通用 `content-section`/`grid`/`card`/`PostCard`。

层级树（证据：`src/pages/index.astro`）：

```text
BaseLayout
└─ section.content-section (站点标题/副标题)
└─ section.grid.topic-grid
   └─ article.card * N (主题卡片)
└─ section.content-section[data-latest-posts]
   └─ div.grid.post-card-grid
      └─ PostCard * N
└─ section.content-section.home-archive-entry
   └─ a.archive-entry-button -> /archives
```

#### 列表页（主题列表 `/topics`）

结构说明：延续首页主题卡片布局，只保留标题说明 + 主题卡片网格。

层级树（证据：`src/pages/topics/index.astro`）：

```text
BaseLayout
└─ section.content-section (标题/说明)
└─ section.grid.topic-grid
   └─ article.card * N
```

#### 文章页（`/posts/[slug]`）

结构说明：主阅读区 + 桌面侧栏 TOC 的双栏布局；文章正文下方串联“段落评论 + 全文评论”两套评论模式。

层级树（证据：`src/pages/posts/[slug].astro`, `src/styles/global.css` `.post-reading-layout`）：

```text
BaseLayout
└─ div.post-reading-layout
   ├─ div.post-reading-main
   │  ├─ article
   │  │  ├─ header.content-section.post-header
   │  │  │  ├─ PostCover(variant="hero")
   │  │  │  ├─ h1 + meta + summary + ul.pill-list
   │  │  └─ section.post-body[data-post-body]
   │  │     └─ <Content /> (Astro Markdown 渲染)
   │  ├─ ParagraphComments (React island, client:load)
   │  └─ ArticleComments (React island, client:load)
   └─ aside.post-toc-column (可选)
      └─ PostToc (桌面 + 移动 details)
```

#### 标签/分类页（项目实际为 Topic/Concept 路径）

说明：项目没有独立 `/tags` 或 `/categories` 路由；“分类/标签语义”主要由 `topics` 和 `concepts` 两类内容集合承载，页面中用 `pill-list` 呈现标签化关系。

- Topic 详情页（`/topics/[slug]`）
  - 结构：主题说明 → Markdown 正文 → 入门路径（`ol.meta-list`）→ 相关文章（`PostCard` 网格）→ 相关概念/主题（`ul.pill-list`）
  - 证据点：`src/pages/topics/[slug].astro`
- Concept 详情页（`/concepts/[slug]`）
  - 结构：概念说明 → Markdown 正文 → 标签（可选 `pill-list`）→ 引用文章（`PostCard` 网格）→ 引用主题（`meta-list`）
  - 证据点：`src/pages/concepts/[slug].astro`

#### 搜索页

说明：当前没有独立 `/search` 页面；采用“头部即时搜索浮层 + 静态 JSON 索引端点”。

- UI 容器：`src/components/search/HeaderSearch.astro`（`.header-search`, `.header-search-panel`）
- 数据端点：`src/pages/search-index.json.ts`
- 布局挂载位置：`src/layouts/BaseLayout.astro`（头部导航中嵌入 `<HeaderSearch />`）

#### 额外：归档页（`/archives`）

说明：独立视觉子主题（蓝灰画布 + 图像 Banner + 年/月时间轴 + 方形封面贴片）。

- 页面结构证据：`src/pages/archives.astro`
- 样式证据：`src/styles/global.css` `.archives-page`, `.archive-year-section`, `.archive-grid`, `.archive-post-tile`

## 组件与模式

> 说明：以下只记录已在源码中出现的组件/模式；分页、灯箱等未实现会明确标注。

### 组件清单（含状态与证据）

| 组件/模式 | 视觉特征 | 交互行为 | 状态集（源码可见） | 对应实现依据 |
|---|---|---|---|---|
| 站点头部导航（Header + Theme Toggle） | 粘性半透明头部、细底边、圆角 pill 主题按钮 | 主题按钮循环切换 `system/light/dark`；写入 `localStorage`；同步 `colorScheme` | `system` / `light` / `dark` / `hover` / `theme-transitioning` | `src/layouts/BaseLayout.astro` (`themeInitScript`, `cyclePreference`, `data-theme`, `theme-toggle`); `src/styles/global.css` (`.site-header`, `.theme-toggle`, `html.theme-transitioning*`) |
| 头部即时搜索（HeaderSearch） | 圆角搜索框 + 下拉浮层 + 结果卡片 + 类型 badge | focus 预加载索引；input 实时搜索；Enter 跳首结果；Escape 关闭；点击外部关闭 | `hidden` / `open` / `loading` / `results` / `none` / `loadError` / `hover`（结果项）/ `focus`（输入框） | `src/components/search/HeaderSearch.astro` (`data-search-*`, `ensureSearchIndexLoaded`, `updateSearchResults`); `src/styles/global.css` (`.header-search-*`) |
| 通用卡片（`.card`） | 白/深色半透明表面、16px 圆角、统一阴影 | hover 上浮 2px + 边框强调 | `default` / `hover` | `src/styles/global.css` `.card`, `.card:hover`; 使用页 `src/pages/index.astro`, `src/pages/topics/index.astro` |
| 文章卡片（`PostCard`） | 大圆角封面 + 内容区 + 日期/标题/摘要/主题 pill | hover 上浮 4px + 阴影加重 | `default` / `hover` / `empty(list)`（列表页由页面逻辑处理） | `src/components/post/PostCard.astro`; `src/styles/global.css` `.post-card*`, `.post-card:hover`; 空态文本见 `src/pages/index.astro`/`src/pages/topics/[slug].astro`/`src/pages/concepts/[slug].astro` |
| 标签/主题 pill（`.pill-list`） | 青绿浅底药丸标签，圆角 999px | hover 仅颜色过渡（无位移） | `default` / `hover` | `src/styles/global.css` `.pill-list`, `.pill-list a`; 使用于 `src/pages/posts/[slug].astro`, `src/components/post/PostCard.astro`, `src/pages/topics/[slug].astro`, `src/pages/concepts/[slug].astro` |
| 文章封面（`PostCover`） | 图片封面或动态渐变 fallback 封面；支持 hero/card/archive-square 变体 | 无点击逻辑（点击由外层链接决定）；fallback 通过内联 CSS 变量注入不同配色/图形 | `variant=hero` / `variant=card` / `variant=archive-square` / `manual image` / `fallback` | `src/components/post/PostCover.astro` (`variant`, `fallbackStyle`, `data-pattern`); `src/styles/global.css` `.post-cover*`, `.post-cover-fallback*` |
| 文章目录 TOC（`PostToc`） | 桌面纯文本目录（去卡片背景）、移动端 `details/summary` 折叠 | `IntersectionObserver` + `hashchange` 计算当前标题；点击目录项高亮并在移动端自动收起 | `desktop` / `mobile` / `open` (`details[open]`) / `hover` / `is-active` / `aria-current=true` | `src/components/post/PostToc.astro` (`data-toc-link`, `is-active`, `IntersectionObserver`); `src/styles/global.css` `.post-toc*`, `.post-toc-link.is-active`, `.post-toc-mobile` |
| 段落短评（`ParagraphComments`） | 段落右侧气泡按钮 + 展开线程面板；紧凑标签、输入框、提交按钮 | 扫描 `p[data-anchor]` 并 Portal 注入；点击气泡展开；乐观更新；失败回滚 | `collapsed` / `expanded` / `empty` / `list` / `tag active` / `submitting` / `optimistic` / `info` / `error` / `globalError` | `src/components/comments/ParagraphComments.tsx` (`createPortal`, `expandedAnchorId`, `__optimistic`, `submittingAnchorIds`); `src/styles/comments.css` (`.comment-bubble`, `.comment-thread-panel`, `.tag.active`, `.comment-item.optimistic`, `.submit:disabled`, `.comment-error`) |
| 全文评论（`ArticleComments`） | 暖色系独立面板（22px 圆角）+ 评论列表 + 多字段表单 + 登录按钮组 | 初始化匿名会话；GitHub 登录跳转；Telegram 占位提示；提交后按审核配置展示成功/待审文案 | `loading` / `empty` / `list` / `field invalid` (`aria-invalid`) / `submitting` / `authBusy` / `info` / `error` / `disabled` | `src/components/comments/ArticleComments.tsx` (`loading`, `submitting`, `authBusy`, `handleGitHubLogin`, `handleTelegramPlaceholder`); `src/styles/article-comments.css` (`.article-comments-empty`, `[aria-invalid="true"]`, `.article-comments-submit:disabled`, `.article-comments-error`, `.article-comments-info`) |
| 全文评论 Markdown 内容 | 内联 code 胶囊、pre 容器、链接下划线 | 使用 `react-markdown` + GFM + sanitize；禁用 HTML；外链统一 `target="_blank"`；图片渲染被禁用 | `rendered markdown` / `sanitized` / `link external` / `img blocked` | `src/components/comments/ArticleComments.tsx` (`ReactMarkdown`, `remarkGfm`, `rehypeSanitize`, `skipHtml`, `components.a`, `components.img`); `src/styles/article-comments.css` `.article-comment-markdown *` |
| 归档贴片（`ArchivePostTile`） | 方形封面 + 底部 overlay 标题 + meta 条 | 外层整卡点击跳文章 | `default` / `hover`（无专门 hover 样式） | `src/components/post/ArchivePostTile.astro`; `src/styles/global.css` `.archive-post-tile`, `.archive-post-link::after`, `.archive-post-overlay`, `.archive-post-meta` |
| 作者页统计与列表（模式） | Hero 卡片 + 双列统计卡 + 列表型文章卡片 | 主要为静态链接交互 | `default` / `empty(list)` | `src/pages/author.astro`; `src/styles/global.css` `.author-hero`, `.author-stat-list`, `.author-posts`, `.author-post-list` |
| 提示/引用块（主文章） | 未见专门视觉样式定义 | 依赖浏览器默认 Markdown 渲染 | 未实现自定义状态 | 证据：`src/styles/global.css` 仅定义 `.post-body p` 与标题滚动偏移，无 `.post-body blockquote/table/pre/code` 专项规则 |
| 图片灯箱（主文章） | 未实现 | 未实现 | 未实现 | 证据：`src/components/post/PostCover.astro` 仅渲染封面；`src/components` 无 Lightbox 组件文件 |
| 分页 | 未实现 | 未实现 | 未实现 | 证据：`src/components` 文件列表仅 `search/post/comments`，未见分页组件；页面列表均一次性渲染 |

## 排版与内容呈现

### 正文排版规则（主文章）

- 正文挂载方式：Astro Content 渲染结果 `<Content />` 插入 `section.post-body[data-post-body]`
  - 证据点：`src/pages/posts/[slug].astro`
- 已显式定义的正文规则较少，重点服务“段落评论锚点”
  - 标题滚动偏移：`.post-body :where(h2, h3, h4, h5, h6) { scroll-margin-top: 102px; }`
  - 段落右侧预留评论位：`.post-body p { padding-right: 4.65rem; margin: 1rem 0; }`
  - 移动端取消右侧预留：`@media (max-width: 768px) .post-body p { padding-right: 0; }`
  - 证据点：`src/styles/global.css` `.post-body*`
- 列表/引用/表格/图片/代码块（主文章）未见专门样式
  - 说明：当前主要依赖浏览器默认样式与 Astro 默认 Markdown 输出
  - 证据点：`src/styles/global.css` 未定义 `.post-body ul/ol/blockquote/table/pre/code/img` 专项规则

### Markdown 渲染策略

- 主文章 / 主题页 / 概念页内容
  - 使用 Astro Content Collection 的 `entry.render()` / `post.render()` 返回 `<Content />`
  - 证据点：`src/pages/posts/[slug].astro`, `src/pages/topics/[slug].astro`, `src/pages/concepts/[slug].astro`
- 文章段落锚点增强（用于段落评论）
  - Astro `markdown.rehypePlugins` 注入 `rehypeParagraphAnchors`
  - 为段落生成 `id="c-${anchorId}"` 和 `data-anchor="${anchorId}"`
  - 排除 `blockquote/li/table/details/figcaption` 内段落
  - 证据点：`astro.config.mjs` `markdown.rehypePlugins`; `src/lib/markdown/rehypeParagraphAnchors.ts`（`EXCLUDED_ANCESTORS`, `element.properties["data-anchor"]`）
- 全文评论 Markdown（用户输入）
  - `ReactMarkdown` + `remark-gfm` + `rehype-sanitize`
  - `skipHtml` 防止 HTML 直出
  - 自定义链接组件统一外链安全属性；图片节点返回 `null`
  - 证据点：`src/components/comments/ArticleComments.tsx`

### 代码高亮方案（主文章与评论区）

- 主文章代码高亮
  - 源码中未显式配置 Astro 代码高亮主题/选项（无 `markdown.syntaxHighlight` / `shikiConfig`）
  - `astro.config.mjs` 当前仅配置 `rehypeParagraphAnchors`
  - 因此高亮主题依赖 Astro 默认行为（本仓库未在源码中固化具体主题名）
  - 证据点：`astro.config.mjs`
- 主文章代码块样式（视觉）
  - 未在 `src/styles/global.css` 看到 `.post-body pre/code` 自定义规则
  - 证据点：`src/styles/global.css`
- 文章评论区代码样式（非语法高亮）
  - 内联 code：背景胶囊 + 圆角 + `0.88em`
  - `pre`：统一背景 `--ac-pre-bg`、圆角、滚动
  - 无复制按钮、无行号、无高亮主题切换
  - 证据点：`src/styles/article-comments.css` `.article-comment-markdown code`, `.article-comment-markdown pre`; `src/components/comments/ArticleComments.tsx`（无复制按钮逻辑）

## 动效与交互

### 页面切换

- 未发现路由切换动画或 View Transition 实现
  - 证据点：`src/layouts/BaseLayout.astro` 无页面切换脚本；项目未见相关组件/配置
- 存在页面内进入动画（内容区块渐显上移）
  - `.content-section > h1/h2/p/ul/ol/div` 使用 `fade-slide-in`
  - `@keyframes fade-slide-in` 从 `opacity:0 + translateY(10px)` 到正常态
  - 分元素设置延迟（40/90/130ms）
  - 证据点：`src/styles/global.css` `.content-section>*` 动画规则与 `@keyframes fade-slide-in`

### 滚动联动

- 目录高亮联动
  - `PostToc` 中 `IntersectionObserver` 监听 headings，`requestAnimationFrame` 计算当前标题
  - active 状态通过 `.post-toc-link.is-active` 和 `aria-current="true"`
  - 证据点：`src/components/post/PostToc.astro`, `src/styles/global.css` `.post-toc-link.is-active`
- 标题定位避让粘性头部
  - `.post-body :where(h2...h6) { scroll-margin-top: 102px; }`
  - 证据点：`src/styles/global.css`
- 返回顶部
  - 未实现专用按钮或逻辑
  - 证据点：未见相关组件/类名/脚本

### 过渡时长与缓动（可复用模式）

- 全站主缓动函数趋于统一：`cubic-bezier(0.22, 1, 0.36, 1)`
  - 用于 body/theme/search/card/toc 等多个模块
  - 证据点：`src/styles/global.css` 多处 `transition`
- 主题切换为“长时过渡”
  - `body` 背景 `2600ms`、文字 `1200ms`
  - `html.theme-transitioning *` 强制过渡时长 `1300ms`
  - 脚本中移除类的延时 `1750ms`
  - 证据点：`src/styles/global.css`, `src/layouts/BaseLayout.astro` `setTimeout(..., 1750)`
- 局部模块（文章评论区）使用 `ease`
  - 例如 `.article-comments-submit`, 表单输入 `transition: ... 160ms/180ms ease`
  - 证据点：`src/styles/article-comments.css`

### 可访问性相关交互（focus ring、键盘导航）

- 已实现
  - 搜索输入可见 focus ring（`.header-search-input:focus`）
  - 搜索输入支持 `Escape` 关闭、`Enter` 跳首结果（`HeaderSearch.astro`）
  - 多处 sr-only 文本（`.header-search-sr-only`, `.sr-only`, `.article-comments-sr-only`）
  - TOC 活动项设置 `aria-current`
  - 主题按钮和评论状态区使用 `aria-live="polite"`
  - `prefers-reduced-motion: reduce` 下关闭动画与过渡
  - 证据点：`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css`, `src/components/search/HeaderSearch.astro`, `src/components/post/PostToc.astro`, `src/components/comments/ArticleComments.tsx`, `src/layouts/BaseLayout.astro`
- 未完整覆盖
  - 多数按钮/链接只有 hover，无 `:focus-visible` 视觉反馈（如 `.theme-toggle`, `.tag`, `.submit`, `.comment-bubble`, `.post-toc-link`, `.article-comments-auth-btn`, `.article-comments-submit`, `.archive-entry-button`）
  - 证据点：`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css` 对应类仅定义 `:hover`/`:disabled` 无 `:focus-visible`

## 一致性与问题清单

> 目标是“最小修改”修复，按优先级排序。

### P0

1. 键盘焦点样式覆盖不完整（可访问性风险）
   - 现状：仅搜索输入与文章评论输入有显式 focus 样式；大量按钮/链接缺少 `:focus-visible`
   - 影响：键盘用户难以定位当前焦点，尤其在 TOC、评论操作、头部主题按钮、搜索结果项中
   - 最小修改建议：新增统一 focus ring 规则，覆盖现有交互类
     - 示例目标类：`.theme-toggle`, `.header-search-result-link`, `.post-toc-link`, `.comment-bubble`, `.tag`, `.submit`, `.article-comments-auth-btn`, `.article-comments-submit`, `.archive-entry-button`
     - 使用现有 token：`--accent`, `--accent-soft`, `--line-strong`
   - 证据点：`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css`

2. 主文章 Markdown 排版样式缺失（内容呈现不稳定）
   - 现状：`post-body` 仅处理标题滚动偏移与段落评论预留；列表、引用、表格、代码块、图片基本依赖浏览器默认
   - 影响：不同浏览器默认样式差异较大，长文阅读的层级与节奏不稳定
   - 最小修改建议：在 `src/styles/global.css` 新增 `.post-body :where(ul,ol,blockquote,pre,table,img,figure)` 的基础规范（间距、边框、溢出处理）
   - 证据点：`src/styles/global.css` `.post-body` 相关规则仅少量定义；`src/pages/posts/[slug].astro` 使用 `<Content />`

### P1

1. Token 体系分层存在重复与局部硬编码
   - 现状：全局 `--*`、文章评论 `--ac-*`、归档页 `--archive-*`、封面内联 `--cover-*` 并存；多个模块直接写 rgba/hex
   - 影响：新页面复刻风格时需要跨文件复制色值，维护成本高
   - 最小修改建议：先不重构全部，只抽一层共享语义 token（如 `--radius-*`, `--shadow-*`, `--focus-ring-*`, `--surface-overlay-*`）供新模块复用
   - 证据点：`src/styles/global.css`, `src/styles/article-comments.css`, `src/components/post/PostCover.astro`

2. 动效参数不统一（global 使用 cubic-bezier，文章评论区大量 ease）
   - 现状：`global.css` 以 `cubic-bezier(0.22,1,0.36,1)` 为主；`article-comments.css` 使用 `ease`
   - 影响：同页内交互手感不一致（尤其文章页同时出现 TOC、段落评论、全文评论）
   - 最小修改建议：在 `:root` 添加 `--ease-standard` / `--ease-emphasized`，逐步替换新改动涉及的规则
   - 证据点：`src/styles/global.css` 多处 transition；`src/styles/article-comments.css` 表单/按钮 transition

3. 可视化隐藏工具类重复定义
   - 现状：`.header-search-sr-only`、`.sr-only`、`.article-comments-sr-only` 三套实现几乎相同
   - 影响：重复维护，未来修改可访问性模式时容易漏改
   - 最小修改建议：统一成一个全局 `.sr-only`，逐步替换组件私有版本
   - 证据点：`src/styles/global.css` `.header-search-sr-only`; `src/styles/comments.css` `.sr-only`; `src/styles/article-comments.css` `.article-comments-sr-only`

### P2

1. 字号/间距缺少显式 token，依赖散落数值
   - 现状：大量 `0.82rem/0.86rem/0.92rem/1.05rem/...` 直接写在组件类中
   - 影响：难以快速建立统一排版尺度
   - 最小修改建议：先定义一组只读 token（`--font-size-meta-*`, `--space-*`），新组件优先使用，不强制回改旧代码
   - 证据点：`src/styles/global.css`, `src/styles/comments.css`, `src/styles/article-comments.css`

2. 无独立搜索页，搜索结果不可直接分享/深链接
   - 现状：搜索仅存在头部浮层；数据端点为 `/search-index.json`
   - 影响：在复杂检索场景下可扩展性有限（但当前 v1 足够）
   - 最小修改建议：保留现状，在未来新增 `/search` 页面时复用 `searchIndexItems()` 和现有 `.header-search-*` 样式子集
   - 证据点：`src/components/search/HeaderSearch.astro`, `src/pages/search-index.json.ts`, `src/lib/search/index.ts`

## 快速复现指南

### 新页面/新组件沿用风格的规则

1. 页面骨架先复用 `BaseLayout`
   - 证据点：`src/layouts/BaseLayout.astro`（自动获得 `global.css`、头部导航、主题切换）

2. 优先使用已有语义类，而不是新建一套样式
   - 区块：`.content-section`
   - 网格：`.grid`, `.topic-grid`, `.post-card-grid`
   - 卡片：`.card`, `.post-card`（若是文章卡片则直接用 `PostCard`）
   - 标签：`.pill-list`
   - 证据点：`src/styles/global.css`; 复用示例见 `src/pages/index.astro`, `src/pages/topics/[slug].astro`

3. 颜色与边框优先走全局 token（不要直接写新 hex）
   - `var(--surface)`, `var(--text)`, `var(--subtle)`, `var(--line)`, `var(--accent)`, `var(--accent-soft)`
   - 证据点：`src/styles/global.css` `:root` / `:root[data-theme="dark"]`

4. 新交互组件必须补 `:focus-visible`
   - 现有代码缺口较多，新增组件应先补齐，不再复制只有 `:hover` 的模式
   - 证据点：问题清单 P0；现有 focus 正例 `src/styles/global.css` `.header-search-input:focus`, `src/styles/article-comments.css` 表单输入 `:focus`

5. 长文相关组件需要考虑粘性头部偏移
   - 锚点跳转统一预留 `scroll-margin-top`（参考 `.post-body :where(h2...h6)`)
   - 证据点：`src/styles/global.css`

6. 若是文章页附加模块（如评论/注释面板），可采用“局部 token 命名空间”模式
   - 参考 `.article-comments { --ac-* }`
   - 证据点：`src/styles/article-comments.css`

### 最小示例（Astro/JSX 风格均可复刻）

证据来源组合：`src/pages/index.astro`（页面结构）、`src/styles/global.css`（`.content-section/.card/.pill-list/.grid`）。

```astro
---
import BaseLayout from "../layouts/BaseLayout.astro";
---

<BaseLayout title="Example | MyBlog">
  <section class="content-section">
    <h1>新页面标题</h1>
    <p class="subtle">一句说明，沿用全局正文与次要文本颜色。</p>
  </section>

  <section class="grid" style="grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));">
    <article class="card">
      <h3><a href="/topics/example">主题卡片标题</a></h3>
      <p>卡片正文使用默认 `body` 字体与 `--text`/`--subtle` 体系。</p>
      <ul class="pill-list" style="margin-top: 0.6rem;">
        <li><a href="/concepts/example">#example</a></li>
        <li><a href="/concepts/ui">#ui</a></li>
      </ul>
    </article>
  </section>
</BaseLayout>
```

## 设计指纹摘要

- 页面宽度收敛到 `min(980px, 100vw - 2rem)`，阅读优先（`src/styles/global.css` `.shell`）。
- 全站背景不是纯色，而是多层 radial + linear 渐变（`--bg-layer`）。
- 顶部导航固定吸顶、半透明毛玻璃、细边框分层（`.site-header`）。
- 主色是青绿色系 `--accent`，用于链接、hover 边框、focus 混色，而非大面积实底。
- 卡片体系普遍使用 `16-22px` 圆角 + 柔和大阴影（`.card`, `.post-card`, `.author-hero`, `.article-comments`）。
- 文章页用双轨评论：段落短评（行内气泡）+ 文章底部评论（独立暖色模块）。
- 段落评论通过 Markdown rehype 注入 `data-anchor` 驱动（`rehypeParagraphAnchors`）。
- TOC 是“排版化目录”而非重卡片，桌面 sticky + 滚动高亮 + 移动 `details` 折叠。
- 主题切换包含长时过渡和 `theme-transitioning` 全局过渡覆盖，视觉变化被刻意放慢。
- 主文章 Markdown 样式目前较克制（甚至偏默认），增强重点放在导航与评论交互而非重排版皮肤。

## Scholarly Reading Layout Addendum (2026-02-23)

This addendum supersedes earlier article-page notes in this document for `/posts/[slug]`.

- Article page shell width is now widened via `BaseLayout(mainClass)` and `shell--article-reading`.
  - Evidence: `src/layouts/BaseLayout.astro` (`mainClass` prop, `<main class:list={["shell", mainClass]}>`)
  - Evidence: `src/pages/posts/[slug].astro` (`mainClass="shell--article-reading"`)
  - Evidence: `src/styles/global.css` (`.shell.shell--article-reading`)
- Article page layout is now a scholarly two-column reading grid (`main + wide rail`), not standalone TOC aside.
  - Evidence: `src/pages/posts/[slug].astro` (`.post-reading-layout--scholarly`, `.post-reading-rail`, `PostScholarRail`)
  - Evidence: `src/styles/global.css` (`.post-reading-layout--scholarly`, desktop `grid-template-columns` + responsive fallback)
- Unified reading rail now contains TOC + annotations + references + figures + paragraph comments (reader notes).
  - Evidence: `src/components/post/PostScholarRail.astro` (`PostToc variant="rail"`, annotations/references/figures sections, `ParagraphComments mode="rail"`)
- TOC supports a rail variant and no longer owns the outer mobile `details` wrapper in that mode.
  - Evidence: `src/components/post/PostToc.astro` (`variant?: "standalone" | "rail"`, `variant === "rail"` branch)
- Paragraph comments now support a `rail` mode: paragraph markers remain inline, but thread/editor render in the rail container.
  - Evidence: `src/components/comments/ParagraphComments.tsx` (`mode?: "inline" | "rail"`, `comment-thread-panel--rail`, conditional `panelHost` insertion)
  - Evidence: `src/styles/comments.css` (`.comment-bubble--rail`, `.comment-thread-panel--rail`, `.comment-thread-rail-empty`)
- Post frontmatter supports author-maintained side content blocks (`annotations`, `references`, `figures`) with backward compatibility.
  - Evidence: `src/content.config.ts` (`posts` schema optional fields)
  - Evidence: `src/content/posts/paragraph-anchor-design.md` (sample usage)
- Article-page visual language now uses local reading tokens (paper/ink/rail) and serif typography scoped to the post reading area.
  - Evidence: `src/styles/global.css` (`.post-reading-layout--scholarly { --reading-* }`, `.post-body--scholarly`, `.post-header--scholarly`)
  - Evidence: `src/styles/global.css` dark overrides under `:root[data-theme="dark"]` and `prefers-color-scheme: dark`
- Desktop rail sections are auto-opened; tablet/mobile keep accordion behavior (TOC default open).
  - Evidence: `src/components/post/PostScholarRail.astro` (`data-default-open`, inline script with `matchMedia("(min-width: 1101px)")`)
  - Evidence: `src/styles/global.css` media queries for `.post-scholar-section-summary` and `.post-reading-rail`

## Tufte-Style Refinement Addendum (2026-02-23)

This addendum supersedes the previous scholarly article-page visual notes for `/posts/[slug]`.

- Post detail header is now intentionally minimal: hero cover removed and topic chips replaced with inline text links.
  - Evidence: `src/pages/posts/[slug].astro` (removed `PostCover` in header, added `.post-header-dek`, `.post-header-topics`)
  - Evidence: `src/styles/global.css` (`.post-header--scholarly`, `.post-header-dek`, `.post-header-topics`, `.post-header-topic-item`)
- Article page keeps the same scholarly layout classes but is visually reweighted toward a Tufte-like paper reading surface.
  - Evidence: `src/styles/global.css` (late override block for `.post-reading-layout--scholarly`, `.post-reading-article`, `--reading-*` tokens)
- The side rail is now a continuous marginalia flow (desktop) instead of card-stacked sections.
  - Evidence: `src/styles/global.css` (`.post-scholar-rail`, `.post-scholar-section`, `.post-scholar-section + .post-scholar-section`)
  - Evidence: `src/components/post/PostScholarRail.astro` (same data structure retained; `details` kept for responsive accordion behavior)
- TOC remains functional but is visually downgraded to a micro-outline in the marginalia rail.
  - Evidence: `src/styles/global.css` (`.post-scholar-rail .post-toc-link`, `.post-scholar-rail .post-toc-link.is-active::before`, `.post-scholar-rail .post-toc-number`)
  - Evidence: `src/components/post/PostToc.astro` (existing observer/highlight behavior unchanged)
- Paragraph comment markers in rail mode are restyled toward superscript-like note triggers, while keeping the same behavior/API.
  - Evidence: `src/styles/comments.css` (`.post-reading-layout--scholarly .comment-bubble-host--rail`, `.comment-bubble--rail`, `.comment-thread-panel--rail` overrides)
  - Evidence: `src/components/comments/ParagraphComments.tsx` (`mode="rail"` behavior unchanged)
- Full article comments are still available, but now default-collapsed behind a reading-page disclosure wrapper.
  - Evidence: `src/pages/posts/[slug].astro` (`.post-article-comments-collapsible`, `.post-article-comments-summary` wrapping `ArticleComments`)
  - Evidence: `src/styles/global.css` (`.post-article-comments-*`, article-page-scoped `.article-comments` de-emphasis overrides)
- E2E coverage was updated for the new reading header and collapsed article comments flow.
  - Evidence: `tests/e2e/post-covers.spec.ts` (no hero cover assertion)
  - Evidence: `tests/e2e/article-comments.spec.ts` (expand summary before article comment assertions)

## Three-Column + Footnote Addendum (2026-02-24)

This addendum supersedes previous article-page structure notes for `/posts/[slug]`.

### Article Page Structure (desktop)

- The post detail page is now a three-column reading layout: left TOC / center content / right marginalia.
  - Evidence: `src/pages/posts/[slug].astro` (`.post-reading-layout--tri`, `.post-reading-toc-rail`, `.post-reading-main`, `.post-reading-rail`)
  - Evidence: `src/styles/global.css` (`.post-reading-layout--scholarly.post-reading-layout--tri` desktop grid columns)
- TOC is rendered in the left rail and removed from `PostScholarRail` usage on this page.
  - Evidence: `src/pages/posts/[slug].astro` (`<PostToc items={tocItems} variant="rail" />` in left rail; `showToc={false}` on `PostScholarRail`)
  - Evidence: `src/components/post/PostScholarRail.astro` (`showToc?: boolean`)

### Markdown Footnotes (GFM) and Side-Note Coordination

- Markdown now supports GFM footnote syntax via `remark-gfm`.
  - Evidence: `astro.config.mjs` (`remarkPlugins: [remarkGfm]`)
- A custom rehype plugin adds stable classes/data hooks for styling footnote refs/section/items/backrefs.
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.ts`
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.test.ts`
- Footnotes are styled in the article body (Tufte-like superscript refs + de-emphasized footnote section), but are NOT auto-projected into the right marginalia rail.
  - Evidence: `src/styles/global.css` (`.tufte-footnote-ref`, `.tufte-footnote-sup`, `.tufte-footnotes`, `.tufte-footnote-item`)

### Recommended Markdown Writing Pattern (current implementation)

Use GFM footnotes for in-flow explanatory notes, and use links to `#ref-{id}` for right-rail references.

```md
这是一段正文，其中引用一个脚注说明[^tufte-style]，并继续正文叙述。

也可以在同一段中引用参考文献链接到右侧参考文献列表：[见文献 1](#ref-supabase-rls)。

[^tufte-style]: 这里是脚注内容。用于补充说明，不打断正文主线。
```

- `[^id]` / `[^id]:` => Markdown footnote (rendered in article footnotes section)
- `#ref-...` => jump to right-rail `references` frontmatter item
- These two systems intentionally coexist (different roles)

### CJK / Latin Typography Tuning (CSS-only)

- This phase uses CSS-only tuning (no automatic Chinese/English spacing script).
  - Evidence: `src/styles/global.css` (`font-kerning`, `text-wrap: pretty`, code/figcaption/small sizing, TOC numeric tuning)
  - Evidence: `src/styles/comments.css` (rail comment panel type scale alignment)

### Comment System Decision (Waline)

- Current project keeps the self-hosted Supabase comment system:
  - paragraph comments (`src/lib/comments/api.ts`, `src/components/comments/ParagraphComments.tsx`)
  - article comments (`src/lib/articleComments/api.ts`, `src/components/comments/ArticleComments.tsx`)
- Waline is NOT adopted in this phase because paragraph-anchor comments are the primary product capability and would not map cleanly to Waline's standard article-level model.
- A future experiment can evaluate Waline only for the article-level comments panel if operational needs change.

## Marginalia Stream Refinement Addendum (2026-02-24, later)

- The right marginalia rail no longer renders grouped category sections (`details`) on desktop; it is a flat continuous stream of items with per-item textual type labels placed below the content (for example: `图`, `参考文献`, `注释`, `读者边注`).
  - Evidence: `src/components/post/PostScholarRail.astro` (`.post-scholar-item`, `.post-scholar-item-type`, removed `.post-scholar-section` structure)
  - Evidence: `src/styles/global.css` (phase 4 block: `.post-scholar-flow`, `.post-scholar-item`, `.post-scholar-item-type`)
- The three-column proportions and type scale were retuned to better approximate the provided reference image: narrower/low-contrast left TOC, larger center reading text, and slightly wider right marginalia column.
  - Evidence: `src/styles/global.css` (phase 4 block: `.post-reading-layout--scholarly.post-reading-layout--tri`, `.post-reading-toc-rail .post-toc-text`, `.post-body--scholarly`, `.post-header--scholarly h1`)
- Rail comment panel typography is now aligned to the flat marginalia stream by removing the redundant in-panel heading emphasis and reducing UI-like weight.
  - Evidence: `src/styles/comments.css` (`.post-scholar-item--reader-notes .comment-thread-panel--rail ...`)
- The sample article used for visual verification was extended with more sections, mixed CJK/Latin prose, additional footnotes, and layout-observation paragraphs to better evaluate tri-column rhythm while scrolling.
  - Evidence: `src/content/posts/paragraph-anchor-design.md` (`## 工程边界`, `## 观察清单`, added `[^warmup-session]`, `[^approval-flow]`, `[^gfm-footnotes]`)

## Marginalia Scroll + Hierarchy Addendum (2026-02-24, later)

- Desktop right marginalia rail no longer uses an independently scrollable container (`overflow: auto`); it follows page scrolling as a sticky rail, avoiding nested-scroll/drag behavior.
  - Evidence: `src/styles/global.css` (phase 4 tri-column override on `.post-reading-layout--scholarly.post-reading-layout--tri .post-scholar-rail` sets `max-height: none` and `overflow: visible`)
- Right marginalia entries are ordered by article anchor position (root intro first, then TOC section order + paragraph index) for anchored content (`annotations` and `figures`), improving correspondence with the center reading column.
  - Evidence: `src/components/post/PostScholarRail.astro` (`sectionOrderBySlug`, `parseAnchorLocation()`, `anchoredEntries.sort(...)`)
- Each marginalia item now uses a consistent footer row for interpretation (`type label + locator text`) instead of raw anchor code blocks, improving scanability without reintroducing grouped categories.
  - Evidence: `src/components/post/PostScholarRail.astro` (`.post-scholar-item-footer`, `.post-scholar-item-type`, `.post-scholar-item-locator`)
  - Evidence: `src/styles/global.css` (phase 4 tri-column styles for `.post-scholar-item-footer`, `.post-scholar-item-locator`)

## Marginalia Simplification Addendum (2026-02-24, later)

- Annotation items in the right marginalia were simplified again: note titles from frontmatter (for example "锚点格式") are no longer rendered in the rail, and locator helper text such as `对应 导语 / p1` was removed to reduce cognitive load.
  - Evidence: `src/components/post/PostScholarRail.astro` (annotation item now renders body only + `.post-scholar-item-type`; locator/footer helper text removed for annotations/figures/references/reader notes)

## Footnotes Projected To Marginalia Addendum (2026-02-24, later)

- On post pages (`src/content/posts/*`), GFM Markdown footnotes are now extracted during rehype processing and projected into the right marginalia rail as `脚注` items; the generated body footnote section is removed to avoid duplicate content under the article body.
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.ts` (`extractFootnotesForRail`, `rewriteFootnoteRefTargetsForRail`, `removeFootnoteContainerFromTree`, `isPostContentFile`)
  - Evidence: `src/pages/posts/[slug].astro` (`remarkPluginFrontmatter[TUFTE_MARKDOWN_FOOTNOTES_KEY]` passed to `PostScholarRail`)
  - Evidence: `src/components/post/PostScholarRail.astro` (`markdownFootnotes` prop, `post-scholar-item--footnote`, `id="${TUFTE_RAIL_FOOTNOTE_ID_PREFIX}..."`)
- In-body superscript footnote refs still render, but their `href` targets are rewritten to right-rail anchors (e.g. `#marginalia-footnote-1`) on post pages.
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.ts` (`TUFTE_RAIL_FOOTNOTE_ID_PREFIX`, `data-footnote-rail-target`, `href` rewrite)
- Non-post markdown pages keep standard footnote section output (compatibility preserved).
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.ts` (`isPostContentFile(file)` gate)

## Footnote Interaction + Placement Refinement Addendum (2026-02-25)

- Clicking an in-body Markdown footnote superscript now triggers a temporary highlight flash on the matching right-rail footnote item, improving correspondence during deep reading.
  - Evidence: `src/components/post/PostScholarRail.astro` (inline script listens to `a[data-footnote-rail-target]` and toggles `.is-flash`)
  - Evidence: `src/styles/article.css` (`.post-scholar-item--footnote.is-flash`, `@keyframes post-scholar-footnote-flash`)
- Post footnotes are now approximately distributed nearer the related paragraph by using the first footnote reference's paragraph anchor and reference order during marginalia sorting (anchor-order approximation, not DOM-measured collision layout).
  - Evidence: `src/lib/markdown/rehypeTufteFootnotes.ts` (`collectFootnoteRefMeta`, extracted `anchorId` + `referenceOrder`)
  - Evidence: `src/components/post/PostScholarRail.astro` (`AnchoredRailEntry` includes footnotes; `anchoredEntries` sort uses anchor position + `referenceOrder`)
- Footnote marginalia items were restyled to a compact `number + text` format (e.g., `1 例如文字...`) to match the requested reference style, instead of a labeled component block with a footer tag.
  - Evidence: `src/components/post/PostScholarRail.astro` (`.post-scholar-footnote-row`, `.post-scholar-footnote-number`, no footnote footer)
  - Evidence: `src/styles/article.css` (`.post-scholar-footnote-row`, `.post-scholar-footnote-number`, `.post-scholar-footnote-body`)

## Marginalia Annotation/Reference Format Simplification Addendum (2026-02-25, later)

- Right-rail `annotations` and `references` now use the same compact marginal-note format as footnotes: `number + text`, with no extra note title, locator text, or per-item footer label.
  - Evidence: `src/components/post/PostScholarRail.astro` (annotation/reference render branches both use `.post-scholar-footnote-row`, `.post-scholar-footnote-number`, `.post-scholar-footnote-body` and omit `.post-scholar-item-footer`)
- Reference items are flattened into a single paragraph (citation + optional note + optional URL inline) to avoid multi-block component-like formatting in the marginalia rail.
  - Evidence: `src/components/post/PostScholarRail.astro` (reference branch renders one `<p>` inside `.post-scholar-footnote-body`)
- Footnote superscript click highlight was re-verified after the simplification and remains active (`.is-flash`) on the corresponding right-rail footnote item.
  - Evidence: `src/components/post/PostScholarRail.astro` (inline script listens on `a[data-footnote-rail-target]` and toggles `.is-flash`)
  - Evidence: `tests/e2e/paragraph-comments.spec.ts` (clicks `.tufte-footnote-ref` then asserts `.post-scholar-item--footnote` receives `is-flash`)

## Marginalia Clarity + Hover Linking Addendum (2026-02-25, later)

- Right marginalia entries were simplified again to reduce visual noise: `annotations`, `figures`, and `references` all render as the same compact row grammar (`number + text`), and `figures` no longer render a separate title block/footer label pair (`图/表` moved inline into the text body).
  - Evidence: `src/components/post/PostScholarRail.astro` (annotation/figure/reference branches all use `.post-scholar-footnote-row`; figure branch uses `buildFigureInlineText()` and omits `.post-scholar-item-footer`)
- A sequential display number is now assigned across informational marginalia entries in the final rail order (annotation/figure/projected footnote/reference), and projected Markdown footnote superscript text is synchronized to that displayed number so the body and right rail stay consistent.
  - Evidence: `src/components/post/PostScholarRail.astro` (`railEntriesBase` -> `railEntries` mapping with `railSequentialNumber`; `syncBodyFootnoteLabelsFromRail()`)
- Markdown footnotes now support bidirectional hover/focus correspondence: hovering/focusing the in-body superscript highlights the matching right-rail footnote item, and hovering/focusing the right-rail footnote number highlights the matching in-body superscript reference(s).
  - Evidence: `src/components/post/PostScholarRail.astro` (`setLinkedHover()`, `bindLinkedHoverHandlers()`, `data-footnote-rail-item`, `data-footnote-rail-source`)
  - Evidence: `src/styles/article.css` (`.tufte-footnote-ref.is-linked-hover`, `.post-scholar-item--footnote.is-linked-hover`, `.post-scholar-footnote-number-button`)
  - Evidence: `tests/e2e/paragraph-comments.spec.ts` (hover assertions for both directions)
- The sample post used for visual review was trimmed to four informational right-rail entries (1 annotation, 1 figure, 1 footnote, 1 reference) while keeping the article body long, to make spacing and correspondence easier to inspect.
  - Evidence: `src/content/posts/paragraph-anchor-design.md` (frontmatter counts reduced; extra footnotes/references removed while long prose sections remain)

## Floating Bubble Marginalia Addendum (2026-02-25, later)

- The right marginalia column is no longer presented as a tightly stacked list of note rows on desktop; informational side notes are rendered as floating bubble blocks (`data-marginalia-bubble`) and positioned beside the corresponding body paragraphs using client-side anchor measurement plus simple vertical collision spacing.
  - Evidence: `src/components/post/PostScholarRail.astro` (`data-post-scholar-floating-layer`, `data-marginalia-bubble`, `layoutFloatingMarginalia()`)
  - Evidence: `src/styles/article.css` (Phase 6 overrides for `.post-scholar-item--bubble`, `.post-scholar-floating-layer`, `.post-scholar-floating-spacer`)
- Annotation behavior is now unified to in-body superscript markers: anchored annotations/figures automatically inject superscript refs into the target paragraph (`p[data-anchor]`) instead of relying only on a pre-visible side list.
  - Evidence: `src/components/post/PostScholarRail.astro` (`ensureInlineRef()`, `syncBodyRefsForFloatingNotes()`, `.marginalia-inline-ref`)
- Hover/focus correspondence is now bidirectional at the superscript-number level for both projected footnotes and injected annotation/figure notes:
  - body superscript hover/focus highlights matching side bubble
  - side bubble number hover/focus highlights matching body superscript(s)
  - side bubble number click scrolls/focuses back to the body marker
  - Evidence: `src/components/post/PostScholarRail.astro` (`setLinkedHover()`, `bindLinkedHoverHandlers()`, `data-linked-note-key-*`)
  - Evidence: `src/styles/article.css` (`.tufte-footnote-ref.is-linked-hover`, `.post-scholar-item--bubble.is-linked-hover`, `.post-scholar-footnote-number-button`)
- Right marginalia typography and visual density were retuned for the bubble layout (slightly smaller type than body text, increased spacing, smaller figure preview) to reduce crowding while preserving readability.
  - Evidence: `src/styles/article.css` (Phase 6 overrides for `.post-scholar-item--bubble .post-scholar-item-content p`, `.post-scholar-item--figure .post-scholar-figure-preview`, `.post-scholar-item--reader-notes`)
- Archive page thumbnail cropping was fixed by forcing `.archive-post-link` to be a square clipping container and absolutely filling the archive cover inside it.
  - Evidence: `src/styles/archives.css` (`.archive-post-link { aspect-ratio: 1 / 1; overflow: hidden; }`, `.archive-post-link > .post-cover--archive-square`)
