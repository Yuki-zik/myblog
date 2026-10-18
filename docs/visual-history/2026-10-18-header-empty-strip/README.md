# 顶部胶囊回拉时露出空白背景（2026-10-18）

用户反馈从下方向上拖动顶部导航时，白色胶囊背后会露出与正文背景不连贯的空白带。原实现 `.site-header` 是 sticky 且在正常文档流中占据高度（桌面 68px，手机两行约 96px），而背景及内容的 scroll timeline 从 `scrollY = 0` 就开始折叠。页面主体尚未进入视口顶部，胶囊左右已露出原导航栏占位处。

修正：在 `UiControllers.astro` 的 `syncHeaderScale()` 内用 `header.offsetHeight` 更新 `--header-collapse-start`，并让 `site-header-collapse` / `site-header-content-collapse` 两条 scroll timeline 同步使用 `[headerHeight, headerHeight + collapseEnd]`。既不改变原 capsule 的收拢终态、样式与控制器，也不让文本通过 scale 变形；根据手机两行实际高度决定何时收拢。

生产版旧样式在 1440px 宽、`scrollY=45` 时胶囊左缘 x≈105px，正文首屏顶端仍在 y=23px，造成背景空白；新样式同一位置左缘 x=-48px，覆盖全宽。截图：`v0-live-scroll45.png`、`v1-fixed-scroll45.png`、`v1-fixed-scroll116.png`，测量值在 `evidence.json`。

新增 E2E 回归：桌面和手机在正常下滑及反向回拉到导航栏高度以内时，背景始终覆盖全视口；过渡结束后变回浮动胶囊，页面没有横向溢出。针对性的 10 项胶囊/内容收拢/深浅色/手机测试通过；本地既有 121 项单测通过。随后仍需要 PR CI 和公开站点验收，才能算正式发布。

首次 PR CI 发现原有移动搜索关闭时阅读位置恢复偏差：191 项通过，1 项在 Linux 连续复现 645→640px。进一步查到移动顶部栏滚动展开高度为95.89px、折叠后为91.05px；弹层固定 body 会重置 root scroll timeline，恢复时 5px 的文档流高度差触发 scroll anchoring。将移动两行的 `--header-band` 最小占位锁为96px后，本地对照 top/compact 均96px、搜索前后均650px；新增固定高度/搜索恢复回归，与已有相关用例5/5通过。通过稳定布局修复原因，保留搜索原本的精确滚动恢复断言。
