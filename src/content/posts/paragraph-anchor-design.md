---
title: 段落锚点短评的最小实现
date: "2026-02-20T11:00:00+08:00"
topics:
  - paragraph-review
  - knowledge-network
concepts:
  - anchor-id
  - optimistic-ui
summary: 用 rehype 注入稳定锚点并连接 Supabase，实现可扩展段落短评。
annotations:
  - id: anchor-contract
    anchorId: root::p1
    title: 设计前提
    body: 稳定定位协议先于交互样式，这是后续扩展到选中文本评论的关键前提。
  - id: optimistic-tradeoff
    anchorId: 交互细节::p3
    title: 乐观更新权衡
    body: 乐观更新提升主观速度感，但需要完整的回滚路径配套，否则数据不一致会造成更大的用户困惑。
references:
  - id: supabase-rls
    label: "[1]"
    citation: Supabase Documentation - Row Level Security (RLS) for Postgres
    url: https://supabase.com/docs/guides/database/postgres/row-level-security
    note: 用于评论表权限边界设计参考。
  - id: tufte-css
    label: "[2]"
    citation: Tufte CSS — Dave Liepmann. 基于 Edward Tufte 书籍排版设计的 CSS 库，提供侧注、边注、数据图表样式规范。
    url: https://edwardtufte.github.io/tufte-css/
    note: 本项目旁注设计的参考来源。
figures:
  - id: anchor-diagram
    anchorId: 锚点规则::p1
    title: 锚点与评论节点关系图
    kind: image
    caption: 使用封面图作为示意图，展示段落锚点与评论节点的连接关系。
    sourceRefIds:
      - supabase-rls
    image:
      src: ./covers/paragraph-anchor-design.svg
      alt: 段落锚点与评论节点关系示意图
cover:
  src: ./covers/paragraph-anchor-design.svg
  alt: 段落锚点与评论节点连接的抽象封面图
---

段落级短评的关键不是 UI，而是可长期稳定的定位协议[^stable-anchor]。在传统博客里，评论系统往往附着在文章末尾，与具体段落的关联只是约定俗成的"回复某段"，没有机器可读的定位锚。这种松散绑定随着正文的改动很快就会失效。

## 锚点规则

