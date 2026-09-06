# 项目概况 (MyBlog v1)

## 当前发布状态（2026-09-06）

发布分支为 `feat/optimize-pass`，PR #1 尚待发布闭环。论文系统含两篇真实成果，缺少合法 PDF 时不生成封面；论文未知日期不再补成 1 月 1 日。CI 已接入论文来源检查，本轮按兼容版本修复前端/Waline 新披露依赖问题，保留既有审计门禁与忽略策略。116 项单测与 19 页构建已通过，完整浏览器回归正在验证。Vercel 登录已恢复，日志证实旧预览因缺失 SITE_URL 失败；已按核实的正式域名补齐 Production/Preview 配置，现有 Waline 地址保持不变。新部署和线上评论仍待核验；发布清单见 `docs/production-readiness.md`。

## 1. 目标与定位

这是一个基于 **Astro + React + Waline** 的主题化知识博客（Theme-first knowledge blog）。核心定位是 Topic 优先的知识组织、沉浸式长文阅读与可检索的研究成果展示；评论系统已从站内 Supabase 方案切换为 Waline，段落锚点则保留为阅读侧栏、脚注与旁注定位的基础设施。

## 2. 架构图及核心模块

- **前端生成与聚合层**: `Astro (@astrojs/react, astro@7.1.6)` — 负责静态站点生成、服务端渲染和按需互动 (Astro Islands)。
- **交互组件层**: `React (react@19)` — 承担 Waline 挂载、局部交互组件和测试友好的客户端封装。
- **Waline 服务端部署层**: `waline-server/index.cjs` + `waline-server/vercel.json` — 与博客前端解耦的独立部署单元，推荐作为同仓库下第二个 Vercel 项目部署。
- **评论数据存储层**: `Supabase PostgreSQL` + `waline-server/sql/waline.pgsql` — 承担 Waline 评论、计数器和后台用户表存储。
- **内容处理层**: `src/lib/markdown/rehypeParagraphAnchors.ts` — 在 Markdown 解析阶段为有效段落生成唯一锚点 ID（格式：`sectionSlug::p0`），供阅读侧栏和脚注关联使用。
- **脚注/参考文献侧栏层**: `src/lib/markdown/rehypeTufteFootnotes.ts` + `src/lib/posts/postScholarRail.ts` — 标准 GFM 脚注是文章页一切文字型 sidenote 的唯一入口：`note-*` 表示解释性注释，`ref-*` 表示正文引用型参考文献；右侧 rail 以脚注第一次在正文中的引用位置为准布局。`figures` frontmatter 仍保留为图表说明模型，但 `figures[].sourceRefIds` 仅允许指向 `ref-*` bibliography footnote。
- **评论集成层**: `src/components/comments/WalineComments.tsx` — 统一封装 Waline `init()` 调用、主题切换适配和缺省配置提示。
- **搜索与导航层**: `src/lib/search/index.ts`, `src/components/search/HeaderSearch.astro` — 静态搜索索引端点（`/search-index.json`）+ 客户端即时搜索 UI。
- **论文成果层**: `src/content/papers/*`, `src/pages/papers/*`, `src/styles/papers.css` — 结构化作者/venue/标识符/资源数据，按年份生成紧凑论文账本，并为单篇成果生成独立 scholarly detail 与 `ScholarlyArticle` JSON-LD。
- **论文数据真源**: 作者 Google Scholar ID 为 `NTwrnCIAAAAJ`，只用于发现成果；入库前用 Crossref 与 OpenAlex/Semantic Scholar 交叉核验 DOI、作者顺序、venue 和卷期页码。动态引用数不落库，摘要采用原创概述而非复制出版社文本。
- **论文 PDF 自动增强**: `scripts/papers/enrich.mjs` + `scripts/papers/lib.mjs` 使用 Poppler 提取 Abstract/Introduction 与带坐标图注，按 pipeline/workflow/architecture 等关键词排序方法图候选，再由 `sharp` 生成 1600×900 封面。作者本地 PDF 放在被忽略的 `.paper-sources/`，公开 PDF 则必须显式声明为 `resources[type=pdf]`；生成图和 provenance manifest 才进入内容目录。
- **目录组件层**: `src/lib/posts/toc.ts`, `src/components/post/PostToc.astro` — 从 Astro headings 提取 H2/H3，渲染带当前章节高亮的固定/折叠 TOC。
- **主题系统层**: `src/styles/tokens.css` + `src/styles/tailwind.css` + 其余模块化 CSS — Tailwind v4 utility 通过 `@theme inline` 引用运行时 token，未迁移的 unlayered CSS 继续负责页面专属规则；两者共用同一套 light/dark 语义 token。

