# 项目概况 (A-Znk的blog)

## 阅读排版协调（2026-10-18，已实现，待发布）

依据用户截图调整章节编号与标题比例，以及正文/行内代码/脚注旁注的字体组合。实测原标号12px，已改主/子章节20.8/17.64px、旁注15.5px，数字/标签统一UI，真实代码保留等宽。修复GFM空串标志未识别留下的回链；普通来源名称恢复文字和命名链接。118单测、24相关E2E及最终11排版检查通过；18张前后/明暗/手机截图保留，320px换行缩进按截图再修正。待精确CI与上线。

## 文章封面图片预览（2026-10-18，已发布）

用户要求点击放大与细节优化。本轮复用站内native dialog模式，由UiControllers统一初始化，封面入口保留原图链接，预览提供适应窗口/原始尺寸切换、查看原图、背景/Esc/按钮退出及焦点/阅读位置恢复；保留悬浮样式和旁注交互，不新增依赖。116单测与最终7项交互验收通过，10张明暗/手机/横屏/位图截图已检查；完整本地180/181暴露的图片尺寸transition问题已修正并补居中断言。PR #19合并为`dc61387`，PR与合并CI均181/181，两套Production成功。线上大图1600px、退出滚动120→120px/焦点恢复、目录85.59px及封面上浮6px通过，18张版本截图归档；六阅读页/搜索/评论读取正常。

## 文章页头留白与封面悬浮（2026-10-18，已发布）

用户反馈文章页头仍紧凑，原封面悬浮阴影弱化。实测右边距1440px为44px、1920px仅7px、2560px约-4px；页头至首段约26px。已限定文章页头增加留白、去硬底片、恢复柔和阴影与ghost。1920px边距53.45px、首段间距57.59px；116单测/70相关E2E和6张本地截图通过，原图及正文/目录/旁注保留。PR #17已发布且两轮173项CI通过。线上真实hover另发现透明旁注层拦截指针，已实现仅空白容器穿透、实际note保持交互；新增验收先失败后通过，116单测/20相关E2E通过。PR #18合并为`f910599`并上线，完整PR与合并CI各174/174通过；正式悬停上浮6px、正文不动，旁注和减少动画核验正常。档案见`docs/visual-history/2026-10-18-cover-air/`。

## 入口页字号与比例精修（2026-10-18，已发布）

用户指出主题目录信息分散、首页说明/代码字号过小。本轮依据字体层级、邻近分组和可读行长优化discover页面，保留白色图纸与橙色、完整原图/真实内容及刚确认的文章/论文阅读设计。首页与索引实现并行，作者/概念使用限定的editorial比例。已完成116单测、最终18项定向E2E与实际截图复核；首轮全量发现的2项首页卡高/留白问题按原断言修正，另修截图发现的手机减少动画导航背景高度。PR #16合并为`d26427c`并发布，精确PR与合并CI各171/171通过，发布树一致；14张线上截图全部无溢出且13张与本地字节一致，6阅读页/搜索/评论正常。依据及v0–v4档案见`docs/visual-history/2026-10-18-discover-proportions/`。

## 封面展示精修（2026-10-18，已发布）

用户明确只优化封面大小、位置与层次，保留原图。宽屏页头调整为1.45:1文字/封面，1440px实测封面约410px，单栏最大400px、手机自适应。纸边、错层底纸与橙色定位角替代过强光晕；116单测、68项相关E2E和7张前后截图通过。正文宽度、目录和旁注契约保留，PR #15合并为`6b18cb8`并上线，完整PR与合并CI各156/156通过，发布Git树与被测版本相同。线上5张截图、目录吸顶/手机落点、6阅读页及搜索/评论核验通过；12张前后/正式截图已归档。见`docs/visual-history/2026-10-18-cover-composition/`。

## 文章纸面与封面调整（2026-10-18，已发布）

用户最终明确恢复整篇文章的浮动承载面。沿用白/深纸色与橙色标注，桌面主文+旁注复用统一底板，单栏保留独立文章卡片；封面完整显示至280px，并加适度层叠。截图发现1240px桌面目录占满首屏，已统一为单栏折叠目录。PR #14合并为`261dca1`，116单测、155项PR与合并E2E通过，两套Production成功；线上6阅读页、13项搜索、原1条评论和CSS/封面字节一致性验证通过。论文模板、正文和控制器未改；6张本地截图及修正前后对照已归档。当时Mac锁屏使正式截图未完成；本轮封面精修已用独立浏览器补齐旧版正式桌面/手机截图，并完成新版正式视觉与阅读交互验收。详情见`docs/visual-history/2026-10-18-article-paper/README.md`。

