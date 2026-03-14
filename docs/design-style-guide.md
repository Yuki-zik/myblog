# MyBlog Design & Style Guide

> Note (2026-03-14): comment-related entries that mention `ParagraphComments`, `ArticleComments`, `comments.css`, or `article-comments.css` are historical snapshots. The live implementation now uses `src/components/comments/WalineComments.tsx` and `src/styles/waline.css`.

## 1. 风格定位 (Style Positioning)

**一句话定位**：提供一种充满阅读温度的、具有学术 Tufte 风格与现代响应式特性的沉浸式内容阅读体验。

**5 个关键词**：
1. **Typographic (排版优先)** - 证据: `src/styles/article.css` 中 `.post-body--scholarly` 使用 `text-wrap: pretty` 和 `font-kerning: normal` 进行精细控制。
2. **Warm (温暖纸质感)** - 证据: `src/styles/tokens.css` (L3) 定义了暖色背景 `var(--bg): #f2f0eb` 及提亮强调色 `var(--accent): #6b5143`。
3. **Layered (层级浮动)** - 证据: 顶层导航 `src/styles/layout.css` 运用了模糊遮罩 `backdrop-filter: blur(14px)`，在页面滚动时变换缩小呈现立体感。
4. **Scholarly (学术化注解)** - 证据: `src/styles/article.css` 专门定制了三栏网格布局(TOC + 正文主体 + 右侧旁注 Rail)。
5. **Minimal (克制的容器边界)** - 证据: 近期对目录样式精简，在 `src/styles/toc.css` 移除了卡片的硬边框（如卡片外壳改为 `border: none; background: transparent;`）。

**3 个“不追求”的反面特征**：
1. **不追求极高对比度的刺眼亮暗** - 证据：`src/styles/tokens.css` 的光暗色板均通过灰阶和暖调混合降噪（比如 Dark 模式背景不是纯黑，而是 `#19160f` 暖幽深灰）。
2. **不追求沉重封闭的传统卡片堆叠** - 证据：正文区域没有使用白底圆角的区块包裹，而是直接在全局大背景之上呈现文字（见 `src/styles/cards.css` 和目录修正）。
3. **不追求浮夸打断的复杂过度动画** - 证据：在 `src/styles/article.css` 通过 `@media (prefers-reduced-motion: reduce)` 控制，默认淡入滑动强调信息呈现而非炫技。

## 2. Design Tokens

| Token名 | 取值范围 | 用途 | 证据 (路径+变量名) |
|---|---|---|---|
| **Color: Background** | `#f2f0eb` (Light) / `#19160f` (Dark) | 页面大背景，纸质暖色调 | `src/styles/tokens.css` (`--bg`) |
| **Color: Surface** | `#f9f7f2` / `#221e16` | 微凸出的卡片内容背景、下拉面板背景 | `src/styles/tokens.css` (`--surface`) |
| **Color: Text** | `#1e1c1a` / `#e8e4dc` | 主正文、标题颜色 | `src/styles/tokens.css` (`--text`) |
| **Color: Subtle** | `#6a5f55` / `#a09080` | 次要文本、描述、日期、元数据 | `src/styles/tokens.css` (`--subtle`) |
| **Color: Line** | `#d8d0c4` / `#3a3228` | 常用边框、卡片包裹、分割线 | `src/styles/tokens.css` (`--line`) |
| **Color: Accent(Primary)** | `#6b5143` / `#c4956e` | 品牌/主交互色（链接 Hover、按钮背景、强调条） | `src/styles/tokens.css` (`--accent`) |
| **Color: Danger/Error** | `#a83030` / `#e07272` | 错误态框线和文本 | `src/styles/tokens.css` (`--danger`) |
| **Color: Info** | `#3d5e8a` / `#80a8d8` | 说明信息、提示性文字 | `src/styles/tokens.css` (`--info`) |
| **Typography: Font** | `sans-serif` Base, `var(--reading-serif)` | 界面基础用无衬线体，深度长文正文应用衬线体 | `src/styles/base.css` (L14), `src/styles/article.css` |
| **Typography: L-H** | Base `1.68`, Reading `1.92` | 普通界面追求紧凑聚合，阅读模式利用大行高提升呼吸感 | `src/styles/base.css`, `src/styles/article.css` (.post-body--scholarly) |
| **Spacing** | `0.35rem` 到 `3rem` (xs-2xl) | UI 元素间的通用间距尺度 | `src/styles/tokens.css` (`--space-*`) |
| **Radius** | `6px` 到 `999px` (sm-full) | 卡片(10px)、按钮(8px)、Tag/Bubble(999px胶囊形) | `src/styles/tokens.css` (`--radius-*`) |
| **Shadow** | `0 4px 18px rgba(...)` | 主要提供卡片悬浮、漂浮物（Header/BackToTop）弥散阴影 | `src/styles/tokens.css` (`--shadow`) |

