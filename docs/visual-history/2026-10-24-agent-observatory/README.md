# Agent 工作观察站 · 2026-10-24

## 来源与范围

- PR：[#48](https://github.com/Yuki-zik/myblog/pull/48)。
- 代码验收提交：`71e9463b264cc6416b17202d6223f9e439721e5a`。
- 页面实现自 `a0b434d7106aca08d876f7223eff556bb4c9dbcb` 起保持一致；后一提交只修正 Playwright 的 JSON 模块导入。
- 验收运行：[CI 40102898033](https://github.com/Yuki-zik/myblog/actions/runs/40102898033)。155 项单测、317 项生产构建浏览器测试全部通过，包含两条观察站用例。
- 原始截图来自该运行的 `browser-review-evidence` artifact（ID 12563747185）；本目录保留原始 PNG，重复的 Playwright attachment 副本已按字节一致性去重。
- 这是新增页面与主页入口。截图记录实现态，不把此前不存在的 /agents 伪造为“改版前”。正式发布回执随 PR 维护。

## 截图

| 文件 | 路由 | 视口 / 主题 | 内容 |
|---|---|---|---|
| [详情页桌面](v1/agent-observatory-1280-light.png) | /agents | 1280×900 / light | 全页，第一条研究详情展开 |
| [详情页手机浅色](v1/agent-observatory-320-light.png) | /agents | 320×900 / light | 全页，最窄支持视口 |
| [详情页手机暗色](v1/agent-observatory-320-dark.png) | /agents | 320×900 / dark | 全页，最窄支持视口 |
| [首页挂件桌面](v1/agent-widget-home-1280-light.png) | / | 1280×900 / light | 挂件与漫游/页脚的衔接 |
| [首页挂件手机](v1/agent-widget-home-390-dark.png) | / | 390×900 / dark | 挂件与周边模块的衔接 |

## 可视验收

桌面页面、首页入口、来源原生展开、页内口径跳转已在实际生产静态构建中人工操作。另由独立页面 agent 实际查看手机截图：四指标以2×2排列；“待记录”与空状态清楚；日期、证据类型、展开详情及两个模板链接完整；暗色正文、辅助文字和链接可辨；首页挂件与周边模块边界对齐。317 项浏览器测试同时保护既有导航、阅读和交互。

320px 研究区标题及390px 首页简介各有一处自然换行的短尾（“式。”与“果。”），不裁切、不影响操作，记录为后续排版微调观察，本轮未为此扩大已通过的修改范围。

页面没有个人观测数据或模拟历史曲线；四项未知值不写成0。现有依赖审计的修复过程和版本见 PR 与 agent/timeline.md，原审计门禁及历史忽略项均保留。

## 原图校验

| 文件 | SHA-256 |
|---|---|
| agent-observatory-1280-light.png | 13b51574952c96a6a331bbb99134713ae5e36f1e3e832360eaaf5f4ee4b4ec17 |
| agent-observatory-320-dark.png | 948e84d9f277ca5326456b104d337c174a07d0abadb10b34aa4cf6bc84189f58 |
| agent-observatory-320-light.png | f8c65549164ea9a12244244b076427a046647ab0636e1d4c407d50ac1db79846 |
| agent-widget-home-1280-light.png | 43ed854a839996d0840425daf67784b7b9bb98d863fa178c11112a8d55330f6b |
| agent-widget-home-390-dark.png | a3c65ea56b54a952fe5344c3c3da700dc568922b9a8cd0cf84d20528733485c2 |
