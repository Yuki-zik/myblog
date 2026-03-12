<!--
 * @Author: Yuki-zik 226004241@nbu.edu.cn
 * @Date: 2026-02-21 18:48:54
 * @LastEditors: Yuki-zik 226004241@nbu.edu.cn
 * @LastEditTime: 2026-03-12 21:41:26
 * @FilePath: \myblog\agent\tasks.md
 * @Description: 
 * 
 * Copyright (c) 2026 by ${git_name_email}, All Rights Reserved. 
-->
# 浠诲姟娓呭崟

| 浼樺厛绾? | 浠诲姟                                                                    | 鐘舵€?    | 璐熻矗浜?    | 鎴       |
| --------- | ------------------------------------------------------------------------- | --------- | ------------ | ---------- |
| 高        | 初始化 `agent/` 目录结构和标准文档                                        | ✅         | AI Assistant | 2026-02-21 |
| 高        | 将原 `AGENT_CONTEXT.md` 内容迁移至标准规范 (`Agents.md`)                  | ✅         | AI Assistant | 2026-02-21 |
| 高        | 新增作者档案配置和文章作者解析，文章页展示作者元数据                      | ✅         | AI Assistant | 2026-02-22 |
| 高        | 新增 Header 即时搜索（posts/topics/concepts）与 `/search-index.json`      | ✅         | AI Assistant | 2026-02-22 |
| 高        | 新增文章目录（H2/H3）：桌面端固定 + 移动端折叠，含当前章节高亮            | ✅         | AI Assistant | 2026-02-22 |
| 高        | 新增 `/author` 页面及顶部导航入口                                         | ✅         | AI Assistant | 2026-02-22 |
| 高        | 新增文章底部评论系统（独立 Supabase 表、Markdown 渲染、GitHub 登录入口）  | ✅         | AI Assistant | 2026-02-22 |
| 中        | 分析现有代码与文档是否一致                                                | ✅         | AI Assistant | 2026-02-22 |
| 中        | 根据 README.md 和需求总结界面设计并更新 README 文档                       | ✅         | AI Assistant | 2026-02-22 |
| 中        | 为归档页（/archives）添加海报横幅                                         | ✅         | AI Assistant | 2026-02-22 |
| 中        | 修复 agent/ 文档结构问题（timeline 格式、codex 重写、README 死链等）      | ✅         | AI Assistant | 2026-03-03 |
| 中        | 制定 Figma 先行的 UI/UX 设计到代码落地工作流                              | ✅         | AI Assistant | 2026-03-09 |
| 中        | 将现有博客全站 UI（desktop/mobile + light/dark）复现到 Figma 文件         | ✅         | AI Assistant | 2026-03-09 |
| 中        | 向现有 Figma 文件追加 `00 Foundations` / `01 Components` / `02~05` 结构页 | ✅         | AI Assistant | 2026-03-09 |
| 中        | 在 Figma 内手工重命名现有页面、归组并抽取真实可复用组件实例               | ⏳         | AI Assistant | -          |
| 中        | 为搜索 / TOC / author 页面补充 E2E 测试                                   | ⏳         | AI Assistant | -          |
| 低        | 添加管理员内容审核工作流（评论默认 pending + DB 策略）                    | ⏳         | AI Assistant | -          |
| 低        | 添加服务端限流 / 反垃圾基础防护                                           | ⏳         | AI Assistant | -          |
| 低        | Telegram 真实登录桥接（文章评论 GitHub/Telegram 入口）                    | 📋 Backlog | -            | -          |
| 低        | 添加 CI workflow（PR 时自动运行 pnpm test + pnpm build）                  | 📋 Backlog | -            | -          |

## 本次反思
| Priority | Task                                                                             | Status | Owner        | Due        |
| -------- | -------------------------------------------------------------------------------- | ------ | ------------ | ---------- |
| High     | Add default author profile + post author resolver and show author in post detail | Done   | AI Assistant | 2026-02-22 |
| High     | Add header instant search (posts/topics/concepts) with /search-index.json        | Done   | AI Assistant | 2026-02-22 |
| High     | Add post TOC (H2/H3) with sticky desktop and collapsible mobile UI               | Done   | AI Assistant | 2026-02-22 |
| High     | Add /author page and header navigation entry                                     | Done   | AI Assistant | 2026-02-22 |
| Medium   | Add E2E tests for new search / TOC / author page flows                           | Todo   | AI Assistant | -          |
| High     | Audit and generate docs/design-style-guide.md with evidence                      | [x]    | AI Assistant | 2026-02-26 |

| High | Add article-level bottom comments (screenshot-style UI, markdown, GitHub login entry, separate Supabase table) | Done | AI Assistant | 2026-02-22 |
| Medium | Telegram real login bridge for article comments | Todo | AI Assistant | - |
| High | Audit frontend design system from source and add `design-style-guide.md` with file-based evidence | Done | AI Assistant | 2026-02-23 |
| High | Fix P0 style issues from design audit (keyboard focus visibility + article markdown base typography) | Done | AI Assistant | 2026-02-23 |
| High | Implement scholarly article reading layout (wide rail + notes/refs/figures + rail paragraph comments) | Done | AI Assistant | 2026-02-23 |

| High | Refine post detail to Tufte-style reading page (continuous marginalia + minimal header + collapsed article comments) | Done | AI Assistant | 2026-02-23 |

| High | Add 3-column Tufte post layout (left TOC / center content / right marginalia) + GFM footnote styling + CJK/Latin typography tuning | Done | AI Assistant | 2026-02-24 |
| High | Flatten right marginalia into unlabeled stream items with per-item text labels; retune tri-column proportions/font sizes; extend sample post for visual review | Done | AI Assistant | 2026-02-24 |
| High | Remove independent right-rail scrolling and improve marginalia information hierarchy/readability | Done | AI Assistant | 2026-02-24 |
| Medium | Simplify marginalia annotation formatting (remove note titles/locator text) and clarify footnote behavior rationale | Done | AI Assistant | 2026-02-24 |
| High | Map Markdown GFM footnotes into right marginalia rail on post pages (remove duplicated bottom footnote block) | Done | AI Assistant | 2026-02-24 |
| High | Add footnote-ref click highlight in right marginalia and anchor-order approximate footnote distribution; restyle footnote item as `number + text` | Done | AI Assistant | 2026-02-24 |
| Medium | Unify right-rail annotations and references to compact `number + text` rows and re-verify footnote flash highlight behavior | Done | AI Assistant | 2026-02-25 |
| High | Simplify right marginalia to cleaner note rows (sample reduced to four info items), add bidirectional footnote hover highlight, and retune right-rail type/image spacing | Done | AI Assistant | 2026-02-25 |
| High | Convert right marginalia to floating note bubbles aligned to body anchors, unify annotation markers as in-body superscripts, and fix archive thumbnail crop ratio | Done | AI Assistant | 2026-02-25 |
| High | Resolve git merge conflicts and push main to origin | ✅ | AI Assistant | 2026-03-12 |

- Session review (2026-03-12): resolved merge conflicts in `agent/*` and completed the push flow with audit updates.
