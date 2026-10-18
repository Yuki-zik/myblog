# 入口页比例与字体层级

2026-10-18。根据用户提供的首页与主题目录截图，对首页、主题/主题详情、论文列表、归档、作者和概念页进行调整。保留原图、真实内容、白色图纸与橙色；文章与论文阅读模板、专属CSS、正文及目录/旁注控制器未改。

## 依据与取舍

[Carbon typography](https://www.carbondesignsystem.com/building-blocks/foundations/typography/type-sets)按字体角色组织信息层级。本次借鉴角色区分，具体字号由本站真实内容和视口验证决定：主标题、摘要与元信息逐级收敛，避免152px姓名旁的12px介绍显得失衡。

[NN/g邻近原则](https://www.nngroup.com/articles/gestalt-proximity/)支持把相关信息放在一起。主题名称、篇数、摘要组成一组，取代跨三列的孤立文字；概念页压缩重复摘要、通用标签说明和实现术语，让真实定义与引用文章更早出现。

[GOV.UK布局指导](https://design-system.service.gov.uk/styles/layout/)强调小屏单列与可读行长。本次保持手机自然文档流；宽屏主题采用两列短索引，论文的长标题、完整作者和摘要维持单列。没有用全局zoom、删真实内容或制造装饰数据填空。

| 表面 | 原比例问题 | 本次实现 |
|---|---|---|
| 首页 | 介绍12px、方向13px、代码12.5px，绝对定位限制字号 | 介绍17px、方向21px、代码15.5px，400px完整代码纸签；正常流避免遮挡。手机17/16/14px，独立原图带 |
| 主题 | 22px标题/15px摘要散在三列，宽屏空白过大 | 30/18/14px标题/摘要/数量，数量紧跟名称；≥1100px双列、DOM横向保序，窄屏单列 |
| 主题文章 | 小摘要被截断、图链接内边距占掉正文宽度 | 26/17/14px，正文占主要宽度，完整标题摘要，保留1440px两栏 |
| 论文列表 | 作者13.44px，资源受17rem上限限制 | 30px标题、16px作者、17px摘要、16px资源，保持作者顺序和发表信息 |
| 归档 | 约17px标题不匹配宽大行布局 | 26/17/14px配176px方图；手机纵向图文 |
| 作者/概念 | 三个研究方向占四栏、两项占四栏；重复说明稀释内容 | 按实际内容自动分栏，24px条目标题、17–18px正文；更紧凑的作者信息与概念标签 |

## 截图反馈促成的修正

1. v1主题分组和字号改善，但1728px下右侧仍有约580px长期空白。v2改双列，保留1100px边界和手机单列。
2. v1首页卡片224px高，单行摘要与数量间距过大。原有两条回归发现问题，保持原断言，将卡片收回200px。
3. v1/v2作者手机截图显示减少动画模式下，原导航背景底部停在53px、菜单底部75.05px。v3只修discover默认导航在该模式下的背景高度，两者现在均75.05px。

## 版本索引

| 表面 | 正式旧版 | 第一版 | 最终本地 |
|---|---|---|---|
| 首页 | [宽屏](v0-home-wide.png) / [手机](v0-home-mobile.png) | [宽屏](v1-home-wide.png) / [手机](v1-home-mobile.png) / [深色](v1-home-dark.png) | [1440桌面](v2-home-desktop.png)，其他沿用v1 |
| 首页内容区 | [旧版](v0-home-index.png) | [留白偏大](v1-home-index.png) | [收紧后](v2-home-index.png) |
| 主题 | [旧版](v0-topics-wide.png) | [单列](v1-topics-wide.png) | [双列](v2-topics-wide.png) / [1100边界](v2-topics-boundary.png) / [深色](v2-topics-dark.png) / [手机](v1-topics-mobile.png) |
| 主题详情 | [旧版](v0-topic.png) | [实现](v1-topic.png) | 沿用v1 |
| 论文列表 | [旧版](v0-papers.png) | [桌面](v1-papers.png) / [手机](v1-papers-mobile.png) | 沿用v1 |
| 归档 | [旧版](v0-archives.png) | [实现](v1-archives.png) | 沿用v1 |
| 作者 | [旧版](v0-author.png) | [桌面](v1-author.png) / [手机背景问题](v2-author-mobile.png) | [修正手机](v3-author-mobile.png)，桌面沿用v1 |
| 概念 | [旧版](v0-concept.png) | [实现](v1-concept.png) | 沿用v1 |

用户参考图保留为[user-home.png](user-home.png)、[user-topics.png](user-topics.png)，未知其浏览器缩放与CSS视口，未把物理像素直接当CSS字号。

每张图的路由、视口、主题、时间、来源和SHA256见[captures.json](captures.json)。v1/v2代码差异根据记录的两轮修改复原，v3为最终实际source diff，均可在基线`c8f130a`上用`git apply --unidiff-zero`复现视觉；旧图不覆盖。

## 验证状态

116项单测通过；首轮全量168/170通过，两个失败均为首页主题卡留白，已在原断言下修复；最终18项相关生产构建E2E通过。新增双列测试先失败后通过，移动导航高度也以真实53/75.05px差值复现后修复。当前待精确提交CI与正式部署验收。
