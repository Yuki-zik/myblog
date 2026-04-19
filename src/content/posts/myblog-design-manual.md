---
title: MyBlog 的设计说明书
date: "2026-04-11T15:30:00+08:00"
topics:
  - knowledge-network
  - paragraph-review
concepts:
  - anchor-id
summary: 从当前代码、运行时边界与测试约束出发，解释 MyBlog 如何把主题优先、阅读优先与克制交互组织成一套公开设计语言。
cover:
  src: ./covers/myblog-design-manual.svg
  alt: 用纸面卡片、目录轨道与暖色光晕概括 MyBlog 设计语言的抽象封面
---

`MyBlog` 不是先做一个视觉壳，再往里填文章；它的设计从一开始就服务于“主题化知识网络”和“可长时间阅读的文章页”。参考 Apple Human Interface Guidelines 的分类方式[^ref-hig]，本文按 `Overview → Foundations → Patterns → Components` 组织，同时保留一份完全等价的 Markdown 原文在 `/design.md`。这篇文章的真源不是历史快照，而是当前线上体验、现有 runtime 边界和已经写进测试的设计契约[^note-current-source]。

## Overview（概述）

MyBlog 目前最核心的判断有两个：第一，站点应该优先按主题组织，而不是按时间流组织；第二，文章页应该优先服务阅读，而不是把所有互动都塞回正文中部。围绕这两个判断，站点逐渐长成了现在的样子。

| 设计原则 | MyBlog 当前体现 |
| --- | --- |
| Clarity（清晰） | topic-first 导航、文章页单一主任务、辅助信息分布在阅读两侧 |
| Consistency（一致） | `discover` 与 `reading` 两套 runtime 分工明确，但共享同一套 token 和组件家族 |
| Deference（克制） | hover、动画和评论都被压在内容之后，不干扰阅读主线 |

换句话说，这不是一份“设计愿景说明”，而是一份“已经写进站点结构里的设计说明”。如果有一天页面细节继续变化，我更希望变化发生在这个框架内部，而不是推翻它。

## Foundations（基础）

### Color（色彩）

MyBlog 的颜色先从五个 foundation color 开始：`midnight #182540`、`navy #344973`、`lace #e6ecfb`、`ivory #eacbb0`、`moonlight #ff7a5b`。它们不是直接拿来写页面，而是先被翻译成 `page`、`surface`、`text`、`border`、`accent`、`reading` 这一类语义 token，再由不同 runtime 消费。

在 `discover` 里，这套颜色更偏“环境、玻璃、卡片和气氛光”。浅色模式接近纸面和雾气，深色模式则是深夜蓝和暖调高光，而不是纯黑。首页把蓝色与琥珀色的 ambient orb 放在点阵与噪点下面，让页面有一种被环境光托住的感觉；卡片再用半透明表面把内容收拢回来。

到了 `reading`，颜色会明显收敛。文章页虽然复用了全站环境背景，但正文承载面更像一张独立的纸：文字、目录、边注、评论各自有位置，但不会争着成为主角。强调色继续保留 `moonlight` 这一组暖珊瑚色，用于链接、进度、按钮和轻微状态反馈，而不是到处铺满大面积品牌色。

### Typography（排版）

MyBlog 不是“一套字体打天下”，而是按任务分工。全站 chrome 和工具性 UI 主要用 `Space Grotesk`，它负责 header、目录编号、按钮和 metadata；长文正文与更长的说明文本，则交给 `Source Serif 4` 与 `Noto Serif SC` 这一组阅读型衬线组合。

首页和 discover 页面又保留了自己的语气。`Outfit` 让首页的 hero、section head 和引导性说明更接近 editorial 站点，而 `JetBrains Mono` 则专门承担 kicker、terminal、统计和少量工程感提示。它们只在合适的位置出现，所以首页可以同时保留研究博客的清晰度和一点 reference-mode 的气氛，而不会把整个站点拖成展示型 landing page。

这套排版真正想解决的不是“好不好看”，而是不同信息层该用什么声音说话：正文应该稳定、耐读；目录和 rail 应该轻，但不能弱；首页应该有主视觉，但不能压倒内容本身。

### Dark Mode（深色模式）

MyBlog 的主题切换是一个三态循环：`system → light → dark`。状态写入 `localStorage`，同时在页面加载最早阶段就预先注入结果，避免出现“先亮后暗”或“先暗后亮”的闪烁[^ref-hig]。

深色模式的选择也很明确：不是冷黑，而是带一点温度的深蓝与深石墨。这样做有两个好处。第一，页面仍然和浅色 runtime 属于同一视觉家族，而不是切到另一套完全不同的品牌语言。第二，卡片、边界、毛玻璃和阴影在深色底上更容易保住层次，不会变成一整块死黑。

