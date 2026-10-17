# 阅读页视觉版本

本轮用户确认文章采用「边缘标注」、论文详情采用「元数据优先」。所有截图保留原文件，后续修正用新版本前缀。

## v0 · 改动前的正式页面

来源：`https://a-znk-blog.vercel.app/`，代码 `1608094`，布局为改版前的阅读页。

| 页面 | 桌面1440×960 | 手机390×844 |
|---|---|---|
| 设计说明书 | [浅色](v0-article-desktop-light.jpg) / [深色](v0-article-desktop-dark.jpg) | [浅色](v0-article-mobile-light.jpg) |
| DUAP论文 | [浅色](v0-paper-desktop-light.jpg) / [深色](v0-paper-desktop-dark.jpg) | [浅色](v0-paper-mobile-light.jpg) |

## v1 · 真实内容的设计比较

来源：本地 `reading-drafting-review.html`，1440×960视口的完整比较画布截图。预览包含正文节选，不是完整文章实现；题签强化版仅用于比较，没有被选择实施。

- [文章·边缘标注（已选择）](v1-proposal-edge.jpg)
- [文章·题签强化（比较稿）](v1-proposal-titleblock.jpg)
- [论文·元数据优先（已选择）](v1-proposal-metadata.jpg)

## v2 · 实现与截图反馈

| 版本 | 页面与反馈 |
|---|---|
| v2a 首轮 | [文章浅色](v2a-article-desktop-light.jpg)：行内代码前景过浅，后续修正；[论文桌面](v2a-paper-desktop-light.jpg) |
| v2a 交互发现 | [手机目录定位偏移](v2a-mobile-toc-offset.jpg)：折叠目录后沿用旧目标，保留修复前证据 |
| v2b 代码配色修正 | 文章桌面[浅色](v2b-article-desktop-light.jpg) / [深色](v2b-article-desktop-dark.jpg)，手机[浅色](v2b-article-mobile-light.jpg) / [深色](v2b-article-mobile-dark.jpg) |
| v2b 阅读检查 | [桌面目录固定](v2b-article-toc-scroll-light.jpg)，[手机完整11位作者](v2b-paper-mobile-authors-light.jpg)，[展开引用](v2b-paper-mobile-citation-light.jpg) |
| v2c 目录修正 | [手机章节正确落点](v2c-mobile-toc-corrected-light.jpg)，标题top119.77px，目录已收起 |
| v2d 最终本地构建 | [手机平面表格](v2d-mobile-table-final-light.jpg)，论文桌面[浅色](v2d-paper-desktop-light.jpg) / [深色](v2d-paper-desktop-dark.jpg) |

正式上线截图将在验证后追加。捕获参数见 [captures.json](captures.json)。原生截图为JPEG，保留原字节，不进行重新编码。
