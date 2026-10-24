# 中英双语发布与维护

## 路由与内容边界

中文内容保留原有 URL；英文入口为 `/en`。现有 19 个公开页面均有英文版本：6 个固定入口（首页、作者、论文、主题、归档、漫游），以及 4 篇文章、2 篇论文、5 个主题、2 个概念。英文是构建时生成的完整 HTML，不依赖访问者的浏览器翻译或运行时翻译 API。

两种语言共享页面和组件，不复制视觉模板。中文内容仍位于 `src/content/{posts,papers,topics,concepts}`；英文位于 `src/content/en/{posts,papers,topics,concepts}`，同一内容的文件名和 id 必须一致。`src/content.config.ts` 通过同一 schema 工厂约束两种语言。

全站 UI、作者简介及历史图版说明的英文映射位于 `src/lib/i18n/en.json`。新增可见文案须同步补上英文。正文标题及段落写入英文 Markdown，避免用客户端替换原文。

## 翻译与来源

翻译标题、摘要、正文、主题说明、图注与替代文本；保留作者、DOI、期刊、发表日期、引用链接、原图、数值、公式及代码。不得将尚未发表项目改写为已发表成果，也不得扩大原文的实验结论。英文文件中的日期保持显式引号字符串。

图片复用原资产，例如英文文章封面引用 `../../posts/covers/example.svg`。不重新生成论文原图或修改其标签；英文图注帮助阅读原始图版。

脚注键（`note-*`、`ref-*`）保留，章节标题翻译会改变 heading slug，因此 `figures[].anchorId` 应对齐英文实际的 `sectionSlug::pN`。段落、脚注和 scholar rail 的定位链保持原有约定。

## 链接、搜索与评论

`localizePath` 只转换站内内容页及对应 RSS/搜索/设计说明端点，不改外站、图片、API 或纯片段链接。英文索引、主题、知识图谱及相关文章继续指向英文页面。

语言按钮位于搜索旁，跳转到当前内容的对应版本。所有链接为真实 anchor，无 JavaScript 时仍可使用。不做 IP、浏览器语言或 Cookie 强制跳转。

英文搜索索引为 `/en/search-index.json`，英文 RSS 为 `/en/rss.xml`。Waline 使用英文界面，但两种语言仍传递同一个原始文章 path，以复用既有评论线程；不迁移评论、不改变后端。

## SEO 规则

每个中英文页面都有自己的 canonical、标题、描述和 HTML lang。已有双方版本时，双方同时声明 `zh-CN`、`en`、`x-default`，其中默认入口为原中文 URL。译文使用自己的 canonical，不能统一指向中文。

`getTranslatedPaths()` 只接受源内容和译文都已发布的内容，不为未翻译或 draft 内容生成虚假的 hreflang。索引链接、翻译缺失和交叉对应由构建检查发现。新增中文内容如暂时不翻译，保留原文；准备英文索引关联内容时一并补齐对应主题/概念。

主域仍为 `https://a-znk.com`，旧域重定向和所有权文件不动。`/sitemap.xml` 同时列出中英文 HTML 页面，与 Astro sitemap index 保持一致。英文分享图和结构化数据也对应当前语言；Person/WebSite 的全站身份标识保持稳定。

英文 Markdown 镜像 `/en/posts/*.md`、`/en/design.md` 与两种搜索 JSON 继续 noindex；可阅读 HTML 保持可索引。IndexNow 能识别英文内容变更；原文和译文共用封面变更时提交双方页面。提交成功与搜索引擎实际收录、排名分别验收。

## 发布前验证

```sh
pnpm test
pnpm papers:check
SITE_URL=https://a-znk.com pnpm build
pnpm seo:check-build
pnpm seo:test
pnpm i18n:check
pnpm exec playwright test
```

`pnpm i18n:check` 检查每个英文 HTML 的 lang、自指 canonical、双向 hreflang、对应页切换、可见中文遗漏、站内英文链接、OG 资产、搜索与 RSS。它已接入 CI。

`tests/e2e/bilingual.spec.ts` 覆盖 320/360/390/768/1440px、对应文章切换、英文搜索、图谱、禁用 JavaScript 阅读、深色模式和 spoiler；原有中文导航、目录、评论、图片查看器及布局测试继续运行。

发布后需回查正式域的英文页面、sitemap、页面语言与对应链接。Vercel 主站与 VPS 镜像是两个部署边界，未验证镜像时不得宣称同步完成。

## 本次发布的依赖安全修复

2026-10-24 的 CI 阻断来自既有锁文件中的新公开漏洞，双语单测、构建和 SEO 检查在该步骤之前已经通过。为保留发布门槛，升级 Astro 到 7.3.2、匹配的 markdown-remark 到 7.3.0，并将 Zod 4.x 与 undici 8.x 限制到已修复版本。评论服务仅更新 DOMPurify、Nodemailer、ip-address 的兼容修复版本；不变更 API、数据库、环境变量或已有忽略清单。

官方安全记录：
- https://github.com/advisories/GHSA-98hj-9722-w3j8
- https://github.com/advisories/GHSA-mrhx-c7xc-m3w5
- https://github.com/advisories/GHSA-xjj6-f33q-929c
- https://github.com/advisories/GHSA-cg2g-xh64-v4q7
- https://github.com/advisories/GHSA-rxp7-6hxx-x8q5
- https://github.com/advisories/GHSA-8c8m-p3m8-cjg8

两套生产依赖审计在原有策略下退出码均为 0；仍有低等级报告及此前已有的审核例外，不宣称依赖零漏洞。补丁后的独立环境中，153 单测、完整构建、双语/SEO 检查和 Waline handler/输入校验/日志隔离 smoke 已通过；完整浏览器回归由 PR CI 再执行。


## 正式发布验收 · 2026-10-24

功能版本：`8d04be4140d7384e983423407e31a9af18fcfa61`（PR #49，2026-10-24 14:41:36 UTC 合并）。

- Vercel `myblog` 与 `waline` 正式部署均已成功。
- 正式域 https://a-znk.com ：19 个中文 + 19 个英文 HTML 全部 HTTP 200；逐页检查 lang、自指 canonical、zh-CN/en/x-default、同页语言切换及 indexability，失败 0。
- `/en/search-index.json` HTTP 200，共13条英文记录，所有结果指向英文路径，响应 noindex；英文 RSS 为 en、Markdown 镜像 noindex/follow。
- 最终CI：153单元测试、324浏览器测试全部通过，论文来源、38页SEO、19对语言页、评论smoke、两套既有策略安全审计通过。
- 全部19个英文页在390/1440px的38组独立浏览器检查无横向溢出或脚本错误；320px导航及无JS阅读/切换另有E2E覆盖。
- 发布后的 Search engine discovery（run 40103729528）已获 IndexNow HTTP 200，接受38个canonical URLs；百度提交清单已生成。未将提交成功计为搜索引擎实际收录。
- 既有中文URL和评论thread path保留；新文章仍需配对英文正文，不会在后台自动翻译。维护流程见 `docs/bilingual-publishing.md`。

最终CI：https://github.com/Yuki-zik/myblog/actions/runs/40103056885
搜索发现通知：https://github.com/Yuki-zik/myblog/actions/runs/40103729528
