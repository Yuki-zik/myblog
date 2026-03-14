# 任务清单

| 优先级 | 任务 | 状态 | 负责人 | 截止 |
|---|---|---|---|---|
| 中 | 提升文章页阅读进度条可见性：增强顶部轨道与填充对比度，避免“存在但不可感知” | ✅ | AI Assistant | 2026-03-14 |
| 高 | 收紧配色语义与阅读界面：恢复 Midnight/Navy 主导的 header/footer，修正顶部栏展开/缩放状态、进度条独立固定和文章页左移去边框 | ✅ | AI Assistant | 2026-03-14 |
| 高 | 基于 Midnight Blue / Navy / Lace / Ivory / Moonlight 配色重构全站主题系统、首页/列表/阅读页，并修复文章页移动端响应式断裂 | ✅ | AI Assistant | 2026-03-14 |
| 高 | 初始化 `agent/` 目录结构和标准文档 | ✅ | AI Assistant | 2026-02-21 |
| 高 | 将原 `AGENT_CONTEXT.md` 内容迁移至标准规范 (`Agents.md`) | ✅ | AI Assistant | 2026-02-21 |
| 高 | 新增作者档案配置和文章作者解析，文章页展示作者元数据 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增 Header 即时搜索（posts/topics/concepts）与 `/search-index.json` | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增文章目录（H2/H3）：桌面端固定 + 移动端折叠，含当前章节高亮 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增 `/author` 页面及顶部导航入口 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增文章底部评论系统（独立 Supabase 表、Markdown 渲染、GitHub 登录入口） | ✅ | AI Assistant | 2026-02-22 |
| 高 | 使用 `/Users/a-znk/Downloads/myblog-main` 同步本地仓库源码并更新 GitHub | ✅ | AI Assistant | 2026-03-12 |
| 高 | 修复同步后文章页丢失段落评论挂载导致的 E2E 回归 | ✅ | AI Assistant | 2026-03-12 |
| 高 | 整体精修博客 UI/UX：轻量 header、搜索胶囊、统一主题容器、拓宽文章阅读区并恢复阅读进度条 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 调整阅读页结构细节：header 常态贴顶、正文/注释去边框、放大目录、进度条回到最顶细线 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 修正阅读页剩余观感问题：进度条跟随、左右留白、header 再缩小、TOC 缩进层级 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 继续精修阅读页：让进度条与 header 解耦、放大 TOC、继续拓宽正文并压缩滚动态 header 宽度 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 重做阅读页目录层级比例，并修复进度条被旧规则覆盖导致的消失/配色问题 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 继续修正阅读页目录与进度条：放大 TOC、强化 H2/H3 层级差异，并确保 header 收缩时进度条持续可见 | ✅ | AI Assistant | 2026-03-13 |
| 高 | 修正阅读页进度条定位逻辑，并把顶部栏品牌/导航往中间收拢以改善协调性 | ✅ | AI Assistant | 2026-03-14 |
| 中 | 继续压缩滚动态 header 垂直高度，并放宽文章标题下导语文本框 | ✅ | AI Assistant | 2026-03-13 |
| 中 | 按参考图像素级细化滚动态顶部条，并补强导航/搜索 UX 后用截图与 E2E 复核 | ✅ | AI Assistant | 2026-03-13 |
| 中 | 调整滚动态顶部条宽度与导航布局，并用截图验证缩放效果 | ✅ | AI Assistant | 2026-03-13 |
| 中 | 分析现有代码与文档是否一致 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 根据 README.md 和需求总结界面设计并更新 README 文档 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 为归档页（/archives）添加海报横幅 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 修复 agent/ 文档结构问题（timeline 格式、codex 重写、README 死链等） | ✅ | AI Assistant | 2026-03-03 |
| 中 | 制定 Figma 先行的 UI/UX 设计到代码落地工作流 | ✅ | AI Assistant | 2026-03-09 |
| 中 | 将现有博客全站 UI（desktop/mobile + light/dark）复现到 Figma 文件 | ✅ | AI Assistant | 2026-03-09 |
| 中 | 向现有 Figma 文件追加 `00 Foundations` / `01 Components` / `02~05` 结构页 | ✅ | AI Assistant | 2026-03-09 |
| 高 | 基于五色系（Midnight/Navy/Lace/Ivory/Moonlight）重建主题 Token 层与全站配色，避免深蓝死板与高饱和撞色，提升阅读体验 | ✅ | AI Assistant | 2026-03-14 |
| 中 | 在 Figma 内手工重命名现有页面、归组并抽取真实可复用组件实例 | ⏳ | AI Assistant | - |
| 中 | 为搜索 / TOC / author 页面补充 E2E 测试 | ⏳ | AI Assistant | - |
| 低 | 添加管理员内容审核工作流（评论默认 pending + DB 策略） | ⏳ | AI Assistant | - |
| 低 | 添加服务端限流 / 反垃圾基础防护 | ⏳ | AI Assistant | - |
| 低 | Telegram 真实登录桥接（文章评论 GitHub/Telegram 入口） | 📋 Backlog | - | - |
| 低 | 添加 CI workflow（PR 时自动运行 `pnpm test` + `pnpm build`） | 📋 Backlog | - | - |

