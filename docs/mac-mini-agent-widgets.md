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
