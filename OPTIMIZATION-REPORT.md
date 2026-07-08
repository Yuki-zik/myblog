# MyBlog 优化与升级调研报告

> 调研日期:2026-06-16 · 方法:Claude(Opus 4.8)+ codex(gpt-5.5,跨模型对抗审计)双模型协作 · `/deep-research`
> 范围:阅读体验&排版 · SEO&可发现性 · 性能&构建 · 知识网络功能
> 约束基线:`src/content/posts/myblog-design-manual.md` 的设计契约(topic-first / reading-first / 克制交互 / discover⊥reading 双 runtime / 语义 token)

---

## 0. 一句话结论

MyBlog 的工程与设计完成度已经高于绝大多数开源 Astro 博客模板;真正的升级空间不在"加功能",而在**把已经结构化的知识(frontmatter 里的 topics/concepts/relations/figures)向机器与读者再暴露一层**——JSON-LD、llms.txt、正文级搜索、frontmatter 反链——这些都和你的设计哲学同源,且大多是**隐形或仅作用于辅助区**的增量,不触碰阅读主线。

---

## 1. 同类热门项目景观(GitHub,按 star + 相关度)

### 1.1 Astro 博客/主题(对标 SEO、性能、a11y、排版)
| ★ | 项目 | 可借鉴点 |
| ---: | --- | --- |
| 4.7k | `satnaing/astro-paper` | minimal + **accessible + SEO-friendly** 的标杆;JSON-LD、OG、sitemap、RSS 实现干净,适合抄 SEO 元数据层 |
| 4.7k | `saicaca/fuwari` | 美学化静态博客;封面/卡片/动效组织 |
| 1.6k | `chrismwilliams/astro-theme-cactus` | 简洁、含 satori OG、Pagefind 搜索的成熟范式 |
| 1.2k | `incluud/accessible-astro-starter` | **WCAG/a11y 标杆**(focus-outline、landmarks、skip-link),Astro 6 |
| 1.0k | `danielcgilibert/blog-template` (Openblog) | 明确以 a11y/SEO/性能为卖点 |
| 963 | `cworld1/astro-theme-pure` | 快 + 文档/博客双模,含搜索与 OG |
| 676 | `markhorn-dev/astro-sphere` | 极简、轻量、快,适合性能对照基线 |

### 1.2 数字花园 / 知识网络(对标 backlinks / graph / wikilinks)
| ★ | 项目 | 可借鉴点 |
| ---: | --- | --- |
| — | `jackyzha0/quartz` | **反链 + 图谱标杆**:`CrawlLinks` transformer 建反向链接索引 → `ContentIndex` emitter 出 `contentIndex.json` → 客户端 **d3 力导 + pixi.js canvas** 渲染,local(BFS depth)/global 双视图 |
| 2.4k | `oleeskild/obsidian-digital-garden` | Obsidian→web 发布范式 |
| 2.4k | `oldwinter/knowledge-garden` | 中文双链花园参考 |
| — | Astro **Spaceship**(`aitorllj93/astro-theme-spaceship`) | Astro 原生:Obsidian 链接、tree 导航、**backlinks** |
| — | Astro **Mycelium** | Astro:wikilinks、**自动 backlinks、D3 graph**、callouts、RSS、sitemap、OG(MIT,2026-02 发 1.0) |

### 1.3 OG 图生成
| 项目 | 取舍 |
| --- | --- |
| `delucis/astro-og-canvas` | **Astro 原生标杆**,canvas 风格、构建期生成,"draw bg + text + badges"够用 |
| `vercel/satori` + `@resvg/resvg-js` | JSX 模板→SVG→PNG,控制力强(仅支持 flexbox + CSS 子集) |
| `@vercel/og` | 运行时/Edge,纯 SSG **不需要**,会引入 Vercel function |

> 结论:你是纯 SSG,OG 图应**构建期生成**;`astro-og-canvas` 起步,需复杂版式再上 satori。

---

