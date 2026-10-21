# 图像表达与轻交互

2026-10-21。用户要求把适量配图和轻交互作为全站设计原则。图片承担识别、解释或提供观察材料的作用；保留白纸、橙色标注、真实内容与现有阅读结构。

## 按内容选择图像

| 页面 | 图像角色 | 实施方式 |
| --- | --- | --- |
| 首页 | 建筑主视觉、文章识别、内容连接 | 沿用已有建筑图、真实文章封面和可操作的纸签入口 |
| 主题目录 | 用图版帮助辨识主题 | 五幅历史图版与主题文字并列，查看图片与进入主题是两个独立入口 |
| 主题详情 | 为主题说明补充观察材料 | 同一主题沿用同一图版，放在“关于这个主题”，阅读列表仍优先 |
| 作者 | 研究方向的视觉参照 | 三幅图与三条完整研究说明配对；保留原头像和首屏代表作 |
| 概念 | 说明之外的图像参照 | 图版与已有关联索引组合，不替代概念定义和引用文章 |
| 论文列表 | 研究记录的历史参照 | 独立标注 Note G 图版；实际论文状态、作者和原文资源保持完整 |
| 归档 | 文章识别 | 沿用真实文章封面及已有悬浮效果，图片继续作为文章入口 |
| 漫游 | 展示真实关系 | 现有 SVG 关系图和纸签即图像表达，保持搜索、筛选与预览 |
| 阅读页 | 正文内容及原始图像 | 沿用原封面、正文图、目录和旁注，图版体系不插入文章正文 |

## 图版与交互契约

- 使用真实、可核验的作品，图注区分历史参照与现代论文结果。原图字节保存在 `src/assets/editorial/`，来源、权利、下载日期和 SHA-256 记录在 `sources.json`。
- `src/lib/media/editorialFigures.ts` 统一图注和页面映射；`EditorialFigure.astro` 负责图像、图注、出处和说明。来源链接常显；原生 details 展开说明与权利记录。
- Astro 生成响应式展示图，明确尺寸并懒加载。原图保持完整、原色和 `contain`；暗色主题改变周围界面颜色，保留扫描图本色。
- 图片点击/Enter 打开现有 ImageViewer，支持原始尺寸、关闭/Esc、焦点及滚动恢复。禁用 JS 时链接仍直达本地原图；每页只挂一次 viewer，由现有 UiControllers 统一控制。
- hover 与键盘焦点使用同等纸面反馈，减少动态模式停用位移。图片入口与主题/文章入口分别明确，避免嵌套链接和点击歧义。
- 图像需要足够的观察尺度。目录约占条目宽度三分之一；研究区约三至四成。横幅使用较矮图框，纵幅留足高度，以实际截图校正空白、顺序与正文尺度。

## 本轮图版来源

| 图版 | 年代与出处 | 使用依据 |
| --- | --- | --- |
| Cajal 皮层三联图 | 1899；[Commons](https://commons.wikimedia.org/wiki/File:Cajal_cortex_drawings.png) | 原作公共领域；2009为数字组合日期 |
| 立方体歧义图 | 1899《The Mind’s Eye》图13/13a/13b；[原文](https://en.wikisource.org/wiki/Popular_Science_Monthly/Volume_54/January_1899/The_Mind%27s_Eye)、[图源](https://commons.wikimedia.org/wiki/File:PSM_V54_D324_Optical_illusion_with_cubes.png) | 公共领域；用于感知歧义的历史参照 |
| 离心调速器与节流阀 | Routledge 1900年版插图；[Commons](https://commons.wikimedia.org/wiki/File:Centrifugal_governor.png) | 来源页标记 Public Domain；绘者未署名 |
| 达芬奇齿轮装配与分解图 | 1894–1904复制出版物；[美国国会图书馆](https://www.loc.gov/item/2006681098/) | 原手稿确切年份未核实；采用馆藏原始1024px图，保留手写旁注 |
| Lovelace Note G计算表 | 1843；[Science Museum原书记录](https://collection.sciencemuseumgroup.org.uk/objects/co8652385/book-sketch-of-the-analytical-engine-invented-by-charles-babbage-esq)、[公共领域图像](https://commons.wikimedia.org/wiki/File:Diagram_for_the_computation_of_Bernoulli_numbers.jpg) | 年代以原书藏品记录为准，修正Commons的1842字段 |

当前两篇论文没有已保存的合法原始配图，本轮保持 `paper.cover` 为空。未来获得作者持有的 PDF 或公开授权原图时，使用既有 `papers:enrich` 管线记录真实图片来源。

## 验证和版本

重点验证图像真实解码、同页多图预览、键盘与滚动恢复、无 JS 原图入口、图文导航分离和各断点排版。保留原有文章封面、主题阅读顺序与论文首条位置约束。

截图与本轮设计调整记录见 `docs/visual-history/2026-10-21-editorial-imagery/`。技术检查通过不代替实际整屏视觉判断。
