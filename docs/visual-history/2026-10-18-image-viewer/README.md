# 文章封面点击放大

2026-10-18。为已有文章封面补上可发现、可退出的大图预览；原画、悬浮阴影、正文尺度和目录/旁注布局保留。

## 交互依据与边界

缩略图继续使用 Astro 的响应式资源；点击后单独读取完整源图。封面本身是有真实 href 的链接，保留修饰键点击及无 JS 时查看原图的路径。小型“放大”提示、zoom 光标与键盘焦点让动作可发现。

复用站内 native dialog 与 UiControllers 边界，不加依赖。原生模态框提供 top layer、背景 inert 和 Escape 行为；关闭按钮初始聚焦，Tab 在可用控件间循环，页面搜索快捷键不穿透。依据：[MDN dialog](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)。打开时锁住页面，关闭时恢复原有样式、滚动位置和封面焦点。

默认完整适应窗口；可点击图片或“原始尺寸”查看 100% 原图，并用原生滚动/触屏平移检查细节。再次点击恢复适应窗口。“查看原图”保留浏览器原图入口。原图已完整显示时不再提供无效果的尺寸切换。关闭按钮、Esc 与空白背景均可退出。加载中/失败有状态文字和原图入口。

手机控制栏改为两行，关闭按钮和其他控件至少 44px；横竖屏调整重新计算完整图片比例。白色/深色纸面和橙色交互墨色沿用现有 token。只挂载到有封面的文章阅读页。

## 截图与发现

| 阶段 | 视图 |
|---|---|
| 修改前 | [前一版正式文章](../2026-10-18-cover-air/v3-production-desktop.png) |
| v1 实现 | [封面入口](v1-cover.png)、[适应窗口](v1-fit.png)、[深色](v1-dark.png)、[手机](v1-mobile.png)、[位图原图](v1-raster.png) |
| v1 问题留档 | [原始尺寸](v1-original.png)、[手机原始尺寸](v1-mobile-original.png) |
| v2 修正 | [原始尺寸居中](v2-original.png)、[手机原始尺寸居中](v2-mobile-original.png)、[横屏适应](v2-landscape.png) |

v1 实际截图和整站测试暴露了全局 transition 对图片宽高切换的影响：样式已改而实际宽度晚一帧更新，导致居中滚动被旧边界截断。图片尺寸现在同步改变；v2 桌面滚动为 129/79px，手机为 630/154px，原图均为 1600×900、100%。已增加居中断言，没有延迟重试或放宽阈值。

先补交互测试并确认旧版没有入口。最终 116 单元测试与 7 项图片交互 E2E 全部通过；最后一次完整本地检查在尺寸修正前为 180/181，唯一失败即上面的切换问题。新增验收覆盖 SVG/位图、封面右缘指针命中、模态焦点、尺寸切换和滚动、退出后的目录吸顶、320/390px及横屏、加载失败与重新打开。

所有截图的路由、主题、视口、时间与源版本见 [captures.json](captures.json)，校验与后续发布信息见 [verification.json](verification.json)。原图和旧版本均未覆盖。生产验证见下文。

## v3 正式上线验收

[PR #19](https://github.com/Yuki-zik/myblog/pull/19) 合并为 `dc61387`，发布树与测试提交 `b270502` 完全一致。[PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39109831429) 全部 181 项 E2E 直接通过，[合并 CI](https://github.com/Yuki-zik/myblog/actions/runs/39110207475) 同样 181/181 通过。前端 Production `7151841125` 与 Waline `7151840199` 均成功，正式入口：[设计说明书](https://a-znk-blog.vercel.app/posts/myblog-design-manual)。

线上实际点击后模态框加载 1600px 原图、自动聚焦关闭按钮；100% 尺寸居中为 129/79px。Esc 退出后阅读滚动从 120px 恢复到 120px，焦点返回封面，body恢复overflow-x:clip；继续滚动后目录 top 85.59px。真实hover上浮6px，无页面脚本异常。六个阅读页的正文/锚点与构建一致，搜索13项，评论errno0且原1条保留。

新增8张正式截图全部复核，无页面横向溢出。其中原始尺寸、深色、横屏三张与已审查的本地实现逐字节相同；其余5张直接复核。

[封面入口](v3-production-cover.png) / [大图适应](v3-production-fit.png) / [原始尺寸](v3-production-original.png) / [深色](v3-production-dark.png) / [手机适应](v3-production-mobile.png) / [手机原图](v3-production-mobile-original.png) / [横屏](v3-production-landscape.png) / [位图原图](v3-production-raster.png)。本目录保留18张实现及正式截图，修改前截图复用前一版本档案。