## 2. 现状核实(已逐条验证,非臆测)

- ✅ 已有:build-time content collections、客户端搜索索引、RSS、robots、sitemap、3 态深色(无闪烁注入)、`prefers-reduced-motion`、**阅读进度条**、自建 Waline(RLS)、语义 token、scholar rail(Tufte 边注)、段落锚点、spoiler。
- ⚠️ 缺口:
  - `BaseLayout` 有 OG/Twitter/canonical,**无 JSON-LD 结构化数据**。
  - `astro.config.mjs` 用**已废弃**的顶层 `markdown.remarkPlugins/rehypePlugins`(Astro 官方文档确认废弃→ 推荐 `unified()` 设为 `markdown.processor`;Astro 8 移除)。
  - **无 `shikiConfig`**:代码块只有单一默认主题,深色模式下未与语义 token 联动。
  - 搜索索引 posts **只含 title/summary/keywords(=topics+concepts),不含正文**。
  - 全站**无数学公式**;仅设计手册一篇用到代码块。
  - 知识网络的边**全在 frontmatter**(`posts.topics[]/concepts[]`、`topics.relatedTopics[]/entryPosts[]`、`concepts.related[]`、`figures[].sourceRefIds`),正文**无** `/topics/`、`/concepts/`、`[[wikilink]]` 内链 → 反链是**现成反向索引,零爬取成本**。

---

## 3. 候选优化清单(ROI 排序 + codex 裁决)

> ROI 记法:影响/成本。codex 裁决来自跨模型对抗审计(gpt-5.5)。

### 本轮直接实现(隐形/增量,不碰阅读主线)
| # | 项 | ROI | codex 裁决 | 关键修正 |
| --- | --- | --- | --- | --- |
| A1 | **JSON-LD `@graph`**:BlogPosting + Person + WebSite + BreadcrumbList;topic/concept 页用 CollectionPage | 高/低-中 | REVISE→GO | 注入须转义 `<`→`<`;`citation` 先省略(sourceRefIds 是内部锚点非引文);`author.name` 只放 "A-Znk",GitHub 进 `sameAs`;`about`/`mentions` 仅在 chips 可见的路由输出 |
| B1 | **Shiki 双主题**(`shikiConfig.themes{light,dark}` + `defaultColor:false` + `.astro-code` 绑配色) | 高(代码文)/低 | GO | 与废弃数组正交,无需先迁移 processor;加"构建产物含双主题"的 fixture 测试 |
| D4 | **搜索正文增强**:`/search-index.json` 加正文摘要片段 | 高/低-中 | 上移(被低估) | 自建 body-excerpt 比 Pagefind 更低风险;对真实读者价值 > llms.txt |
| D1 | **frontmatter 反链**:概念页"出现在"、主题页分区、文末"相关笔记" | 高/中 | REVISE→GO | 命名要诚实(edge 来自 frontmatter);`relatedTopics` **不对称**→分 inbound/outbound;文末块须在 **Waline 之前** |
| A2 | **llms.txt + 每文 `.md` 镜像** | 高/低-中 | REVISE | `.md` 镜像加 `X-Robots-Tag: noindex, follow` 防重复(robots disallow≠去索引);`llms.txt` 保持可爬 |

