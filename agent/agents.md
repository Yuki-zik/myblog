# 🤖 AI 代理执行指南 (AGENTS.md)

本指南规范了 AI 助手在此代码库中的行为边界、代码风格和测试要求。请所有介入本项目的 AI 遵循以下准则。

## 1. 行为边界 (Rules of Engagement)

### 🟢 Always (必须执行)
- **文档优先**: 任何功能更改必须优先构思架构，更新 `agent/project.md`（如有架构变动）和 `agent/tasks.md`。
- **记录动机**: 所有的代码提交或重大调整必须在 `agent/timeline.md` 顶部记录，而且绝不省略“修改动机”一栏。
- **先测后上**: 在修改现有功能或添加新模块前，必须先编写测试 (`vitest` 或 `playwright`)，再编写实现代码，保证 TDD 思维。
- **最小化改动**: 遵循“单一职责”，每次任务只修改必要文件，不产生多余或推测性的代码。
- **保持双向沟通**: 重大修改前必须经过用户的显式批准。

### 🟡 Ask (必须询问)
- **架构变更**: 引进新的核心库、重构核心 Astro 配置或改变 Supabase RLS 策略前，必须先生成计划请求复查。
- **不可恢复操作**: 删除大型遗留代码块或清空旧有数据结构。
- **重大设计不明确**: 例如某个边界条件（Comment 太长、并发冲突等）尚未明确。

### 🔴 Never (禁止行为)
- **隐式造轮子**: 不要写已存在相同功能的实用函数，优先复用 `src/lib/`。
- **隐瞒未通过的测试**: 运行测试如果失败，绝对不能直接提交，必须先 debug 或告知用户。
- **跨模块污染**: 禁止直接在纯展示 Astro 组件里写数据库原生 API，全部走 `src/lib/comments/api.ts`。

## 2. 代码风格示例

### 2.1 React (评论系统组件)
```tsx
// Always extract business logic from pure UI functions
// Never write raw Supabase calls here
import { createComment } from '@/lib/comments/api';

export function CommentNode({ anchorId }: { anchorId: string }) {
  // Use optimistic UI logic
}
```

### 2.2 测试要求
- **单元测试**: 对每个 `src/lib/` 下的函数使用 `vitest`。
- **E2E测试**: 涉及匿名登录流的操作必须过 Playwright E2E。

## 3. 常用运行命令
- 启动本地开发: `pnpm dev`
- 运行单元测试: `pnpm test`
- 运行E2E测试: `pnpm test:e2e`
- 全局打包检查: `pnpm build`