## 阅读图纸方案（2026-10-17，已发布）

用户确认的文章「边缘标注」与论文详情「元数据优先」经PR #13合并为`d10beef`并正式发布。正文内容、段落/脚注锚点及旁注模型保留；截图发现的浅色代码对比度和手机目录折叠后错位已修复。116单测、完整155项本地/PR/合并E2E通过，两套Production成功；线上6个阅读页、13项搜索与原1条评论均核验。正文仍约722px/18.24px/1.88，桌面目录top85.59px，手机章节落点119.77px；论文680px主列、18px/1.85，完整作者与Cite焦点正常。29张改前/候选/实现/正式截图及来源信息在`docs/visual-history/`，设计与验收见`docs/reading-drawing.md`。

## 图纸入口页与阅读方案（2026-10-17，入口已发布、阅读待评审）

主题目录、主题阅读入口、文章归档与论文索引采用独立drawing-index外壳，去掉重复引导和统计卡，保留真实内容与论文元信息；主题封面退为辅助缩略图。PR #12 合并为 `0bf8296`，116单测、完整148项本地/PR/合并E2E及最后25项定向通过，两套Production成功。线上8个入口、2个阅读页、搜索13项与原1条评论已核验；阅读核心9文件哈希、正文和目录参数不变。文章正文/论文详情保持原样，真实内容的三个阅读预览已完成1024/390/320px与目录/引用交互验证，等待用户视觉反馈后再决定实施。设计与证据见 `docs/drawing-discover-design.md`。

## 首页亮橙标注（2026-10-17，已发布）

在已批准的建筑图纸构图上，用橙色姓名连字符、研究代码题签/引线、主题编号、文章索引、封面定位角和直角控件统一风格。原图和真实内容保持完整；明暗色分开控制图形亮橙与小字深橙。PR #11 合并为 `018b53e`；116单测、完整143项PR E2E与合并CI通过，两套Production部署成功。线上已核对实际橙色色值、三个索引、桌面/390px无溢出、搜索5项结果和评论原1条保留。截图与本地时序复验记录见 `docs/architectural-home.md`。

## 建筑线稿首页（2026-10-17，已发布）

用户确认整屏建筑绘图原型后，首页改为全幅白底线稿、大字号 A-Znk 与左下 `research.ts` 注释，首页导航采用 drawing 变体。真实内容、单 details、四卡轮播、精选双图及阅读运行时保留；手机按纵向构图，深色使用同一 resolved scheme。素材与设计契约见 `docs/architectural-home.md`；PR #10 合并为 `6b77d29`，116单测、完整139项PR E2E和合并CI通过，两套Production READY。正式图片与本地构建hash一致；桌面/390px手机无横向溢出、搜索5项结果、评论HTTP200/errno0且原1条保留。详细本地时序复验与发布证据见该文档。

## 个人研究工作台精修（2026-10-16，已发布）

按用户确认的设计建议，首页以 A-Znk 身份和研究笔记为主，保留原代码简介并改为薄边深蓝窗口、14px代码字体；有色光源集中在窗口后与页面下方。四卡更紧凑，精选文章采用约487px封面与文案并排，近期笔记改为全宽细线列表，手机回到纵向阅读。116 单测、80 项定向 E2E、PR 完整133项 E2E 和真实明暗/手机截图通过。PR #9 合并为 `edd1b8a`，两套 Production READY，线上验证标题、代码14px/边缘1px、封面487px和无横向溢出。证据：`output/research-workspace-2026-10-16/`。

## 用户反馈修复（2026-10-16，已发布）

用户要求保留原 `research.ts` 代码简介与有色背景。代码式研究签名、真实轨道/内容计数、静态蓝/琥珀光晕（深色首页蓝/紫）已恢复；系统字体和可读卡片继续保留。文章目录因 reading body 的 `overflow-x:hidden` 形成错误滚动祖先，现改为 `clip`。两条新增吸顶测试先失败后通过；116 单测、65 项定向 E2E 和真实桌面滚动/手机/明暗复核通过。PR #8 合并为 `1e2db3d`，云端完整 E2E 131/131，两套 Production READY；正式站点滚动960/1680px时目录top均85.59px、当前章节切换正常，首页代码简介和有色背景已核验。证据在 `output/restore-character-2026-10-16/`。