## Patterns（模式）

### Content Architecture（内容架构）

MyBlog 的核心不是时间流，而是 topic-first。站点目前有三类内容集合：`posts`、`topics` 和 `concepts`。文章仍然是内容主体，但它们被放进主题和概念网络里理解：主题页负责表达“问题域”，概念页负责表达“局部术语或方法”，文章则是连接两者的可阅读节点。

这也是为什么首页不会只做“最近文章列表”。首页会先展示当前关注领域，再给出精选文章和近期更新；主题页会把入门路径、相关文章和相关概念收束到一起；概念页则会反过来告诉读者“这个概念出现在哪些文章、被哪些主题反复引用”。阅读路径因此不再只有“按发布日期往后翻”，而是允许读者沿问题、概念和文章来回跳转。

搜索也遵循同一个思路。站点的搜索索引不是单纯抓文章标题，而是把文章、主题和概念都纳入同一套结果集。对一个知识博客来说，这比做一条单纯的“文章检索框”更贴近真实使用场景：读者往往先记得的是问题域或关键词，而不是标题。

### Reading Architecture（阅读架构）

如果说 discover runtime 负责把读者带到正确的问题域，那么 reading runtime 负责把一次阅读维持在稳定的节奏里。文章页采用的是一个明确的三段结构：左侧是 TOC，中间是标题卡片与正文，右侧是 scholar rail。它不是为了“看上去专业”，而是为了把三种不同密度的信息拆开：导航、主叙事、补充材料。

段落 anchor 在这里是基础设施，不是视觉噱头。每个合规段落都会得到稳定的定位 ID，GFM footnote 会被整理成解释性注释或参考文献，再根据第一次出现的位置进入右侧 rail[^ref-tufte]。这样一来，参考资料和补充说明会贴着正文逻辑出现，但又不直接把正文切碎。

评论系统也遵循同样的原则。MyBlog 现在用 Waline 挂在文末，而不是把评论线程重新分散回正文段落里[^ref-waline]。这样做不是退步，而是边界更清晰：段落 anchor 继续服务 TOC、边注与脚注定位；评论则退回全文讨论，不再打断阅读主线。

### Interaction（交互）

MyBlog 的交互希望有反馈，但不希望有打扰。顶部 header 会随着滚动在 `top / compact / hidden` 之间切换，搜索入口支持快捷键直达，主题切换始终在原位可见，回到顶部按钮只在需要时出现。这些行为都服务于“工具应当随时可用，但默认退到后面”。

首页“关注领域”区域体现了另一条原则：浏览可以有节奏感，但不要把内容做成轮播广告。桌面端它是一条固定四卡的视窗，可以通过按钮、方向键和滚轮移动；移动端再回收到更直接的单列或双列阅读。交互存在感来自流动，而不是眩目动画。

更重要的是，所有运动都要服从 `prefers-reduced-motion`。如果用户不希望动画，页面仍然应当完整、稳定、可读。这一点在 reveal、header 状态切换和首页环境动画里都应该成立。

## Components（组件）

### Discover Shell（发现页骨架）

Discover 家族的组件不是为了“搭页面更快”，而是为了让所有非文章页面说同一种语言。`DiscoverShell` 负责环境层和主体容器，`PageHero` 负责不同页面的开场方式，`SectionHead` 负责把正文区块收成统一的节奏点。

这套骨架的价值在于：主题页、概念页、作者页、归档页虽然内容不同，但读者不会觉得自己跳进了四个完全不同的网站。页面有变化，但家族感是稳定的。

### Cards & Covers（卡片与封面）

卡片是 MyBlog 在 discover runtime 中最常见的承载方式。它们的任务不是制造强烈的 UI 形状，而是把信息整理到可浏览、可停留、可继续点击的单元中。hover 会发生，但主要体现在边界、阴影和轻微 lift 上，不会把卡片变成自己表演的对象。

封面组件是这套系统里更有个性的部分。`PostCover` 统一处理手工封面与 fallback 封面，也统一了“ghost + main” 的双层图像逻辑：主图负责清晰边界，ghost 层负责把颜色和气氛扩散到四周。首页精选卡、文章卡片和归档贴片因此能属于同一个视觉家族，而不用每个地方重新发明一套封面语言。

### TOC & Scholar Rail（目录与边注）

MyBlog 的目录不是简单地把标题列出来，而是作为阅读仪表的一部分存在。桌面端左侧的 `TocSidebar` 强调章节层级与当前位置，移动端再把同样的数据压成一个更轻的折叠目录。它们消费的是同一套 heading 数据，而不是两套平行实现。