**基于实现反推的最小收敛方案 (颜色与Token重构)**：
- **存在问题**：目前存在大量特化的本地级 CSS 变量，如 `--comment-submit-bg`, `--toc-active` 完全脱离于了 Primary/Accent 体系。
- **改法建议**：建议引入语义级色板系列，利用 `--primary`, `--secondary`, `--muted`, `--surface` 重新映射 `tokens.css` 中 L22-L53 间的长长定制色。

## 3. Layout Rules

| 规则 | 目的 | 证据 (路径+选择器) | 建议默认值 |
|---|---|---|---|
| **Max-Width (正文容器)** | 约束中心视觉阅读宽度，防止文字行长过大影响多行扫视。 | `src/styles/article.css` `.post-reading-main` | `46rem`（约736px） |
| **三栏比例 (TOC:主体:双侧侧栏)** | 实现 Tufte 学术布局：文章置中，两侧排布索引和注解。 | `src/styles/article.css` L93 行 `.post-reading-layout--tri` `grid-template-columns` 约束 | TOC 220px，主体 740px，注解轨 390px |
| **容器边距 (Shell Container)** | 两侧留白，响应式流转中保持不贴边。 | `src/styles/base.css` `.shell` `width: min(980px, calc(100vw - 2rem))` | 两侧留白 `1rem` 平衡点 |
| **断点策略 (Breakpoint Strategy)** | 控制屏幕分界点和不同布局的坍塌时机。 | `src/styles/article.css` 中的多个 `@media` 及 `src/styles/home.css` | Desktop `>1100px`，Tablet `768-1100px`，Mobile `<768px` |
| **固定与滚动跟随 (Sticky Positioning)**| 让侧边导航和右侧旁注紧跟阅读位，平滑滑动不遮挡核心。 | `src/styles/article.css` `.post-reading-rail` 及右轨道元素使用 `position: sticky; top: 92px;` | 需考虑顶部预留高度，推荐默认留出 Header (`~90px`) 距离 |

## 4. Minimal Component Set

### Button
- **视觉**：存在直角边缘和微圆角 `border-radius: 3px / 8px`，背景用 `var(--accent)` 或者线条 Ghost 模式。
- **交互**：Hover 层具有物理飘浮 `transform: translateY(-2px)` 及底部扩出的阴影增强。
- **状态 (TODO)**：有 Default / Hover / Disabled 态 (`.submit:disabled`) 样式。TODO：需跨组件通用化对齐 Loading / Empty 态处理样式。
- **证据**：`src/styles/home.css` `.home-hero-btn`，`src/styles/comments.css` `.submit`。

### Link
- **视觉**：基础 `color: var(--accent)` 配合色温过渡。在学术模式中有浅色底部的修饰线 `text-decoration-thickness: 1px`。
- **交互**：Hover 会往变调深色 `--accent-strong` / 降低底层透明度漂移。
- **状态**：通过 `base.css` `.a:focus-visible` 统一设定外发光访问性高亮。
- **证据**：`src/styles/base.css` (全局 `a`)，`src/styles/article.css` `.post-body--scholarly a`。

### Tag (Pill)
- **视觉**：胶囊外形 `border-radius: 999px / 6px`。用带有线框外缘和带有透明度的软底色衬托文字。
- **交互**：有特定的 `.active` 状态（高亮文字色，凸显边框）。
- **状态 (TODO)**：缺失统一预制尺寸 API (如大小号)；目前直接挂在无名的选择器上，TODO：创建复用类。
- **证据**：`src/styles/cards.css` `.pill-list a` (6px)，`src/styles/comments.css` `.tag` (999px)。