## 本次反思

- 仅仅做全局找替换色的“表面换色皮肤”无法建立健壮的UI体验；通过严谨的前端设计系统方法（Coverage Audit -> Roles -> Mapping -> Implementation）将颜色收敛至 Semantic Roles，能够彻底根绝散落在代码角落里的遗留白/黑和随意混合色。并且在切换底层 Token 体系时，保留旧变量 Alias 是平稳重构并保持 E2E 绿灯的关键。
- 进度条这类细线型反馈组件，代码层“存在并在更新”不等于用户层“可感知”；在深色顶栏上，`3px + 低透明度` 足以让功能变成近似不可见。
- 这轮 follow-up 说明“语义配色是否成立”不能只看 token 文件，必须继续检查最终覆盖层有没有残留逃逸色值；header/进度条里那套临时蓝色一旦没收口，整站语义就会被冲掉。
- 顶部条从“浮条常态”改回“完整顶条常态”后，最容易漏掉的是滚动态内部内容宽度同步缩小；只缩外层容器、不缩内部 shell，会产生肉眼可见的假收缩。
- 这次重设计再次证明，主题系统如果不先统一 token 语义，后续首页、卡片、文章页只会变成局部修补；先收敛 foundation/semantic/reading tokens，后续页面细化才有一致基线。
- 文章页 mobile overflow 最后不是大布局没折叠，而是旧的 inline code `white-space: nowrap` 残留导致文档宽度被撑破；这种问题需要用真实 viewport 下的“最宽元素”排查，不能只盯 grid。
- 下载目录里的实际代码与仓库当前工作区不一致，直接覆盖会把仓库推进到不可验证状态；先做保留 `.git` 的源码同步，再跑校验是必要的。
- 这次同步暴露了一个真实行为回归：文章页丢失 `ParagraphComments` 挂载，导致评论相关 E2E 失败。已在提交前恢复，避免把已知坏状态推上远端。
- 当前仓库已经用新的源码快照更新，并通过 `pnpm test`、`pnpm build`、`pnpm test:e2e` 完成验证。
- 顶部条的观感问题不能只看 CSS 数值，需要结合真实滚动状态截图验证；这次调整同时处理了 header 容器宽度、内容分布和滚动态按钮压缩，效果才接近参考图。
- 当用户要求“像素级靠近”时，只改宽度不够，图标语言、导航留白和交互反馈也要一起收敛；这次把主题按钮换成 SVG、补上当前导航态和搜索快捷键后，顶部条才从“样式修补”变成完整 UX 调整。
- 这轮进一步确认了一个边界：如果用户感知到“整体太大”，就不能只盯着 `scale()`，必须把常态尺寸和收缩态尺寸一起重定，否则视觉上仍会觉得像同一条大 header 只是略缩了一点。
- 全站 UI 精修最怕只在单页局部修补；这次用 surface token、文章页最终覆盖和新增 E2E 约束一起落地，才把“更精致”从主观感受变成可持续维护的样式基线。
- 这次 follow-up 说明阅读页的版式权重比单个组件更重要：只做颜色或圆角调整不够，header 的 resting/scrolled 两种状态、正文是否被卡片化、TOC 的数字对齐和进度条位置都会直接改变沉浸感。
- 进度条这种细节不能只看“滚动后宽度有没有变”，还要看它的起算区间是否符合阅读预期；这次把计算从正文块改为整篇阅读容器后，用户感知上的“没跟随”问题才真正解决。
- 这次问题的核心不是“目录再调大一点”这么简单，而是 `article.css` 里旧的 tri-layout 规则比最终覆盖层优先级更高，导致后面的 TOC 放大样式根本没生效；以后遇到“改了 CSS 但页面像没变”的情况，应该先验证 specificity 和实际 computed style。
- 这次继续暴露了另一个常见误区：进度条“逻辑不对”未必是百分比公式错了，往往是几何绑定对象错了。这里真正的断点是进度条还停留在页面顶部，而 header 已经变成收缩浮层；再加上文章页 header 的自动隐藏，视觉上就会被理解成“没有跟着滚动走”。