## Apple 风格界面打磨（2026-10-16，已发布）

首页与共享发现页采用系统 UI 字体、中性实色表面和蓝色交互强调，半透明材质集中在导航；首页研究概览直接展示真实研究方向与内容数量。保留四卡轮播、单份原生 details、搜索焦点恢复、长文衬线及原有阅读/评论运行时。116 单测、构建、37 项定向 E2E、阅读补验与桌面/390px明暗视觉复核通过；PR 完整 E2E 124/124，合并 CI 成功。PR #7 合并为 `16052d6`，两套 Production 检查成功，正式首页/搜索与评论读取（HTTP 200、errno 0、原 1 条）通过。发布证据与检查范围见 `docs/apple-interface-pass.md`。

## 当前主网址（2026-10-16）

主入口现为 **https://a-znk-blog.vercel.app/**，旧 `myblog-silk-one.vercel.app` 保留为可访问别名。两个 Vercel 项目及 GitHub 仓库身份不变；前端和 Waline 的 `SITE_URL`、README/GitHub 入口、19 个页面 canonical、RSS、robots 与 sitemap 已同步。发布提交 `1a05291` 的两套 Production 均 READY；116 单测和 20 页构建通过，线上 19 页与 Google 原验证文件逐项核验通过，评论 HTTP 200/errno 0、原 1 条保留。

新域名的 Search Console 属性已自动完成所有权验证，sitemap 读取状态为“成功”（首次读取曾短暂报无法抓取）；首页 Google 实时测试显示可编入索引。新首页手动索引申请被“超出了配额”拒绝，需额度恢复后再申请；当前没有宣称新域名已收录。旧域名此前接受的索引请求仅属于旧资源。当前记录：`docs/search-discovery.md`；证据：`output/domain-branding-2026-10-16/`。

## 站名与检索（2026-10-16，已发布）

