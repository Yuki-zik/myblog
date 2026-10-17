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

## v3 · 正式站点

来源：`https://a-znk-blog.vercel.app/`，PR #13，合并提交`d10beef2eeee75f4bacfa32ba8b9c5f3924b1ef5`；前端Production `7137600044`。PR与合并CI均完整155项E2E通过。

| 页面/状态 | 正式截图 |
|---|---|
| 文章桌面 | [浅色](v3-article-desktop-light.jpg) / [深色](v3-article-desktop-dark.jpg) |
| 桌面目录跟随 | [滚动后TOC固定](v3-article-toc-scroll-light.jpg) |
| 手机目录定位 | [折叠后标题准确落点](v3-article-mobile-toc-light.jpg) |
| 论文桌面 | [DUAP完整元数据](v3-paper-desktop-light.jpg) |
| 论文手机 | [完整11位作者与资源](v3-paper-mobile-authors-light.jpg) |

共29张截图。捕获参数与字节SHA256见 [captures.json](captures.json)。原生截图为JPEG，保留原字节，不进行重新编码；明暗主题及临时浏览器尺寸已恢复。