右侧的 `PostScholarRail` 则承担另一类职责：把图表、注释、引用和参考文献从正文里挪开，但仍然让它们和正文保持可追溯关系。它本质上不是“侧栏 widget”，而是把学术写作里常见的边注结构翻译成前端可读的版本。对 MyBlog 这样的知识博客来说，这种结构比在正文中不断插入大块说明更适合长文。

### Waline Comments（评论）

`WalineComments` 的价值不在于评论功能本身，而在于它把第三方评论系统收成了一个清晰边界。文章页只负责提供路径和挂载点；主题适配、异常回退、未配置提示和初始化失败都在 wrapper 内部处理。

这让评论系统成为一块可以替换、可以扩展、也可以临时失效的边界件，而不是整篇文章渲染链路的一部分。对内容站来说，这种分层很重要：评论应该是加分项，而不是正文可读性的风险源。

### Spoiler（剧透遮罩）

Spoiler 组件的目标不是增加戏剧性，而是给长文作者一个自然的“先藏起来，读者决定要不要看”的写作手段。它服务的往往不是小说剧透，也可以是答案、彩蛋、实现细节，或者一个不想提前打断阅读的补充结论。

在 Markdown 里，块级 spoiler 采用下面这种写法：

```md
:::spoiler[结局剧透]
这里是一整块隐藏内容。
:::
```

如果只想藏一句短句，则可以写成 `:spoiler[这句话先遮住]`。默认不写标题时，块级 spoiler 会退化成一块没有可见文案的黑色遮罩，但仍然保留可访问标签。

如果我在这里直接说出 :spoiler[真正想传达的结论通常藏在边界设计里]，那行文节奏会被打断；把它先遮起来，读者就可以自己决定何时展开。

:::spoiler[结局剧透]
> 这个博客最重要的设计选择并不是某个卡片、按钮或 hover，而是把 `discover` 和 `reading` 明确拆成两套 runtime。前者负责找到问题域，后者负责维持阅读节奏。

- 剧透块里允许放段落、列表、引用和代码。
- 但 v1 不允许在里面放标题、脚注或嵌套 spoiler。
:::

## Guidelines（设计原则）

Do：

- 先尊重 runtime 边界，再做页面细节。`discover` 和 `reading` 的责任不同，不要试图用一套页面模板吃掉所有场景。
- 先通过语义 token 表达颜色、表面、边界与强调，再谈局部样式。
- 让 TOC、anchor、footnote 和 scholar rail 维持同一条定位链路，不要单独改其中一个环节。
- 让交互服务于浏览和阅读，而不是制造额外的注意力争夺。
- 把第三方能力封装成边界件，像 Waline 这样，让失败时也不会影响正文主体验。

Don’t：

- 不要为了某一页的局部效果绕过全站 token 或 runtime 约束。
- 不要把文章页重新变成正文中塞满评论和说明面板的界面。
- 不要随意放开 heading、anchor 或 footnote 规则，否则 TOC 与 rail 的阅读契约会一起漂移。
- 不要把首页 reference-mode 的视觉语言直接复制到所有地方，而不考虑内容密度和阅读任务。

## 短展望

接下来 MyBlog 仍会沿着同一条线继续打磨：让 discover runtime 更像一张可漫游的知识地图，让 reading runtime 更像一张可以长时间停留的纸。无论后面是继续补强搜索、扩展 author/archives，还是让 Waline 周边体验更稳，这套博客都不打算变成“功能越来越多的壳”，而是继续把重点放在内容组织、阅读节奏和清晰边界上。

## References（参考资料）

下列来源分别塑造了本文的章节组织、阅读观和评论系统边界。

[^note-current-source]: 本文描述的都是当前仓库中已经落地的设计事实。具体真源来自现有 runtime 边界、文章结构、组件实现与测试约束，而不是历史版设计快照的文字描述。
[^ref-hig]: Apple Human Interface Guidelines. 这里主要借用了 `Clarity / Consistency / Deference` 的三原则，以及从 `Foundations` 到 `Patterns` 的组织方式。 <https://developer.apple.com/design/human-interface-guidelines/>
[^ref-tufte]: Tufte CSS. MyBlog 对边注、脚注和“正文主线优先”的理解，和这类纸面阅读式设计有明显亲缘关系。 <https://edwardtufte.github.io/tufte-css/>
[^ref-waline]: Waline. 当前博客评论系统采用 Waline，通过独立 wrapper 集成到文章页中。 <https://waline.js.org/>
[^ref-misty-shadows]: Misty Shadows UI Gallery. 当前首页 reference-mode 的视觉整理参考之一，重点影响了环境光、终端模块与 editorial hero 的气质，而不是站点架构本身。