## 3. 技术栈和依赖

- **框架**: Astro 7.x, React 19
- **评论系统**: `@waline/client` + `@waline/vercel`
- **样式**: Tailwind CSS v4 utilities + 模块化原生 CSS；不导入 Tailwind preflight，`tokens.css` 仍是运行时颜色/字体/阴影真源
- **Markdown 渲染**: `remark-gfm` + 自定义 rehype 插件（脚注与段落锚点）
- **评论存储**: Supabase PostgreSQL（由独立 Waline server 消费）
- **工程化与测试**:
  - 包管理：`pnpm`
  - 单元/集成测试：`vitest`
  - E2E 测试：`@playwright/test`
  - Markdown AST 工具：GitHub Slugger, Hast/Unist

## 4. 当前 UI 设计系统快照

- **现状真源**: 当前 UI 的实际权威来源是 `src/layouts/BaseLayout.astro` 首先导入的 `tailwind.css`、其后导入的模块化 CSS，以及 `tests/e2e/*.spec.ts` 的视觉/结构约束；`design-style-guide.md` 仍有较多历史快照内容，只适合作为背景参考，不能直接当现状。
- **全站气质**: 设计系统以 five-color foundation 为底座，先在 `src/styles/tokens.css` 映射为 `surface/text/border/accent/chrome/reading` 语义 token，再由页面模块做克制分化。整体气质是冷静、研究型、阅读优先，而不是高饱和科技演示风。
- **字体分工**: 顶栏与全站 chrome 仍使用 `Space Grotesk / Source Serif 4 / IBM Plex Mono`；首页正文单独引入 `Outfit / Noto Serif SC / JetBrains Mono` 做 reference-mode 的 editorial 叙事，文章页继续保留既有阅读字体系统。
- **布局骨架**: 站点现在明确分成两套 runtime。`discover-runtime` 覆盖首页、主题列表、主题详情、概念详情、论文索引、作者页、归档页，统一使用 `ambient field + poster/split hero + section-head + family footer`；`reading-runtime` 覆盖文章与论文详情。文章保留 `TOC rail + main reading column + scholar rail + Waline`，论文则使用独立的学术详情布局，不继承文章评论与旁注链路。
- **文章页封面语言**: 标题卡片顶部封面采用“双层同源图片”模型：底层是居中下移、缩小并高斯模糊后的同源彩色虚影，负责提供 ambient colored shadow；顶层主图带极轻的白色描边和常规阴影，与底层虚影形成剥离感，并在 hover 时主图微微上浮、虚影进一步扩散。
- **核心交互**: Header 是三态液态玻璃控制台（`top / compact / hidden`），Search 是头部命令式即时搜索入口，TOC 是文章页的二级导航，Waline 评论位于文末，角色偏“全文讨论”而不是段落边批注。
- **体验原则**: `topic-first`、`reading-first`、`research-ready`、`restrained motion`。首页负责建立“这不是时间流博客”的认知，文章页负责沉浸式研究阅读，搜索/目录/header 只做辅助理解，不抢正文叙事。

## 4.1 大规模前端重写前的稳定契约

- **全站入口契约**: `src/layouts/BaseLayout.astro` 是全站视觉与交互的唯一注入入口，现已显式区分 `runtime="discover" | "reading"` 并输出 `body/main[data-runtime]`。它统一负责模块化 CSS 导入、字体、footer 变体，以及共享 `UiControllers` 挂载。若要继续重写 header / shell，优先从这里切分，而不是在页面里重新散落脚本。
- **样式契约**: `src/styles/tokens.css` 是全站 light/dark 语义 token 源；`src/styles/themeContract.test.ts` 已把 foundation 色值、语义变量、禁用 legacy token 的边界锁死。重写时应先保留 token contract，再重做模块实现。
- **页面复杂度分层**: discover 页面族（首页、主题页、概念页、归档页、作者页）现在共用 `src/components/discover/*` 与 `src/styles/discover.css`，但内容复杂度仍有高低：topic/concept/author/archives 已进入同一 discover shell；文章页则是单独的 scholarly runtime，耦合了 tri-layout、进度条、浮动脚注/图表 rail、Waline 和移动目录，复杂度仍显著高于其他页面。
- **内容渲染契约**: `astro.config.mjs` 在 markdown 层固定挂了 `rehypeParagraphAnchors` 与 `rehypeTufteFootnotes`；文章页依赖 `TUFTE_MARKDOWN_FOOTNOTES_KEY`、`buildPostScholarRailModel()` 与段落 anchor 来定位 rail 内容。前端重写不能破坏 `data-anchor` / footnote id / rail 定位这条链路。
- **搜索与评论契约**: 搜索入口固定消费 `/search-index.json`；评论入口固定为 `WalineComments.tsx` + `PUBLIC_WALINE_SERVER_URL`。这两条是独立基础设施，适合在视觉重写中保持接口不变。
- **测试契约**: E2E 已经锁定 header 布局、post cover 语义、文章阅读页比例、移动 TOC、Waline 挂载和脚注/rail 行为；因此更适合采用“先保留 DOM contract，再逐步迁移样式”的重写策略，而不是一次性推翻结构。