### 报告建议(需单独分支/测量或作者决策)
| # | 项 | ROI | codex 裁决 |
| --- | --- | --- | --- |
| A3 | 构建期 OG 图生成(astro-og-canvas) | 高/中 | 元数据图稳定后再做 |
| B3 | KaTeX 静态数学(remark-math + rehype-katex) | 中-高/低 | **未来触发**:当前无数学,属"无用例的基建";接入时与 processor 迁移 + 锚点/脚注回归测试同做 |
| B4 | Astro 6 Fonts API 迁移(自托管/preload/fallback metrics→去渲染阻塞+降 CLS+隐私) | 中-高/中 | **非隐形**:排版/LCP 会位移,须独立测量分支 + 截图 + CWV |
| C1 | `markdown.processor` 迁移(消除废弃警告) | 低-中/低-中 | 用 `@astrojs/markdown-remark` 的 `unified()`,**别**用 Sätteri(不跑 remark/rehype);显式保留 `gfm:true`+`smartypants:true`,迁移时复核 footnotes/tables,别盲目叠 `remarkGfm` 与默认 GFM |
| C2 | LCP 专项:封面 `<Image>` `fetchpriority=high`/eager;审计 `public/` 未优化图 | 中-高/中 | 测量后做 |
| C3 | Lighthouse-CI 性能预算(`/`、`/topics`、一篇文章)+ bundle visualizer | 中/低-中 | 防未来 graph/search/MDX 回归 |
| C4 | 视图过渡 | 中/低 | **NO-GO(暂)**:`<ClientRouter/>` 会拦截导航、需手动重初始化脚本,危及 UiControllers/TOC/主题/Waline/进度条;原生跨文档过渡可另议 |
| C5 | 文章链接 `prefetch` hover | 低/低 | 可做 |
| D2 | 惰性局部图谱(d3-force + canvas),全局图放 `/map`,仅 discover runtime | 中/中-高 | 别放阅读栏 |
| D3 | wikilink `[[concept|label]]` 写作语法(remark 插件,须在锚点/脚注插件**之前**跑,且不改 heading id) | 中-高/中 | 需作者写作习惯买账 |
| D5 | 学术级文献模型 `references[]{title,authors,year,doi}` → 可见参考文献 + CSL + JSON-LD citation | 高/中-高 | 配合 scholar rail,提升被引可信度 |
| A4 | robots 对 AI 爬虫表述清晰化 + RSS 加 `atom:self-link` | 低/低 | 顺手 |

### 明确不建议
- ❌ 站级默认 `<ClientRouter/>`/SPA 化(同 C4)。
- ❌ 段落内联评论(直接违反设计契约,与锚点/scholar rail 抢占)。
- ❌ 阅读栏旁的重型全局图谱(放 discover 或独立 `/map`)。
- ❌ 全站 MDX 化(保留 `.md` 默认,仅个别需组件的文用 `.mdx`)。
- ❌ 默认 Google Analytics(要分析优先自托管 Umami/Plausible 或仅 `web-vitals` beacon)。

---

## 4. 本轮落地实现(逐项,带测试)

> 分支 `feat/optimize-pass`(基于 `review-fixes`)。验证:`vitest` **92/92 通过**(新增 21 例)、`astro check` **0 errors**、`astro build` 通过、明暗双态 playwright 视觉 QA 通过。未跑:e2e(`test:e2e`)、waline smoke、`pnpm audit`(本机 pnpm 走 corepack,留给你在标准环境跑 `pnpm test:all`)。

### A1 · JSON-LD 结构化数据 ✅
- 新增 `src/lib/seo/jsonLd.ts`(纯函数 builder)+ `jsonLd.test.ts`(11 例)。
- `BaseLayout` 恒发 `WebSite`+`Person`(稳定 `@id`),页面经新增 `structuredData` prop 追加:
  - 文章页 → `BlogPosting`(`headline`/`datePublished`/`dateModified`/`image`/`mainEntityOfPage`/`author`→Person ref)+ `BreadcrumbList`(首页›主题›主题名›标题)。
  - 主题/概念页 → `CollectionPage` + 面包屑。
- **采纳 codex 修正**:注入用 `serializeJsonLd` 转义 `<`/`>`/`&`/U+2028-9(防 `</script>` 注入);`author.name` 仅名字、GitHub 进 `sameAs`;`topics`→`about`(页面可见 chips),`concepts`**省略 `mentions`**(页面未具名展示);`citation` 省略(`figures.sourceRefIds` 是内部锚点)。
- 产物核验:`/posts/why-topic-first` 输出合法 `@graph`,绝对 `@id` 跨页互链。
- 文件:`src/lib/seo/jsonLd.ts`、`src/layouts/BaseLayout.astro`、`src/pages/posts/[slug].astro`、`src/pages/topics/[slug].astro`、`src/pages/concepts/[slug].astro`。