[PR #5](https://github.com/Yuki-zik/myblog/pull/5) 合并为 `d895679`，公共名称「A-Znk的blog」已上线。可见品牌、所有文档标题、Open Graph/WebSite、RSS/llms、图标、设计说明书与 README 入口一致；GitHub 项目简介和网址已同步。116 单测、14 项定向 E2E 通过；PR CI 为 123 直接通过加 1 项重试后通过，合并 CI 完整 124/124 一次通过。两套 Production 成功，线上 19 个公开页的站名/标题/结构化数据/canonical/索引规则无异常，手机 390px 无横向溢出。

2026-10-16 已完成原域名的 Search Console URL-prefix 所有权验证、sitemap 提交与首页索引请求。验证文件 `public/googleb326e1b2b17b02a1.html` 随 PR #6（`16e82ec`）上线，线上 200 且与 Google 原文件字节一致；本地 116 单测/20 页构建通过，PR 与合并 CI 各 124/124，两套 Production 成功。Google URL Inspection 确认首页当时尚未收录；实时测试显示可编入索引，索引请求已进入优先抓取队列。sitemap 提交显示成功，公开 XML 含 19 页；Google 初始发现计数仍为 0，实际收录待其处理。记录：`docs/search-discovery.md`；证据：`output/search-console-2026-10-16/`。

## 404 恢复入口（2026-10-15，已发布）

[PR #4](https://github.com/Yuki-zik/myblog/pull/4) 合并为 `e4af54c`，已发布到原正式域名。失效地址使用共享 discover 风格的恢复页，提供首页/主题入口和现有搜索，保持真实 HTTP 404 与 noindex，且不进入 sitemap。116 单测、20 页构建、论文检查与 7 项定向 E2E 通过；PR 与合并 CI 均通过，完整云端 E2E 120/120。两套 Production 部署成功；线上不存在的文章地址返回新版 404/noindex，搜索可恢复到真实文章，正常文章未被 noindex。桌面深色/手机浅色截图和首页/主题导航已复核。证据：`output/not-found-2026-10-15/`。

## 无障碍跟进（2026-10-15，已发布）

[PR #3](https://github.com/Yuki-zik/myblog/pull/3) 已合并为 `3994b11` 并发布到原正式域名。脚注说明、地标和元信息语义已修复，旁注/翻页/页脚小字的明暗对比度已提高，构建会刷新 Markdown 内容缓存。116 单测、19 页构建、论文检查和相关定向 E2E 通过；云端完整 E2E 117/117。两套 Production 部署成功，线上阅读页明暗 axe 检查均为 0 violations（渐变对比度仍有 incomplete，已结合截图复核），脚注说明目标存在、首页语义正确，评论 HTTP 200/errno 0、原 1 条评论保留。证据：`output/followup-2026-10-15/`。

## 当前发布（2026-10-15）

[PR #2](https://github.com/Yuki-zik/myblog/pull/2) 已合并为 `93364ad`，新版本在 `https://myblog-silk-one.vercel.app` 正式运行；本地已同步 `main`。发布包含原视觉/交互迭代，以及键盘搜索、sticky header、字体加载、存储失败降级、RSS/canonical、读者说明与依赖安全更新。116 单测、19 页构建、论文来源、Waline smoke、两套冻结安装和审计门禁通过；完整云端 E2E 114/114，PR 与生产合并 CI 均成功。两套 Production 部署成功，匿名浏览器核验 19 个页面、搜索、手机论文页与 RSS。原评论数据库恢复 ACTIVE_HEALTHY，线上读取 HTTP 200/errno 0，原 1 条评论保留。详见 `docs/production-readiness.md`；本地证据在 `output/release-2026-10-15/`。免费数据库闲置暂停、已有低级别依赖风险及原 Waline 审计例外仍是运维边界。

## 视觉迭代历史（2026-09-06，本次已发布）

`codex/visual-interaction-pass` 已完成四项第一轮优化：首页主题/论文双入口与精简研究签名、首页弱文本对比度、原生 mobile search dialog（含键盘/IME/VisualViewport/scroll 恢复）、文章标题优先和论文手机字号。`pnpm test:all` 完整通过：116 单测、106 E2E、19 页构建、论文来源检查、Waline smoke 和审计门禁；明暗主题与手机/桌面截图复核通过。上述结果为当时的本地验收记录；现已随 2026-10-15 发布上线。详见 `docs/visual-interaction-pass.md`。

## 历史发布状态（2026-09-06）

已正式发布到 `https://myblog-silk-one.vercel.app`；PR #1 已合并，本地切回并同步 `main`。应用发布版本 `df5e467` 的 GitHub CI 全部通过，包含 116 项单测与全量 E2E；博客/Waline 两套正式部署均 READY。修复了缺失 SITE_URL、论文虚构日期、搜索测试遗漏、依赖安全门禁、敏感数据库日志、旧 think-validator 兼容问题和内嵌字体 CSP。原 Supabase 数据库恢复 ACTIVE_HEALTHY；匿名评论读取 HTTP 200/errno 0，原有 1 条评论保留。全新浏览器核验首页/论文页/详情/搜索/canonical 与评论，未见控制台错误。没有发布测试评论、修改数据库结构或自动轮换密码。两篇论文缺合法 PDF 时保持无封面。持续运行需注意免费数据库闲置暂停和历史凭据轮换，详见 `docs/production-readiness.md`。

## 1. 目标与定位

这是一个基于 **Astro + React + Waline** 的主题化知识博客（Theme-first knowledge blog）。核心定位是 Topic 优先的知识组织、沉浸式长文阅读与可检索的研究成果展示；评论系统已从站内 Supabase 方案切换为 Waline，段落锚点则保留为阅读侧栏、脚注与旁注定位的基础设施。

## 2. 架构图及核心模块

- **前端生成与聚合层**: `Astro (@astrojs/react, astro@7.2.8)` — 负责静态站点生成、服务端渲染和按需互动 (Astro Islands)。
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
- **全站气质**: `src/styles/tokens.css` 以中性色表面、清晰文字和蓝色交互组成共享语义 token；阅读纸面、代码和提示保留各自配色。内容面保持实色，轻薄材质用于导航。
- **字体分工**: 顶栏、控件和发现页标题/正文使用系统 UI 字体；文章正文保留 `Source Serif 4 / Noto Serif SC`，代码保留等宽字体。论文页仍有局部既有字体规则。
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