## 4.2 本轮梳理得出的重写切分建议

- **第一批：全站 chrome / shell**
  从 `src/layouts/BaseLayout.astro`、`src/components/search/HeaderSearch.astro`、`src/styles/layout.css`、`src/styles/search.css`、`src/styles/theme-toggle.css` 入手，先把 header / search / theme / footer / reveal 这层全站框架收口。当前它们集中在同一入口，是最适合先拆的高杠杆区。
- **第二批：首页与列表页语言**
  覆盖 `src/pages/index.astro`、`src/pages/topics/index.astro`、`src/pages/topics/[slug].astro`、`src/pages/concepts/[slug].astro`、`src/components/post/PostCard.astro`、`src/components/post/PostCover.astro` 与 `src/styles/cards.css` / `home.css`。这里主要重构信息节奏、卡片语言和 topic-first 入口感，风险显著低于文章页。
- **第三批：文章阅读 runtime**
  单独处理 `src/pages/posts/[slug].astro`、`src/components/article/TocSidebar.astro`、`src/components/post/PostToc.astro`、`src/components/post/PostScholarRail.astro`、`src/styles/article.css`、`src/styles/toc.css`。这部分是当前最重的耦合区，也是本仓库最需要“先保契约再换壳”的区域。
- **第四批：特殊页面**
  `src/pages/author.astro` + `src/styles/author.css`、`src/pages/archives.astro` + `src/styles/archives.css` 可后置。它们视觉独立，但对全站主流程影响较小。
- **当前样式热点**
  模块化 CSS 总量约 `6659` 行，其中 `src/styles/article.css` 约 `1758` 行、`src/styles/layout.css` 约 `742` 行、`src/styles/author.css` 约 `607` 行、`src/styles/cards.css` 约 `580` 行、`src/styles/toc.css` 约 `511` 行。重写时应优先把这些热点按 runtime / shell / page cluster 继续切薄。
- **推荐实施策略**
  先冻结 token contract 和核心 DOM/data contract，再逐页替换视觉实现；尤其文章页，建议保留 `post-reading-layout`、Waline mount、TOC/rail 的数据接口与语义属性，避免视觉重写演变成内容基础设施重写。

## 4.3 参考项目精读结论（`参考项目/remix_-misty-shadows-ui-gallery.zip`）

- **项目本质**: 这是一个小体量的 React 19 + Vite 6 + Tailwind CSS 4 UI demo，并不是真正的 Remix 项目。`metadata.json` 虽然写着 “Remix: Misty Shadows UI Gallery”，但实际入口是 `src/main.tsx -> src/App.tsx`，路由使用 `BrowserRouter`，页面只有 `Home` 和 `ArticleView` 两个。
- **工程洁净度一般**: 这个 demo 带有明显的 AI Studio 模板残留。`README.md`、`index.html` 和 `.env.example` 仍引用 `GEMINI_API_KEY` / AI Studio；`package.json` 里有 `@google/genai`、`express`、`dotenv` 等未实际使用的依赖。它更适合作为视觉参考，而不是架构参考。
- **视觉语言**: 设计核心是 “warm paper + deep obsidian + misty glow”。`src/index.css` 只定义了少量全局原语：`tech-grid`（点阵背景）、`soft-card`（毛玻璃白卡/暗卡）、三套字体（Outfit / Noto Serif SC / JetBrains Mono）。页面大量依赖 Tailwind utility classes 即时拼装氛围。
- **首页编排**: `src/pages/Home.tsx` 采用非常明确的 editorial split hero：
  - 左侧是 serif 标题、mono kicker、两枚 pill CTA；
  - 右侧是 sticky 的“终端/代码块”视觉物件；
  - 下方依次是领域卡片、精选文章、近期碎片列表。
  这说明它的强项不是复杂组件系统，而是“一个主视觉物件 + 两三个规整内容区块”的节奏控制。
