# DUAP真实方法图与论文预览

用户提供的Fig.3以原始PNG接入，2832×1292，SHA-256 `44eb69140f27e3927d3b92c6e5acf57003df42bea26c254647166f2986a258d6`。原文件位于 `src/content/papers/covers/duap-lfd-overview.png`，未裁切或重绘。图号与PDF页码分开：本图只确认Fig.3，页码保持未指定。

| 版本 | 来源 | 视觉检查 |
|---|---|---|
| v0 | 正式站，源基线26fe0ac（界面161cb95） | 作者论文区、索引和详情，接图前 |
| v1 | 初次集成 | 3处完整图与共用查看器；作者预览约451px |
| v2 | 章节头横排后 | 作者图宽约616px、索引610px、详情680px；桌面/手机/深色 |
| v3 | 作者中文导读 | 使用既有论文subtitle补充中文识别入口；其余页面沿用v2 |
| production | PR #44，1c41bdb，a-znk.com | 三处桌面明暗/手机与原图查看，共10张；最终构图与交互通过 |

桌面1440×1600、手机390×1000；查看器1440×1000。等待字体、作者肖像及论文图解码后截图。所有原图、比例和颜色保持，手机0横向溢出。原始尺寸模式实测宽2832px，可滚动查看细节。

149单测、图源校验、19页构建SEO检查通过。初轮46项定向中43通过，3条测试传参错误已修；图版8项复验通过。截图促成作者版心扩展，修正旧CSS覆盖后12项相关检查通过；最后中文导读的2项检查通过。

[正式源CI](https://github.com/Yuki-zik/myblog/actions/runs/39645766584)通过149单测与295项E2E；PR #44合并为1c41bdb，正式部署成功。线上三处图宽分别616.19/609.73/680px，原图模式2832px，键盘/关闭/焦点/滚动恢复通过，三页手机0横向溢出且0页面脚本错误。下载的正式PNG与作者原文件SHA-256完全一致，19页canonical和2张论文OG通过线上SEO检查。

10张正式截图与对应最终本地版本比较：6张字节一致；其余3张手机截图和1张查看器截图已逐张视觉检查，未见布局或图像问题。测量、截图比较及部署来源见 [production-checks.json](production-checks.json)。

设计判断与GitHub模板调研见 [paper-preview-research.md](../../paper-preview-research.md)，提图维护见 [paper-automation.md](../../paper-automation.md)，状态/尺寸见 [local-checks.json](local-checks.json)。
