# Agent 历史票据 · 2026-10-25

本次为现有四个独立挂件补真实历史内容。交付票夹按六个工作目标归并十二份公开变更；其他三项观测继续保留未知。中文和英文共用数据，历史列表位于原来的默认关闭折叠区。原始会话没有进入公开文件。

桌面四件仍完整位于首屏；390px暗色和320px浅色无溢出。中文桌面与暗色原图、英文完整记录/方法图已逐张检查。英文长图在展开研究来源后的滚动位置截图，因此浮动胶囊出现在图的较低处；不是新的页面布局。

179单测、9项针对性浏览器检查、22项翻译引擎/7项执行器测试、生产构建/40页canonical/20对译文/翻译生命周期通过。来源与关键文件哈希见 manifest.json；正式发布回执在上线后追加。

| 原始截图 | 尺寸 | SHA-256 |
|---|---|---|
| [agent-history-1280-light.png](agent-history-1280-light.png) | 1280×900 | `16f6f00bd40a6d03d1f960941edd5c62d1804498cf7e5caea15db6324bc8b60f` |
| [agent-history-320-light.png](agent-history-320-light.png) | 320×1849 | `e3738d9ee1e8e327ac87b8c85d90fe121a9d0a85f2ba8fc449e9d4aec519c16e` |
| [agent-history-390-dark.png](agent-history-390-dark.png) | 390×1810 | `497f8d4b90e1dce7da1fab97310370017ee881416e2b5f9e49eaf8a9a4c22f84` |
| [agent-history-en-desktop.png](agent-history-en-desktop.png) | 1280×3752 | `5e375b1d9d513e9f6c98496b96538b0385ac2ca6e282e3b2fee478dd02358597` |


## 正式发布与回查

[PR #57](https://github.com/Yuki-zik/myblog/pull/57) 已以 `e5c9c0c5da6f9016e3f952207d1198645b9bf1f8` 发布。它和经过[完整 CI](https://github.com/Yuki-zik/myblog/actions/runs/40187443746)的 `8c09733708872b979be74912b3dfc53302749557` 具有相同的完整文件树 `df79ec6ce2d1a0a880ca8f2c47c41929e0bd6624`。179项单测、390项浏览器测试（5.3分钟）和既有构建/双语/翻译生命周期/审计门禁全部通过。

真实生产站 https://a-znk.com/agents 与 /en/agents 已回查：六张真实票据、十二个来源、循环翻页、隐藏票据收起详情、键盘和触屏模拟、三项未知值不变、无JavaScript完整来源读取通过，未捕获脚本异常。中文1280×900的四挂件仍是1000×564px，顶部212px；英文390px暗色无溢出。已逐张查看生产展开票据和英文手机原图；生产完整桌面尺寸和读数也已核对。

发布后的归档仅改文档与原始截图，不修改应用、数据、依赖或检查规则。原会话保留在本地，公开历史文件仅含摘要与PR链接。详见 production/verification.json 和 manifest.json。
