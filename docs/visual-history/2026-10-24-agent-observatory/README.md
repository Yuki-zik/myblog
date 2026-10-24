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

## v2 · 与已发布双语主线集成

- 集成提交：`c5984b07ba96d56063141eef2b6e47145d050f7c`；合入 main 的提交：`46ffc8f453bb0e357677f42dbd1c0026c7859ce5`。两者的完整文件树均为 `bd428958b1a1737af20d88ae7efaa418d2b31da1`。
- 完整验收：[CI 40104474504](https://github.com/Yuki-zik/myblog/actions/runs/40104474504)，159 项单测、326 项 Playwright 测试通过；39 个 canonical 页面的 sitemap parity、19 对中英文页面与13条英文搜索项校验、既有两套审计门禁及 Waline smoke 通过。
- 原始图片来自该运行的 `browser-review-evidence` artifact（ID 12563399562）。同名原始文件精确提取，不修改或重绘；Playwright 的重复 attachment 副本不另存。
- 最新构建中，中文首页的 EN 切换、六项导航和观察站挂件共存；实际切到英文首页再返回中文验证成功。/agents 尚无英文译文，不生成虚假语言配对或切换入口；其中文 canonical 为 https://a-znk.com/agents。
- 根代理复核桌面挂件和详情页；独立页面 agent 逐张复核320px深浅色及390px暗色截图，未发现新阻断问题。原有两处窄屏短尾保持非阻断记录。

| 文件 | 路由 | 视口 / 主题 | SHA-256 |
|---|---|---|---|
| [agent-observatory-1280-light.png](v2/agent-observatory-1280-light.png) | /agents | 1280×900 / light | 13b51574952c96a6a331bbb99134713ae5e36f1e3e832360eaaf5f4ee4b4ec17 |
| [agent-observatory-320-dark.png](v2/agent-observatory-320-dark.png) | /agents | 320×900 / dark | 8bba01488e9def94a0fd77c9b07ea0328cef0417d70368031cf0ed7414d4538d |
| [agent-observatory-320-light.png](v2/agent-observatory-320-light.png) | /agents | 320×900 / light | a09189e2a40b41dd8b9dc64205f17bb335a81371694a046333a6a98b09b23b6c |
| [agent-widget-home-1280-light.png](v2/agent-widget-home-1280-light.png) | / | 1280×900 / light | 536334a2353fe8988ec8d9c6006a8f4746b9c7ff7303f9b9eac78f9ceaeb6567 |
| [agent-widget-home-390-dark.png](v2/agent-widget-home-390-dark.png) | / | 390×900 / dark | 0268cf27fed0b2e928d89c150995979b5d36f40d86b11f28d685e70ff1c7d476 |

## 正式发布回执 · 2026-10-24

[PR #48](https://github.com/Yuki-zik/myblog/pull/48) 已以 `46ffc8f453bb0e357677f42dbd1c0026c7859ce5` 合入 main。该提交与最终集成提交 `c5984b0` 的完整文件树相同（`bd428958b1a1737af20d88ae7efaa418d2b31da1`）；[CI 40104474504](https://github.com/Yuki-zik/myblog/actions/runs/40104474504) 全部通过：159 项单测、326 项浏览器测试、39 个 canonical 页面的 sitemap 校验、19 对中英文页面和13条英文搜索项检查，以及原有构建、审计与 Waline smoke 门禁。

正式地址：[Agent 工作观察站](https://a-znk.com/agents)。关联的 myblog / waline 两项 Vercel 部署均成功。实际在正式域名确认：四项指标均为“待记录”，六条研究存在，来源可展开，canonical正确；中文首页只有一份挂件、原六项导航完整，从首页进入新页成功；中文与英文首页往返正常，英文首页没有未翻译挂件。Markdown每日模板下载完成，空JSON模板的响应与结构在CI中验证。浏览器第二个下载事件捕获超时，未把该事件当作JSON文件损坏或另行宣称下载成功。

v2 原图与校验值见本档案。发布后的归档提交仅更新这些文档与原始截图，应用代码、个人数据、模板和检查规则保持已验收版本。后续记录由作者核对后填写；初始页面没有自动采集或定时任务。

## v3 · 每项数据一个交互挂件，迁至 Mac mini 开发

用户反馈前版面积过大，要求不同外观、各自可交互并单独成页。新版以开放轨道、票夹、表盘和反色卷尺呈现四项数据；中文主页变为82px高的短入口，研究/记录/模板默认折叠。四件在1280×900首屏中完整呈现，手机按源顺序单列。

代码直接在 Mac mini `/Users/a-znk/Code/myblog-agent-widgets` 编写与构建。159项单测、11项生产构建浏览器检查通过，覆盖4种交互、实测与示意隔离、320px/390px深浅色、无JavaScript阅读/原始来源/模板、首页入口和胶囊导航。39页canonical、19对译文/13条英文索引与论文图片来源检查通过。正式发布以之后的PR/部署回执为准。

根代理逐张检查以下4张原始截图：四种轮廓可辨、范围控件和按钮完整、手机无水平溢出、反色卷尺的数值保持可读；首页短入口与原漫游模块和页脚衔接正常。全部为实际Mac生产构建截图，不重绘、不覆盖v1/v2。`v3/manifest.json`保留截图与源文件SHA-256、分支/基线及复现命令。

个人数据仍为空；各实测值均为“待记录”。可操作区域持续标示“交互示意 · 不计入实测”。表盘和卷尺使用同一90分钟示例总投入，返工是其中一部分；分钟轨道没有被冒充为实际任务时间线。

| 文件 | 路由 | PNG尺寸 | SHA-256 |
|---|---|---|---|
| [agent-instruments-1280-light.png](v3/agent-instruments-1280-light.png) | /agents | 1280×900 | `a1ecd8bbcf965b8b1b6837ab6745b7c090efc40a5eafef57f0e550289ff592e3` |
| [agent-instruments-320-light.png](v3/agent-instruments-320-light.png) | /agents | 320×1849 | `6313eab9d7f5052098e49793962f06bd0e8d04839556fe31ae69c82a2ac585ea` |
| [agent-instruments-390-dark.png](v3/agent-instruments-390-dark.png) | /agents | 390×1810 | `317cdf7cfeca3f53b3b71e4ea836dce6d9b14640e19948d07b789b2486eef3c9` |
| [agent-instruments-home-entry-1280-light.png](v3/agent-instruments-home-entry-1280-light.png) | / | 1280×900 | `f997eae8b21e2c0da1590304b1684ec3cb10b5cc52e881eb8425c317e50a19ad` |
