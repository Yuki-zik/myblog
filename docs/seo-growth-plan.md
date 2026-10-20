# 中文搜索发现与内容增长：a-znk.com

核查日期：2026-10-20。主站：<https://a-znk.com>。保留既有视觉与路由，内容变更必须有可核验来源。

## 已确认的技术基础

- 首页与公开文章返回 200；已存在 canonical、title、description、zh-CN 和 JSON-LD。
- 公开 URL 由 Astro sitemap 自动生成，2026-10-20 基线为 19 条。
- `robots.txt` 开放抓取，保留对内部 search-index.json 的阻止及 Markdown 原文镜像的 noindex。
- `/sitemap.xml` 在 Vercel 上重写到自动生成的 `/sitemap-0.xml`，并在 robots 中宣传直链；已有的 `/sitemap-index.xml` 继续保留供原站长工具使用。
- Sitemap 中文章/论文的 `lastmod` 取明确的 frontmatter 日期，避免把每次构建时间当成全部内容更新时间。
- IndexNow 验证文件 `/indexnow-key.txt`（公开所有权证明，非账号密码）。Main 分支内容变化后由 GitHub Actions 增量通知支持 IndexNow 的引擎；可手动触发全站首次通知。
- 每周一北京时间 11:00 的 GitHub Actions 测试直达 Sitemap/robots、HTML 标题、canonical、语种、noindex、404、IndexNow 所有权文件。工作流执行结果只代表技术可抓取性，不代表已经收录。

## 手工一次性站点验证 / 提交

| 引擎 | 平台 | 操作 | 现实约束 |
|---|---|---|---|
| 百度 | https://ziyuan.baidu.com/ | 登录站长账号，添加并验证 https://a-znk.com，提交 https://a-znk.com/sitemap.xml；记录抓取与索引报告 | 登录、人机校验、域名验证不可由公开 HTTP 请求代替 |
| Bing | https://www.bing.com/webmasters/ | 添加 a-znk.com，使用 HTML 文件/DNS 验证，提交 sitemap.xml，检查 IndexNow 记录 | IndexNow 提交可独立先完成 |
| 搜狗 | https://zhanzhang.sogou.com/ | 先添加并验证网站；确认账户是否获得 Sitemap 权限，再提交 sitemap.xml | 官方文档表明 Sitemap 工具采用邀请制；没有权限可联系 zzpt@tencent.com |
| 360 | https://info.so.360.cn/site_submit.html | 提交首页 URL，完成验证码和站长验证；若提供 Sitemap 入口再提交 | 需要网页验证 |
| Google | https://search.google.com/search-console | 核对新自定义域名的独立 URL-prefix 或 Domain property；提交 sitemap-index.xml，检查 URL 检测 | 旧 vercel.app hostname 的已验证属性不会自动证明新域名已验证 |

公开 `site:a-znk.com` 查询（2026-10-20）：搜狗显示 0 条；360 显示无相关结果；百度弹出安全验证，Bing 的公开结果存在查询漂移。真实收录数量以已验证站长平台的索引报告为准，不能由可抓取测试推断。

## 使用和验证

- 新内容按平常工作流合并到 `main` 并由 Vercel 发布；`seo-indexnow.yml` 自动提交变更涉及的页面。
- 在 GitHub Actions 手动运行 `IndexNow change notifications` 可对当前在线 Sitemap 全量通知一次；切勿频繁反复提交未变更页面。
- 在 GitHub Actions 手动运行 `Weekly SEO technical health` 检查全站访问状况。
- 本地单元测试：`node --test scripts/seo/*.check.mjs`。
- 完整静态构建后：`node scripts/seo/validate-build.mjs`。
- 线上技术检测：`node scripts/seo/audit.mjs`。服务商返回 200/202 只代表提交已接收，后续索引仍由搜索引擎独立决定。

## 内容建设顺序

| 优先级 | 文章候选标题 / 核心关键词 | 对应站内资产 | 完稿验收 |
|---|---|---|---|
| P1 | LLM Hidden State Probe 如何做事实错误检测？ | 事实错误研究 /posts/，论文索引 /papers | 数据集与标签界定、泄漏控制、复现实验、限制 |
| P1 | 跨模型表征对齐：GPA/GCPA、Procrustes 与共享潜在空间 | /topics/agent-engineering（发布后可拆独立主题） | 原论文逐条引用、区别对齐与行为迁移的证据 |
| P1 | Agent 安全监控为何需要 Action、CoT 和 Postcondition 多视角？ | /topics/agent-engineering | 监控威胁模型、低误报、遗漏攻击 vs 实施攻击的界定 |
| P2 | 多模态模型指纹与来源锚点（SteerPrint） | /papers | 仅在公开结果和许可范围内发布；避免提前披露未公开实验 |
| P2 | Whisper 多语种语音隐私：DUAP 的动机与方法 | /papers/duap-multilingual-speech-privacy | 基于已发表论文，解释方法/实验/限制，链接 DOI |
| P2 | 从 Astro 到 Waline：可测试的个人技术博客架构 | 现有博客设计说明书 | 源码与现有测试为证据，关联技术仓库 |

每篇内容都应有独立明确的 H1、150 字左右的自然语言摘要、主题相关的标题、可靠引用、本站内链以及必要时的图表。对尚未公开的研究，先准备稿件，正式公开前执行作者内容审查。

## 收录与效果的有效指标

每周记录各平台的：已发现/已索引 URL 数、覆盖率、抓取失败类型、品牌词可见性、自然流量与具体落地页。技术巡检与搜索曝光分开记录，避免将 200 状态或 IndexNow API 接受误记为索引完成。

中国大陆可达性应以大陆独立网络节点的 DNS/TLS/HTTP 与耗时实测为准；单一美国、香港或 VPS 的 200 状态不足以证明大陆访问稳定。主域仍为唯一 canonical，VPS 镜像维持 noindex 以减少重复内容。