### B1 · Shiki 双主题代码高亮 ✅
- `astro.config.mjs` 加 `shikiConfig.themes{light:github-light, dark:github-dark-dimmed}` + `defaultColor:false`。
- 新增 `src/styles/code.css`:按 `:root[data-color-scheme]` 选 `--shiki-light`/`--shiki-dark`;**保留**你的左强调边框/圆角/留白(代码块仍属"paper"家族),仅替换背景+token 配色以保证对比度。主题对是一行可调项。
- 产物核验:`design-manual` HTML 含 `astro-code … github-light github-dark-dimmed` + `--shiki-dark`/`--shiki-light` token 变量;暗色截图正常。

### A2 · llms.txt + 每文 .md 镜像 ✅
- 新增 `src/lib/seo/llms.ts`(builder)+ `llms.test.ts`(5 例);`src/pages/llms.txt.ts`(站点+posts/topics/concepts 索引,保持可爬);`src/pages/posts/[slug].md.ts`(原始 markdown 镜像)。
- **采纳 codex 修正**:静态托管下端点 Response 头不生效 → 改在 `vercel.json` 加 `X-Robots-Tag: noindex, follow`(`source:/(.*).md`),并加测试守护(`securityHeaders.test.ts`);sitemap 过滤排除 `.md` 与 `/llms.txt`。
- 产物核验:`dist/llms.txt` + 4 个 `dist/posts/*.md` 生成。

### D1 · 知识网络反链 ✅(补齐缺口)
- 发现:**概念/主题页的反向追踪本就存在**(`referencedPosts`/`relatedTopics`/`topicPosts`…)。本轮补两处:
  - **文章页文末"相关笔记"**:新增 `src/lib/knowledge/relatedPosts.ts`(按共享 `topics`×2 + `concepts`×1 打分,Top4)+ `relatedPosts.test.ts`(5 例);渲染在**正文后、Waline 评论前**;`article.css` 加克制 token 化样式。
  - **主题页"相关主题"做成双向**(codex 终审 issue 2):合并 inbound(其它主题在 `relatedTopics` 里点名本主题)+ 去重排除自身。当前内容恰好全对称故无可见增量,但消除了"A→B 单向时 B 页漏掉 A"的潜在 bug。
- 产物核验:文章相关笔记 4 篇中 3 篇渲染(第 4 篇无共享边,正确省略);明暗双态截图正常。

### 终审修正(codex round 3 → 已落实)
- **robots.txt 删 `Disallow: /design.md`**:原 disallow 会让爬虫看不到新加的 `X-Robots-Tag: noindex`(robots 拦爬 ⊥ noindex 生效)。改为保持 `.md` 可爬,靠 `vercel.json` 的 noindex 头去索引。
- **主题页 inbound 反链**(见 D1)。
- ⏸️ **未动(留你定夺)**:文章页 `ActionPair`+`PostPager` 仍在 Waline **之后**(既有布局)。"相关笔记"已正确置于评论前;但若你的设计契约要"评论严格末位",需把这两个导航块移到 Waline 之前——这是你页面流的设计决策,我不擅自改。

### 暴露的既有问题(顺带证实)
- preview 启动打印 `markdown.remarkPlugins/rehypePlugins … deprecated`(= 报告 C1):后续迁移 `markdown.processor` 时一并处理。

### 未实现(留作下一轮,见 §3 报告建议)
A3 OG 图、B3 KaTeX、B4 Fonts API、C1 processor 迁移、C2 LCP 专项、C3 Lighthouse-CI、D2 图谱、D3 wikilink、D4 搜索正文增强、D5 文献模型。其中 **D4(搜索正文)被 codex 标为低估项**,建议作为下一个优先项。

---

## 4.2 第二批实现(用户追加:数学/代码内容力 + 社交可发现性 + 知识网络可视化)