先把段落 anchor 固定成 `sectionSlug::pN`，再做任何交互扩展；相关权限边界设计也可以参考右侧文献列表中的[文献 1](#ref-supabase-rls)。锚点格式本身应该是对编辑者透明的[^anchor-format]：正文改写、重排段落时，锚点 id 由渲染层重新映射，而不是暴露到 Markdown 源文件中由人工维护。

这让数据库层可以在未来无痛升级到选中文本评论。数据结构上，`post_slug + anchor_id` 已经足够定位一条评论到段落级；未来升级到 `text_selection_offset` 只需要在同一条记录里新增字段，不需要迁移旧数据。

## 交互细节

评论按钮默认只显示计数，避免正文被线程信息淹没[^bubble-count]。这个设计决策来自一个反例：如果把每个段落的完整评论线程都内嵌在正文里，读者的注意力会在"阅读正文"和"阅读评论"之间频繁切换，最终两者都读不深。

点击后按需展开线程，保留阅读主线并提供即时反馈。展开动画应当足够克制，不要让面板"跳出"破坏页面布局的稳定感。

进一步的实现里，`warmup anonymous session` 可以在组件挂载时提前执行，这样首次提交评论时不会把网络等待感知全部叠加到按钮点击上[^warmup]。

当评论线程进入右侧边注列后，正文段尾只保留一个小型注号入口，阅读路径会明显更稳定；这也是为什么本项目在文章页里把段落评论视作 marginalia，而不是传统的 inline widget。参考 [Tufte CSS（文献 2）](#ref-tufte-css) 对侧注的定义，边注本质上是"不打断正文阅读节奏的补充信息"。

### 状态与回滚

乐观更新（optimistic update）不是"盲目先加一条 UI"，而是需要和失败回滚路径配套设计[^optimistic]；示例中使用临时 id 渲染占位项，提交失败后再撤销并恢复输入内容。

如果未来引入审核流（`pending` 默认态），前端仍可复用同一套交互，只是在提交成功后显示"等待审核"的提示文案，并把临时项从可见列表中移除。这种状态机设计让 UI 行为更可预测，也更容易写出稳定的单元测试。

## 工程边界

这个最小实现刻意没有做文本选区评论（selection comment），因为那会引入 offset 漂移、内容版本对齐、以及跨设备换行差异带来的定位误差[^selection-caveat]。先把段落级锚点跑通，能显著降低系统复杂度。

换句话说，`paragraph anchor first, selection anchor later` 是一个工程排序问题，而不是功能缺失。先建立稳定 contract，再考虑更细粒度定位，后续迁移成本会低很多。

段落锚点与评论数据解耦后，数据库层只需要知道 `post_slug + anchor_id`，并不关心页面右侧最终呈现为脚注、边注、折叠线程还是独立审阅面板。这种解耦在系统演化时价值最为明显：当你决定把右侧评论从 React island 换成 Web Component，后端完全不受影响。

### 前端渲染策略

Markdown 渲染阶段负责生成稳定锚点（`p[data-anchor]`），React island 负责扫描并挂载评论入口。这样内容编译与交互逻辑分层明确，后续替换 UI 风格时不需要改动锚点契约。

文章页现在支持 GFM 脚注语法 `[^id]` 与右侧 frontmatter `references` 并存：前者用于正文补充说明，后者用于作者维护的参考文献清单；两者都能在同一篇文章中出现且互不冲突。

为了更接近纸面阅读体验，正文与边注使用同一衬线体系，但目录和按钮保持较轻的 UI 字体风格，这样既保留工具性，又不抢正文视觉重心。这一排版原则直接来源于 Tufte 的"内容至上"理念：任何不传递信息的装饰都是噪音。

## 观察清单（用于样式调试）

下面这些段落没有新功能，只是用于观察版式比例、字级和边注滚动节奏是否自然。

中文段落夹英文术语（如 `optimistic update`, `RLS`, `rehype plugin`）时，行距是否仍然舒适。右侧参考文献中的长 URL 是否在窄列内自然换行，而不把整列宽度撑坏。左侧目录在滚动时是否保持低权重，不会比正文更"亮"。

在知识型博客里，reading rhythm 往往比 component polish 更重要。用户不一定会记住按钮的圆角半径，但会立刻感知"这一页读起来累不累"。因此在三栏布局下，正文宽度、边注密度、目录字号、以及 footnote 引用的可见性，通常要作为一个系统共同调参，而不是分散在多个组件里各自优化。

再补一段纯中文文本，用于观察长段落时段尾注号与换行的关系。理想状态下，注号像纸面脚注编号一样轻量出现，不改变段落的视觉节奏；同时点击后右侧能够立即出现对应线程，形成"正文主线 + 旁侧批注"的阅读结构。这个体验比把整段评论面板插入正文中部更克制，也更适合长文。

当前实现仍然是渐进增强：即使评论接口暂时不可用，正文、目录、脚注和参考文献都仍然可以正常阅读；评论入口只会退化为不工作或显示错误提示，而不会影响文章主体的渲染。这种 failure isolation 对内容站点很重要。

[^stable-anchor]: "稳定锚点优先"意味着先固定定位协议，再逐步叠加评论 UI、审核流或选中文本评论能力。协议稳定后，任何上层 UI 的替换成本都接近零。
[^anchor-format]: 锚点 ID 的格式为 `sectionSlug::pN`，其中 `sectionSlug` 是 H2/H3 标题的 slug，`pN` 是该 section 内的段落序号（从 1 开始）。根节点段落使用 `root::pN`。
[^bubble-count]: 只显示计数的"气泡"按钮方案源自对移动端阅读场景的考量：在小屏幕上展开完整线程意味着大量内容位移，不如保留计数入口，让用户主动选择是否展开。
[^warmup]: Supabase 匿名会话的预热通常只需一次 POST /auth/v1/signup（约 200–400ms），在 React island hydrate 时并行执行，不阻塞任何渲染路径。
[^optimistic]: 乐观更新的核心不是"速度"，而是"用户感知的掌控感"。一个操作立即在 UI 中反映，用户会认为系统响应了自己的意图；失败后回滚并恢复输入，不会让用户感到"操作消失了"。
[^selection-caveat]: 文本选区评论在多语言混排场景（如 CJK + Latin）下尤为困难：字符偏移在不同渲染引擎、字体栈、以及 CSS text-transform 作用下可能漂移，导致定位失效。