- **文章页编排**: `src/pages/ArticleView.tsx` 是标准的 `8/4` 阅读布局：左侧正文，右侧 sticky TOC，顶部是 metadata pills，底部是 EOF + back-to-top。结构清楚，但远比当前博客的 scholarly tri-layout 简单，不含段落 anchor、脚注 rail、Waline 或边注系统。
- **动画与氛围来源**:
  - `motion/react` 用于 fade-up/stagger 和背景 orb 漂浮；
  - film grain 用固定 SVG data URL 覆盖；
  - 两个大 blur orb 提供 ambient glow；
  - featured card 用“双层同源图片：底层 blur 残像 + 顶层清晰主图”制造 misty shadow。
  这些是它最值得借鉴的地方。
- **最适合迁移到本仓库的设计点**:
  - 全局背景分层：可借鉴 “微弱 grid + grain + 低频大光晕”，但要比当前 demo 更克制。
  - 字体角色分工：serif 负责长文与标题、mono 负责 metadata/chrome 的思路值得保留。
  - 首页主视觉结构：你的首页可借鉴它“左文右物”的 split hero，而不是继续纯卡片堆叠。
  - 封面表现：featured card 的 “blur 副本 + 主图” 语言对你当前文章封面探索非常相关。
  - TOC 呈现：文章页右侧目录卡的“低噪声、线性高亮、sticky card”值得吸收。
- **不应直接照搬的部分**:
  - 不要照搬它的 `BrowserRouter` / 全客户端路由模式；
  - 不要照搬它把文章内容硬编码在 `src/data/articles.tsx` 里的方式；
  - 不要照搬它的装饰性搜索框和未连通按钮；
  - 不要把当前博客降级成普通 blog article + sticky TOC，因为你现有仓库的独特资产正是 scholar rail / anchor / footnote runtime。

## 4.4 已落地的首页 reference-mode 重构

- **实现边界**: 仅首页正文切到 reference-mode；现有顶栏、搜索、主题切换与文章页 scholarly runtime 保持原状。通过 `BaseLayout.astro` 新增 `hideFooter`，首页关闭全站默认 footer，改挂首页专属 footer。
- **首页结构**: `src/pages/index.astro` 现为四段固定骨架：split hero、主题四卡、精选文章 + 近期列表、首页专属 footer。右侧 sticky 终端块、featured cover 的双层同源图、recent list 的 hover arrow 和首页背景的 grid / grain / orb 都已迁入。
- **数据映射**: `src/lib/home/selectors.ts` 现在只负责精选文章选择与近期列表去重；首页不再使用“topic 第 4 卡按本地日期轮换”的旧逻辑，而是把全部 topic 渲染到一个客户端可滚动的 4 卡视窗里。
- **样式隔离**: 新增 `src/styles/home-reference.css` 与 `src/components/home/HomeReferenceFooter.astro`，所有参考站视觉语言都收敛在 `shell--home-reference` / `home-reference-*` 命名空间，避免污染主题页、归档页和文章阅读页。
- **严格复刻补强**: 后续 follow-up 已把首页背景层进一步对齐到参考项目的真实参数：整页 body 背景切换为 `warm paper / deep obsidian`，film grain 改为 fixed overlay，grid / ambient orb 的尺寸与动画周期改回参考值，首页 footer 改为 full-bleed，hero 主副按钮和 `soft-card` 几何也收敛到参考项目同级数值。
- **共享封面与 CTA 原语**: 最新一轮把参考项目的 featured card 进一步抽成共享图片原语。`src/components/post/PostCover.astro`、`src/styles/cards.css` 与首页 featured block 现在统一使用 `post-cover-stack` 的 `ghost + main` 双层同源图片结构，topic/concept 预览卡、归档方卡、首页精选卡共享白边、悬浮位移、misty blur spread 与 hover 扩散语言；文章页标题封面保留更克制的阅读态，但继续沿用同源虚影模型。首页主 CTA 颜色也重新按参考按钮收敛到深海军蓝底、白字、高圆角 pill，并补齐 `system + prefers-color-scheme: dark` 分支，避免系统主题下出现错色。
- **次级页面补齐**: 作者页与归档页此前只部分吃到共享原语，用户体感上仍像“首页单独升级”。本轮已把作者页“作者文章”切到 `PostCard` 链路，确保作者页文章区和 topic/concept 列表共用同一套封面、hover、meta 与标签语言；归档页则保留时间轴结构，但把 tile 本身的 hover lift、边框强化、标题高亮和 read cue 提升到与共享卡片同级的反馈层级。作者页快速链接按钮也改为同一 visual family 的 pill CTA。
- **关注领域交互**: 首页 `关注领域` 现在是“4 卡窗口 + 用户控制”的轨道，而不是按天轮换第四张。桌面端一次完整显示 4 张卡，支持左右按钮、左右方向键和鼠标滚轮转横向位移；平板端回落为两列，手机端回落为单列，以保持可读性。
- **验证现状**: 新增 `src/lib/home/selectors.test.ts` 与 `tests/e2e/home-reference.spec.ts`，并同步更新 `tests/e2e/theme-layout.spec.ts`、`tests/e2e/post-covers.spec.ts`、`tests/e2e/archives.spec.ts`、`tests/e2e/paragraph-comments.spec.ts`；当前 `pnpm test`、`pnpm test:e2e`、`pnpm build` 全通过。
- **当前真实迁移边界**: 这一轮之后，discover 页面族已经整体迁入 homepage family。`/topics`、`/topics/[slug]`、`/concepts/[slug]`、`/author`、`/archives` 都改为 `DiscoverShell + PageHero + SectionHead + discover surface + compact family footer`，不再停留在旧的 `content-section / topic-grid / card` 结构。文章页仍然保留独立 `reading-runtime`，但现在也通过 `data-runtime="reading"`、阅读页 family footer 和统一 CTA 色板与 homepage family 收口。当前尚未彻底统一的是 header/search/theme chrome 的 surface token 深度，以及部分历史 CSS 文件仍保留旧规则作为兼容层。