> 同分支 `feat/optimize-pass`。验证基线:`vitest 95/95`、`astro check 0 errors`、`astro build` 通过。

### D4 · 全文搜索 ✅
- `SearchIndexItem` 加 `body` 字段;新增 `extractSearchableText()`(去 fenced code/链接/脚注标记/`:::`指令/强调/HTML);`buildSearchIndex` 对 posts/topics/concepts 填充正文(topic 含 `why`);`scoreSearchMatch` 加正文匹配(权重 100 < summary 140)。
- `/search-index.json` 惰性 fetch,加正文后 ~30KB(可接受);新增 3 测试,既有 3 测试不破。
- 文件:`src/lib/search/index.ts` + `index.test.ts`。

### B3 · KaTeX 静态数学 ✅
- 装 `remark-math@6 / rehype-katex@7 / katex@0.17`;`astro.config` remarkPlugins 加 `remarkMath`、rehypePlugins 首位加 `rehypeKatex`(先渲染数学再做锚点/脚注);BaseLayout 引入 `katex/dist/katex.min.css`(自托管字体,CSP `font-src 'self'` 覆盖,无公式页字体懒加载不下载)。
- 验证:临时插 `$E=mc^2$`/`$$\int…$$` → 产物含 `class="katex"`+`katex-mathml`+`<annotation>`(静态+无障碍 MathML),**既有管线无损**(脚注 121/scholar-rail 59 不变),验毕还原正文。
- **取舍**:走现有(废弃)配置数组,**未做** `markdown.processor` 迁移 —— 迁移只为消警告但改写整条管线,风险/收益不划算,拆成单独亲验步骤(见下"待决策")。

### D2 · 惰性局部知识图谱 ✅(含 v2 成熟化重做)
- 数据层:纯函数 `src/lib/knowledge/graph.ts`(frontmatter 边:posts↔topics/concepts、topic↔relatedTopics、concept↔related;无向去重、类型前缀 id 防碰撞、跳草稿/悬空)+ `graph.test.ts`(4 测试);静态端点 `/knowledge-graph.json`。
- 视图(v2,参考 Obsidian/Quartz 重写):`src/components/discover/KnowledgeGraph.tsx`(React 岛,`client:visible`)—— d3-force 静态布局(300+ tick,无 RAF)→ **可主题化 SVG**;成熟设计手法:**节点 √degree 大小**(建层次)+ **柔和光晕 halo** + **hover 聚焦**(高亮 1-hop 邻域+相连边,其余淡化 0.14)+ **渐进标签**(rest 时 bbox 贪心去重防压字、hub 优先;hover 显示聚焦子图,字体 swap 后 `document.fonts.ready` 重测)。仅 `d3-force`,无 canvas/pixi。
- 落点:`/map.astro`(**discover runtime**,复用 CollectionPage JSON-LD),`/topics` 入口进入;**不碰阅读栏**。11 节点/17 边,明暗×静止/聚焦四态视觉 QA 通过。
- **codex 复审 3 轮**:round-4 修 SVG `role="img"`→`role="group"`(AT 不再把图当原子图片);v2 复审 No-bug + 补字体 swap 重测;v3(高级化)复审 No-bug,玻璃栈低端设备低风险(与全站毛玻璃语言一致,保留)。
- **v3 高级化**(用户"质感不够高级"):球体节点(径向渐变+边缘高光+bloom)、毛玻璃+环境光。
- **v4 星海星图**(用户"球体太丑,不像星星"):重写为**星空/星座图** —— 深空面板(两主题皆深,如取景窗)+ 90 颗种子随机星尘(闪烁,reduced-motion 门控)+ **发光星点(亮核 drop-shadow + 径向辉光 + 十字衍射星芒)**(尺寸∝√degree≈星等)+ 星座连线;hover 点亮该星的星座、其余淡入深空。移除了 backdrop-filter/逐节点 blur 滤镜(比 v3 更轻)。codex 复审 No-issue(90 闪烁仅动 opacity 合成器友好、种子 PRNG 无 hydration、始终深色面板非 WCAG 问题)。明暗页面语境 + 静止/聚焦视觉 QA 通过。

