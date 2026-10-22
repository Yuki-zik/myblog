# 阅读侧目录：当前章节的底部留白

动机：用户截图显示当前标题与橙色标记贴近窗口底部。旧行为只在整个条目越界时滚动，且一级条目包含整组子目录。现在以当前链接本身为目标，在接近边缘时移动目录内部滚动位置，并用CSS scroll-padding定义舒适区和同样大小的尾部空间。

| 版本 | 来源 / 状态 |
|---|---|
| v0 | 正式站30e5ae1，修复前；3个窗口高度的Guidelines/References |
| v1 | 修复后初次截图；References的指标可能仍在页面滚动过渡中，保留为过程证据 |
| v2 | 同一实现，等待页面/目录/标记几何稳定再采集；本地最终视觉依据 |
| production | PR #46，8ba7ef1，正式站；6张浅色/深色截图已逐张审查 |

1440px宽，600/760px高浅色和1000px高深色，分别截图当前Guidelines与最终References，共18张。只修改侧目录滚动跟随，不改变正文激活规则、锚点、移动目录和折叠状态。当前链接的目录底部间距为96.12px（600高）或112.12px（760/1000高），末项也能保持相同间距；文章末尾目录随阅读容器向上收离页脚。

旧版760/1000px安全区断言先失败；600px测试最初的正文定位过低，已按短窗口修正测试定位。149单测、首轮12项相关E2E及最终11项目录回归通过，包括真实窗口缩短、收起展开、从末尾返回Typography、两篇目录吸顶与手机目录选择。缩放/展开后的目录自滚动不改变正文scrollY，点击仍准确落在70–180px阅读区域。

实现：`src/components/article/toc-client.ts` 与 `TocSidebar.astro`。回归：`tests/e2e/toc-reading-inset.spec.ts`。

正式[CI39734138391](https://github.com/Yuki-zik/myblog/actions/runs/39734138391)149单测/315 E2E均直接通过，PR #46合并为8ba7ef1，两套Production成功。线上9状态覆盖Components整组一级标题、Guidelines和最后References；目录底部安全区符合要求，后两章间距96.12/112.12px，内部调整与可见按钮的收起展开不牵动正文；返回Typography的稳定落点119.91px，0页面脚本错误。19页SEO和2张论文OG通过。

线上脚本首轮在页尾尝试操作已随正文边界移出视口的折叠按钮，自动化为找到按钮先滚动了整页；改为回到按钮可见的阅读状态后验证，页面源文件未变化。6张正式截图均逐张通过视觉检查；与本地字节不同的记录保留在比较清单中。完整参数见 [production-checks.json](production-checks.json)，交互结果见 [production-functional.json](production-functional.json)。