## 5. 关键文件索引

### 项目配置
- `package.json`, `astro.config.mjs`, `tsconfig.json`
- `vitest.config.ts`, `playwright.config.ts`

### 内容模型
- `src/content.config.ts`
- `src/content/posts/*`, `src/content/topics/*`, `src/content/concepts/*`, `src/content/papers/*`

### 评论集成
- `src/components/comments/WalineComments.tsx`
- `src/styles/waline.css`
- `waline-server/index.cjs`
- `waline-server/vercel.json`
- `waline-server/env.example`
- `waline-server/sql/waline.pgsql`

### 主题与样式系统
- `src/styles/tokens.css`
- `src/styles/base.css`, `layout.css`, `home.css`, `home-reference.css`, `cards.css`, `search.css`, `theme-toggle.css`, `footer.css`, `archives.css`, `toc.css`, `article.css`, `waline.css`
- `src/styles/themeContract.test.ts`

### 首页 reference-mode
- `src/pages/index.astro`
- `src/components/home/HomeReferenceFooter.astro`
- `src/lib/home/selectors.ts`
- `src/lib/home/selectors.test.ts`
- `tests/e2e/home-reference.spec.ts`

### Discover runtime
- `src/components/discover/DiscoverShell.astro`
- `src/components/discover/PageHero.astro`
- `src/components/discover/ActionPair.astro`
- `src/components/discover/SectionHead.astro`
- `src/components/discover/EmptyState.astro`
- `src/components/UiControllers.astro`
- `src/styles/discover.css`

### 论文成果
- `src/pages/papers/index.astro`
- `src/pages/papers/[slug].astro`
- `src/content/papers/*`
- `src/styles/papers.css`
- `src/lib/seo/jsonLd.ts`
- `scripts/papers/{enrich,lib}.mjs`
- `src/lib/papers/enrichment.test.ts`
- `docs/paper-automation.md`

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
- `src/lib/posts/postScholarRail.ts`

### 测试
- `src/lib/markdown/rehypeParagraphAnchors.test.ts`
- `src/lib/markdown/rehypeTufteFootnotes.test.ts`
- `src/components/comments/WalineComments.test.tsx`
- `tests/e2e/paragraph-comments.spec.ts`

## 6. 环境变量

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

## 7. 部署状态

- GitHub 仓库：`https://github.com/Yuki-zik/myblog`（分支 `main`）
- 托管平台：Vercel（已连接 GitHub，自动部署）
- 评论后端：仓库内已补充 `waline-server/` 独立部署单元；仍需创建单独 Vercel 项目并连接 Supabase PostgreSQL
