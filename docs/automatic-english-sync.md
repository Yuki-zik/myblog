# 中文唯一编辑源：英文自动同步

## 作者日常操作

继续新增或修改 `src/content/posts/*.md`；论文、主题和概念分别在 `papers`、`topics`、`concepts`。保留既有中文发布流程。中文提交到 `main` 后，Mac mini 的专用进程每五分钟检查一次源版本。没有内容变化时不调用模型。

新文章自动生成 `src/content/en/<collection>/<同名文件>.md`。现有中文修改后，旧英文页面立即显示「English update pending」及中文原稿链接，中文无需等待翻译。新译文完成结构校验、语义复核和完整 CI 后，通过单独的翻译 PR 发布。翻译未完成时不制造不存在的英文 URL。

初始 13 份已发布译文被明确登记为 `existing-reviewed`。这只记录采用现有版本，并非重新运行模型或证明语义零错误。后续由模型生成的译文会记录真实 provider、model、源哈希、译文哈希、翻译时间、提示词和术语表版本。

## 实际执行端与费用边界

本方案使用 **Mac mini 已登录的 Codex CLI**。本机后台进程由 launchd 启动，不依赖打开 ChatGPT 对话、终端窗口或本地 Codex 聊天窗口。Mac mini 离线、睡眠、Codex 登录失效或额度耗尽时，翻译不会运行；恢复后继续检查。不能宣称脱离设备运行的云服务。

模型请求使用现有 Codex 登录权限/用量，未配置另一把计费 API Key。无变化的轮询只读取 GitHub。默认每次最多 24 次翻译/复核请求、每天最多 6 个有变化的处理批次；失败至少间隔一小时重试，异常通过一条可更新的 GitHub issue 提醒。请求上限不等于费用承诺。

GitHub Models 官方文档已宣布 2026-07-30 完全退役，不能把它作为免费长期默认后端。代码保留显式配置的 HTTPS/OpenAI-compatible provider 作为可替换适配器，但本次实际启用的是本地 Codex，不向 GitHub 上传任何登录材料。

## 数据与发布边界

控制进程只从已合入 `main` 的仓库拉取四类中文/英文 Markdown 和 `src/data/translation-state.json`；不会执行远程仓库的新脚本、工作流、AGENTS 或依赖安装命令。运行的是安装时固定的本地 translator 版本。升级执行器需要显式重装，不在轮询中自动执行新代码。

模型位于独立临时目录，read-only，无 shell、浏览器、MCP、插件、子 Agent 或 Web 搜索工具。正文中的「执行命令」「读取密码」等文字均按待翻译资料处理。GitHub token/API key 从模型子进程环境剔除，已有 Codex 登录保留在本机原来的权限受限位置。

只有控制器负责 GitHub 写入。自动 PR 的文件白名单为 `src/content/en/{posts,papers,topics,concepts}/**/*.md` 与译文状态清单。它不写中文、不修改脚本、工作流、数据库、DNS 或密钥。

自动合并必须同时满足：PR 仍为本进程记录的精确 head；`main` 仍为翻译所依据的版本；单元/构建/评论 smoke/安全检查和完整 Playwright CI 成功；Vercel 博客预览成功；全部变更符合白名单。主分支前进则关闭旧候选并重新计算；人工修改 PR head 则交给人工，不覆盖；人工关闭 PR 后不自动重新打开同一源版本。

## 翻译保护

程序解析 Markdown AST 和 YAML，只把允许翻译的文本发送给模型。代码、公式、数值、URL、DOI、作者与发表元数据、脚注键和原始引用由程序保护。文字替换后重新解析，核对结构；模型输出不能直接变成任意 Markdown/HTML。英文图注和替代文本可翻译，图片仍用原资产，不改论文原图和图内文字。

语义复核单独检查否定、条件、范围、数字和无依据的结论扩张。它能减少错误，不能保证研究内容绝对无误。失败不覆盖旧译文；英语人工改译的哈希不匹配时停止自动覆盖。

译文同页锚点、图注段落锚点自动映射；文内跨文章链接在构建时优先使用真实英文页面。有译文但没有对应章节映射时，保留可用的中文原稿链接并标明来源，避免跳进错误位置。新文章、改稿、缺译、人工覆盖冲突、删除和草稿分别测试。

将中文改为草稿或删除后，即使本机尚未轮询，构建过程也会立即排除旧英文路由、搜索、RSS 和 Markdown 镜像。worker 随后归档并删除仓库中的过期译文。

## 覆盖范围

自动内容同步覆盖四类 Markdown 正文、标题、摘要、图注等字段。组件布局/导航/作者简介等界面工程文案仍使用 `src/lib/i18n/en.json`，新增界面功能需补同一套字典并过双语 CI。观察站当前四个独立挂件、交互反馈、研究说明和下载模板已补英语；数字/来源/未记录状态共用数据，不编造实测值。

MDX、单个极长文本节点、无法映射的特殊锚点及含中文的原始脚本/复杂 HTML 等不安全情况会停止翻译并报告，中文仍可发布。图片内的中文不由正文翻译管线改写。

## 运维与暂停

本机目录：

```text
~/Library/Application Support/A-Znk/blog-english-sync/
  config.json
  state.json
  worker.log
  worker-error.log
  runtimes/<content-hash>/
~/Library/LaunchAgents/com.a-znk.blog-english-sync.plist
```

安装固定运行时但不启动：

```sh
python3 scripts/i18n/install-local-worker.py
```

明确启用或暂停：

```sh
python3 scripts/i18n/install-local-worker.py --enable
python3 scripts/i18n/install-local-worker.py --disable
```

查看状态：

```sh
python3 scripts/i18n/sync-worker.py \
  --config "$HOME/Library/Application Support/A-Znk/blog-english-sync/config.json" --status
```

只读检查 `--dry-run` 不创建 issue/PR、不关闭 PR、不合并。已有译文状态检查用 `pnpm i18n:status`。不要手工编辑 state.json 伪造模型结果；人工译文冲突需要确认后采用或显式强制更新。转为草稿/删除时，人工改译归档到本机 retired 目录，并在清单保留人工所有权；再次发布不会悄悄用机器译文替换。

## 验收命令

```sh
pnpm test
pnpm i18n:test
pnpm build
pnpm i18n:check
pnpm i18n:check-lifecycle
pnpm seo:check-build
pnpm exec playwright test
```

真实模型验收已在临时内容目录执行：首次生成及独立复核、95%→96% 中文改稿同步、无变化零模型请求、代码/公式/脚注保留、人工英文修改保护，以及草稿撤回。测试内容未发布到博客。完整发布、launchd 状态与生产回查以本次验收记录为准。

搜索平台的可抓取、IndexNow 接收和实际收录/排名分别记录。自动翻译发布会更新 sitemap、独立语言元信息和搜索索引；不承诺 Google 或百度立即收录。


## 正式启用回执 · 2026-10-25

PR #54 已发布（b4bb1cf），LaunchAgent 已启用，300秒周期的真实调度已验证。正常worker自行创建并在完整CI通过后合并PR #55（984ce1d，08:26:00 UTC）；新英文已出现在正式站。08:27服务状态current，pending及errorCode均为空。40个正式页面与两引擎20组布局状态验收通过。详细截图、原始检查记录及自动发布回执见 [本次生产验收](visual-history/2026-10-25-auto-bilingual/README.md)。