### A3 · 构建期 OG 图(中文,网络拉字体)✅
- 装 `astro-og-canvas@0.13` + `canvaskit-wasm@0.41`;新建 `/og/[...route].ts` —— 给 posts/topics/concepts 出 1200×630 卡(midnight→navy 渐变 + moonlight 左强调边),`/og/<coll>/<slug>.png`;三类页 `openGraphImage` 指向卡片(JSON-LD image 仍用封面)。
- **字体(你选的"网络拉取",我做成优雅降级)**:`src/lib/og/font.ts` —— pinned 到 `noto-cjk@Sans2.004`(可复现)、原子写(tmp→rename)、复用前校验 sfnt magic(`OTTO`)+ 大小、memoized 拉一次;**任何失败返回 `[]` 且调用方完全省略 `fonts/families`** → 退回 astro-og-canvas 内置 Latin(中文变豆腐但**构建绝不挂**)。
- 验证:happy path 中文卡渲染**清晰无豆腐**(实际看图);**失败路径实测**(故意 404 字体)→ 打印降级警告 + **构建成功 9s**(非崩溃)。
- **codex round-5 复审**:抓到 3 个真问题全修 —— ① 原 `fonts:[]` 仍会抛错(致命)→ 改省略;② 损坏缓存永久复用 → 原子写+magic 校验;③ `@main` 不可复现 → pin tag。

### C1 · markdown.processor 迁移 ✅
- 装 `@astrojs/markdown-remark@7.2.0`(**精确 pin**,直接依赖);`astro.config` 从废弃顶层 `remarkPlugins/rehypePlugins` 数组迁到 `markdown.processor: unified({...})`;**删显式 `remarkGfm`**(靠 `unified()` 默认 `gfm:true`,避免双 GFM);shikiConfig 仍独立保留。
- 实测全管线无损(对比 design-manual 产物):脚注 121 / scholar-rail 59 / shiki `--shiki-dark` 8 / spoiler 37 / 锚点 49 / GFM 表格 1 / KaTeX(临时公式)`class="katex"` / **无废弃警告**。
- **坑**:pnpm 严格 node_modules 下 `@astrojs/markdown-remark` 是 astro 传递依赖,config 直接 import 会 `Cannot find module` → 必须装成直接依赖。
- **codex 复审**:No real bugs;唯一维护提醒 —— **升级 astro 时同步 bump `@astrojs/markdown-remark`**,否则两份版本会让 `isUnifiedProcessor` 身份不匹配、迁移静默失效。

### ⏳ 未做(留你定夺)
- 其余 §3 项:**B4 Fonts API**(非隐形,排版/LCP 位移需测量)、**C2 LCP 专项**(需测量)、**C3 Lighthouse-CI**(需你的 CI)、**D3 wikilink**(改你的写作习惯)、**D5 文献模型**(改 content schema + 著录方式)。这些都涉及测量取舍或你的内容模型,适合你定方向。

<!-- IMPL-LOG -->

---

## 5. 参考来源
- Astro 官方:syntax-highlighting / images / fonts / view-transitions / configuration-reference / markdown-content(via context7 `withastro/docs`)
- Google Search Central:Article/BlogPosting 结构化数据、BreadcrumbList、robots-meta-tag、consolidate-duplicate-urls、AI optimization guide
- schema.org:BlogPosting / citation / Thing(about·mentions)
- llmstxt.org;OpenAI `OAI-SearchBot`/`GPTBot` bot docs
- `jackyzha0/quartz`(backlinks/graph,via deepwiki);`delucis/astro-og-canvas`;`vercel/satori`;`@resvg/resvg-js`;Pagefind
- codex(gpt-5.5)跨模型对抗审计两轮(thread 019eceb1)
