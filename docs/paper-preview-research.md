# 学术主页论文图：来源、自动化与本站取舍

2026-10-22：用户提供 DUAP 的 Fig.3，并希望了解 GitHub 静态学术主页如何给最新论文配图。本次检查官方文档和源码，区分列表自动生成、图片提取与作者选图。

## 三种真实模板

| 项目 | 论文预览图来源 | 自动化实际做什么 |
|---|---|---|
| [al-folio](https://github.com/alshedivat/al-folio/blob/main/docs/CUSTOMIZE.md#managing-publication-display) | BibTeX `preview` 指定 `assets/img/publication_preview/` 中的图；`poster` 是独立的海报文件链接 | 从BibTeX生成列表和年份组织；另有Scholar引用数据更新 |
| [minimal-light](https://github.com/yaoyao-liu/minimal-light/blob/main/_data/publications.yml) | 每篇YAML中的 `image` 字段 | [模板](https://github.com/yaoyao-liu/minimal-light/blob/main/_includes/publications.md)将图片、作者、标题与资源一并生成 |
| [academicpages](https://github.com/academicpages/academicpages.github.io/blob/master/markdown_generator/pubsFromBib.py) | `header.teaser`；[归档模板](https://github.com/academicpages/academicpages.github.io/blob/master/_includes/archive-single.html)在grid模式显示 | BibTeX/TSV转Markdown元数据；默认论文列表并不自动从PDF挑选方法图 |

这些实现支持“一次录入，多处呈现”，所查默认链路并未自动选择PDF中的方法图。不能把引用数更新或元数据生成称为自动海报获取。

## 真正的自动提图

[PDFFigures2](https://github.com/allenai/pdffigures2#input-and-output)可以抽取带图注的figure/table及边界、图号、页码；官方也列出了[流程图等复杂布局的提取误差](https://github.com/allenai/pdffigures2#common-sources-of-errors)。已知页码和范围时，[PyMuPDF的clip渲染](https://pymupdf.readthedocs.io/en/latest/recipes-images.html#how-to-create-partial-pixmaps-clips)能保留整幅图的最终视觉，包含PDF里的文字和矢量线条。

本站已有Poppler提取文本/布局、图注打分、页码与裁切范围记录，以及sharp生成图片的管线。因此本轮复用现有工具，修正固定16:9画布，保留裁切区域的原始比例和透明度。继续使用“生成候选→核对图号/范围→应用”的流程。

## 这张图的设计判断

这张图是DUAP中语言特征解耦（LFD）的Fig.3，适合作为方法的视觉摘要。它包含大量标签与连线，因而应保持完整横向构图，用足够大的预览辨认结构，并让用户点开原图读取细节。

- 作者论文区和论文索引：完整标题/作者/发表信息先行，方法图与研究摘要并列；窄屏依阅读顺序纵向排列。实际截图显示原作者章节侧栏压缩了方法图，因而将有图论文区的章节头移至上方，让原来的空栏宽度用于论文预览。
- 论文详情：方法图在摘要后展开，占正文宽度，使用相同的图号、图注和原图查看器。
- 图片不裁切，不增加白框，不在深色模式反相；原图2832×1292，源文件字节保持不变。
- 一篇论文的一份 `cover` 数据同步到三个页面。未知的PDF页码保持为空，图号不冒充页码。

论文原图的选择影响读者对工作的理解。自动化优先处理候选生成、尺寸输出、来源校验和跨页面同步；代表图的内容选择需要结合论文表达。没有真实图片的论文继续使用完整元数据和摘要，不填充无关装饰。

维护操作与命令见 [paper-automation.md](paper-automation.md)，实际截图见 [本轮视觉档案](visual-history/2026-10-22-paper-figures/README.md)。
