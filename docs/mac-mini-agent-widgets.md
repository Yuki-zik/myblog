# Agent 挂件 · Mac mini 开发

## 工作副本

- 主开发机：Mac mini（arm64，macOS 26.3.1）。
- 项目目录：`/Users/a-znk/Code/myblog-agent-widgets`。
- GitHub：`https://github.com/Yuki-zik/myblog`。
- 改版分支：`feat/agent-widgets-mini-20261024`。
- 起点：`b6afd5327c2fb48e81211e6632ddd653d70a0b51`，文件树 `2d378afef7557119359d8e44c67f013a52dfc44c`。源来自该固定提交，完整Git对象与工作树已核对。既有版本与截图保留。
- 环境：Node 22.22.0，pnpm 10.30.1；`pnpm install --frozen-lockfile --offline` 已成功复原625项依赖。没有新增运行时包。

## 继续开发

```bash
cd /Users/a-znk/Code/myblog-agent-widgets
pnpm dev --host 127.0.0.1 --port 4327
```

在 Mac mini 本机访问终端输出的地址，页面路径 `/agents`。远程机器的 `127.0.0.1` 不等于本机；跨设备查看应使用已有受控转发，或正式站地址。

默认 Playwright 配置独占4173端口、先构建后测试。与其他博客任务并行时，为自己的验证生成忽略的临时配置，使用空闲4187端口；保留 production build 与 `reuseExistingServer: false`。勿接管其他任务的预览进程。

## 模块

- `AgentInstrumentDesk.astro` 只负责编排四个独立挂件。
- `components/agents/instruments/` 中每个组件负责自己的语义结构与服务端实测值。
- `agent-instruments.css` 负责各自外形和交互状态，`agent-observatory.css` 负责页面、折叠资料和首页轻入口。
- `UiControllers.astro` 初始化原生控件；SSR 数值与交互示意分离，无数据写入或自动采集。
- `src/lib/agents/observatory.ts` 和公开数据格式保持原有口径。分钟轨道不能从每日峰值反推。

## 迁移记录

2026-10-24 完成固定版本源码恢复、Git文件树核对及冻结依赖安装。原生Git最初没有读取macOS系统代理；后续操作复用系统已配置代理到当前Git进程，没有更改代理服务、TLS校验或网络权限，也没有把代理地址/凭据写进项目。

本轮最终构建、交互测试与截图见发布回执和 `docs/visual-history/`。

## 发布与继续开发

2026-10-25，PR #52 已发布到 https://a-znk.com/agents（应用提交3f66cb4）。当前工作区已切换至跟踪origin/main的main；原feat/agent-widgets-mini-20261024分支保留。164项单测/351项浏览器检查及生产域鼠标、键盘、触屏、深浅色复核通过。自有4187测试服务已退出；后续直接在本目录修改对应独立组件，并按现有命令重新预览。

## 2026-10-25 · 历史票据继续开发

当前本地工作分支为 `feat/agent-history-20261025`，源码与公开 PR #57 的发布文件树一致。该轮基线从官方 main `33e649b` 的 Git blob API 核验同步；本地基线快照为 `e64ada6`，功能提交为 `4eb67d0`，公开测试头为 `8c09733`，发布为 `e5c9c0c`。本地快照提交与公开提交的父历史不同，不要把本地同名分支直接强制推到远端。正常 Git HTTPS 传输恢复后，从 GitHub 获取真实 main，再通过正常分支接续；历史分支和本地文件均已保留。

GitHub官方API传输经现有 gh 的 Yuki-zik 账号完成，未改系统代理、账户权限或凭据。12份公开变更归并六个历史目标；数据与后续维护见 docs/agent-history.md。生产原图和回执位于 docs/visual-history/2026-10-25-agent-history/production。归档提交只包含文档和图像，应用与数据保持已通过179单测/390浏览器及正式回查的版本。
