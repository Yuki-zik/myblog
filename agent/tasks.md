# 任务清单

| 优先级 | 任务 | 状态 | 负责人 | 截止 |
|---|---|---|---|---|
| 高 | 初始化 `agent/` 目录结构和标准文档 | ✅ | AI Assistant | 2026-02-21 |
| 高 | 将原 `AGENT_CONTEXT.md` 内容迁移至标准规范 (`Agents.md`) | ✅ | AI Assistant | 2026-02-21 |
| 高 | 新增作者档案配置和文章作者解析，文章页展示作者元数据 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增 Header 即时搜索（posts/topics/concepts）与 `/search-index.json` | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增文章目录（H2/H3）：桌面端固定 + 移动端折叠，含当前章节高亮 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增 `/author` 页面及顶部导航入口 | ✅ | AI Assistant | 2026-02-22 |
| 高 | 新增文章底部评论系统（独立 Supabase 表、Markdown 渲染、GitHub 登录入口） | ✅ | AI Assistant | 2026-02-22 |
| 高 | 使用 `/Users/a-znk/Downloads/myblog-main` 同步本地仓库源码并更新 GitHub | ✅ | AI Assistant | 2026-03-12 |
| 高 | 修复同步后文章页丢失段落评论挂载导致的 E2E 回归 | ✅ | AI Assistant | 2026-03-12 |
| 中 | 分析现有代码与文档是否一致 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 根据 README.md 和需求总结界面设计并更新 README 文档 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 为归档页（/archives）添加海报横幅 | ✅ | AI Assistant | 2026-02-22 |
| 中 | 修复 agent/ 文档结构问题（timeline 格式、codex 重写、README 死链等） | ✅ | AI Assistant | 2026-03-03 |
| 中 | 制定 Figma 先行的 UI/UX 设计到代码落地工作流 | ✅ | AI Assistant | 2026-03-09 |
| 中 | 将现有博客全站 UI（desktop/mobile + light/dark）复现到 Figma 文件 | ✅ | AI Assistant | 2026-03-09 |
| 中 | 向现有 Figma 文件追加 `00 Foundations` / `01 Components` / `02~05` 结构页 | ✅ | AI Assistant | 2026-03-09 |
| 中 | 在 Figma 内手工重命名现有页面、归组并抽取真实可复用组件实例 | ⏳ | AI Assistant | - |
| 中 | 为搜索 / TOC / author 页面补充 E2E 测试 | ⏳ | AI Assistant | - |
| 低 | 添加管理员内容审核工作流（评论默认 pending + DB 策略） | ⏳ | AI Assistant | - |
| 低 | 添加服务端限流 / 反垃圾基础防护 | ⏳ | AI Assistant | - |
| 低 | Telegram 真实登录桥接（文章评论 GitHub/Telegram 入口） | 📋 Backlog | - | - |
| 低 | 添加 CI workflow（PR 时自动运行 `pnpm test` + `pnpm build`） | 📋 Backlog | - | - |

## 本次反思

- 下载目录里的实际代码与仓库当前工作区不一致，直接覆盖会把仓库推进到不可验证状态；先做保留 `.git` 的源码同步，再跑校验是必要的。
- 这次同步暴露了一个真实行为回归：文章页丢失 `ParagraphComments` 挂载，导致评论相关 E2E 失败。已在提交前恢复，避免把已知坏状态推上远端。
- 当前仓库已经用新的源码快照更新，并通过 `pnpm test`、`pnpm build`、`pnpm test:e2e` 完成验证。
