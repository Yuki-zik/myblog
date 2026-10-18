# 文章页头留白与封面悬浮

2026-10-18。用户反馈文章页头仍紧凑、封面原有悬浮感与阴影丢失。本次仅修改`article-drawing.css`的页头构图与封面表面，原图、正文尺度、整篇浮动纸面、目录和旁注控制器保留。

## 原因与修正

旧标题卡的bleed在大屏超过实际纸面空间；封面靠右对齐使边距从1440px下44px缩为1920px下7px，2560px约-4px。加上6px边框、硬质错层底片和较弱ghost，视觉更像贴在纸面上的框。

本次给宽屏图列保留32px尾部空间、40–60px列距，封面在本列居中；页头上下留白增加，至正文的间距改为56px。去掉硬底片与轮廓线，使用3px纸边、柔和双层投影和24px模糊的原图色晕；hover轻抬，减少动画模式保留静态层次。摘要桌面16px、手机15px。

实测1440px边距76.23px、1920px边距53.45px；首段距页头约57.59px（原25.59px），1440px正文仍721.59px。新断言覆盖1440/1728/1920/2560px纸边与标题间距、两种主题的柔和层次；既有目录吸顶、手机章节落点与旁注测试通过。

| 状态 | 桌面 | 宽屏 | 手机 / 其他 |
|---|---|---|---|
| v0 正式旧版 | [1440](v0-desktop.png) | [1920](v0-wide.png) | [手机](v0-mobile.png) |
| v1 本地实现 | [1440](v1-desktop.png) | [1920](v1-wide.png) / [深色](v1-dark.png) | [手机](v1-mobile.png) / [平板](v1-tablet.png) / [深色原图](v1-raster.png) |

原始[用户截图](user-reference.png)及所有版本均保留。每张图的参数与SHA256见[captures.json](captures.json)。116项单测、70项相关生产构建E2E通过；两条新增测试先在旧版本失败。静态发布及最终交互验收见下文。


## 线上悬停修正

PR #17合并为`63bd4a9`并部署，PR与合并CI均173/173通过。6张正式静态截图已追加为v2-production-*，图形与留白验收通过。实际鼠标验证进一步发现，透明的旁注占位及父容器覆盖了封面伸入旁注轨道的部分，拦截hover；不能只凭静态图片宣称抬升行为恢复。

新测试真实hover封面右侧先失败，再将≥1420px的空白rail容器设为pointer-events:none、实际.post-scholar-item恢复auto。修后hover产生-6px抬升，正文不移动；旁注按钮/来源链接通过真实actionability检查，减少动画保持静态。116单测、20项相关生产构建E2E通过，[PR #18](https://github.com/Yuki-zik/myblog/pull/18)的[完整CI](https://github.com/Yuki-zik/myblog/actions/runs/39102400338)174/174通过，[合并CI](https://github.com/Yuki-zik/myblog/actions/runs/39102758477)同样174/174通过，合并为`f910599`，发布Git树与被测版本相同。

## v3 最终线上验收

前端Production `7150725468`与Waline `7150730089`均成功。正式页面重新加载后实际鼠标触发`matrix(1,0,0,1,0,-6)`，正文top在悬停前后均480.859375px；旁注按钮命中正确，减少动画模式transform:none，手机无横向溢出。6个阅读页内容/锚点与构建一致，搜索13项、评论HTTP200/errno0且原1条保留。

[正式桌面](v3-production-desktop.png) / [真实悬停](v3-production-hover.png) / [正式手机](v3-production-mobile.png)。共18张页面截图和1张原始用户截图，旧版本未覆盖。可机器读取的证据见[verification.json](verification.json)。