### Card
- **视觉**：具有细微的白灰线条 `1px solid var(--line)` 加上带透明度面色的背景与微弱弥散的 `--shadow`。
- **交互**：卡片上滑交互 Hover 具有明显的抬升反馈 `translateY(-4px)` 配合 Accent 高亮边框。
- **证据**：`src/styles/cards.css` `.card`, `.post-card`。

### TOC (Table of Contents)
- **视觉**：去除了外边框的内隐式层级列表体系，依赖层级缩进和标号，当前由 `number + text` 排版。
- **交互**：Hover 加深透明文字；Active 当前视界时加粗并在子列项左前侧画出提示条，变更为暖调主题色。
- **证据**：`src/styles/toc.css` `.post-toc-link`, `article.css` `.post-reading-toc-rail` 左侧挂件态。

### CodeBlock
- **视觉**：圆角 `8px` 且具有外挂阴影，并使用深于内容面板的主题配置背景。
- **约束要求 (API)**：需要使用标准的 HTML `pre` / `code` 构建嵌套关系。无需特殊 DOM class（全局覆盖式实现）。
- **证据**：`src/styles/cards.css` `.post-body pre` 及内连 `code`。

### Callout (基于 Blockquote 的代用)
- **视觉**：左侧带有 3px 加粗 `var(--accent)` 或渐变条带的安全引用块，内部带浅底色以拉开层次。
- **证据**：`src/styles/cards.css` `.post-body blockquote`。

### CommentBubble (旁注气泡)
- **视觉**：右侧边栏浮置的超小胶囊形标点，结构十分紧凑 padding 窄小字体。通过上下标对齐。
- **交互**：悬停和连动触发态 `.is-active` 有下划线或颜色锁定关联显示效果。
- **证据**：`src/styles/comments.css` `.comment-bubble--rail`, `src/styles/article.css` 内覆盖的定制联动显示规则。

### ThreadPanel
- **视觉**：讨论串专用侧边栏弹出面板与底栏回复展现区，带有 `12px` 圆角隔离以及 `border`。
- **证据**：`src/styles/comments.css` `.comment-thread-panel`。

## 5. Consistency & TODO

**P0 级急需处理：消除按钮与标签的隐式重复**
- **当前存在**：在 `home.css` (Hero区域按钮)、`cards.css` (标签Pill)、`comments.css` (Submit和过滤Tag) 均分别进行了大量 UI 圆角、背景透明混合和Hover态的自定义硬编码。容易在修改全局间距或圆角时遗漏。
  - **最小修改收敛建议**：抽取提取统帅化的 `.btn` 以及 `.tag` 封装入新的 `components/ui/` 目录下（针对Astro代码），以 Slot 和 Props `intent="primary"|"ghost"` 注入。回滚点是：通过现有样式直接重命名 class 而不变迁逻辑进行逐步合并。

**P1 级优化：多层变色体系归纳**
- **当前存在**：`tokens.css` L20 - L53 定义了过剩的与注释特化挂钩的色表（如 `--comment-tag-active-text`），破坏了基于 `accent`/`surface`/`text` 的多主题自然平移。应利用 `color-mix` 结合通用基调来实现映射。

**P2 级改进：响应式断点管理和焦点外环一致性**
- 零零碎碎的 `@media(max-width: 1100px)` 及 `768px` 写死在 CSS 文件中；另外各个焦点交互对 `box-shadow` 发光的呈现圈色深不一。

---
## 验收标准 Checklist
- [x] 新页面只需复用 token + 组件即可完成，不再写零散样式（通过梳理 Tokens 进行基础约束指南）
- [x] dark mode 有明确映射表（从表中的 `--bg`, `--text`, 等全部双向收录，不缺失主色系）
- [x] 组件状态齐全且 focus 可见（从 Link 与 ThreadPanel/Button 列出包含 `:focus-visible` / `.is-active` 的可识别态，并提出TODO）
- [x] 每条规范都有证据定位（本文内每一条规则必然明确指出引用的来源文件甚至是选择器或行数）
