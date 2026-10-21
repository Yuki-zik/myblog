# 有序的非对称构图

用户反馈：归档海报被放进方形白框，年份下方出现长空栏；作者实践标题独占一列，四张重复宽卡片令剩余空间显得机械。沿用白纸、橙色和已有内容，以构图解决这些问题。

## 参考与判断

[Cooper Hewitt 对 Armin Hofmann 海报的解读](https://www.cooperhewitt.org/2018/08/05/aharmonyofcontrasts/)将网格、非对称构图和对比元素的统一联系起来；[MoMA 对 Jan Tschichold 1930 年海报的馆藏说明](https://www.moma.org/collection/works/7292)强调非对称与平衡服务于信息传达。这里借鉴其构图思想，保留博客自己的颜色、内容与阅读目的。

据此采用的规则：字体、颜色、编号和对齐网格固定；宽窄、起点与内容自然高度可以变化。变化有重复规则，不依赖随机数、逐条手工定位或任意旋转。

## 落地

- **归档海报**：使用 PostCover 的 `poster` 变体，读取原始图片宽高；图像与容器同宽同高，无白边、方框或额外背景。保留原图、柔和投影和轻微悬停；键盘焦点单独保持可见。
- **时间结构**：年份作为横向章节头和真实年度篇数，月份和内容共享整个版心，不再预留贯穿全年条目的左栏。年月与文章仍按既有数据倒序排列。
- **实践与关注**：章节标题移到内容上方。实践区采用12列网格，按7/5、5/7重复；右侧纸面下移24px，形成有界的疏密变化。关注便笺沿用7/5分配，长研究问题获得较宽版面。
- **阅读秩序**：DOM、键盘顺序和源文字保持。850px及以下回到单列，取消错位；没有为对齐而设置标题占位或固定卡高。

这是一组可复用的规则，不为某一条项目写专用版式。新增项目依然填写 `SITE_AUTHOR_PROFILE.practiceHighlights`，新增文章从 collection 自动接入，宽窄循环随条目自然延续。

## 维护入口

| 责任 | 文件 |
|---|---|
| 项目/关注布局节奏 | `src/styles/author-dossiers.css` |
| 原图海报变体 | `src/components/post/PostCover.astro`、`src/styles/post-poster.css` |
| 年月档案布局 | `src/pages/archives.astro`、`src/styles/archive-dossiers.css` |
| 共同纸面与内容结构 | `ContentDossier.astro`、`content-dossier.css`，本轮保持 |

新回归检查海报实际原比和无框、横向年份与真实计数、首条内容位置、桌面宽窄/偏移范围、手机顺序以及键盘操作。旧“必须方形”的断言按用户新要求替换为“原图比例”；正文仍取得较大份额和足够阅读宽度。

截图和具体结果见 [视觉档案](visual-history/2026-10-21-ordered-asymmetry/README.md)。
