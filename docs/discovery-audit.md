# 博客检索与公开引用审查

日期：2026-10-18。目标站点：https://a-znk-blog.vercel.app/。本次检查10个公开页面，并在作者本人拥有的相关公开仓库补充自然引用。

## 审计口径与基线

自动化基础检查得分 **79/100**。该分数是本地工具的启发式结果，不是Google评分、收录证明或排名预测。最初Node直连未抓取到页面；启用运行时已有的环境代理后完成真实10页抓取，未向第三方审计服务上传内容。

| 状态 | 检查 | 实际结果 |
|---|---|---|
| ✅ | title | 10/10 pages passed this check. |
| ⏳ | meta-description | 4/10 pages passed this check. |
| ✅ | canonical | 10/10 pages passed this check. |
| ✅ | h1 | 10/10 pages passed this check. |
| ✅ | schema | 10/10 pages passed this check. |
| ✅ | schema-types | 10/10 pages passed this check. |
| ✅ | og | 10/10 pages passed this check. |
| ✅ | internal-links | 10/10 pages passed this check. |
| ⏳ | image-alt | 4/10 pages passed this check. |
| ⏳ | text-depth | 3/10 pages passed this check. |
| ✅ | indexability | 10/10 pages passed this check. |
| ✅ | ai-meta-tags | 10/10 pages passed this check. |
| ✅ | heading-hierarchy | 9/10 pages passed this check. |
| ✅ | llms-txt | Valid llms.txt (1253 chars). |
| ✅ | ai-bot-access | No AI bots blocked in robots.txt. |
| ✅ | rss-feed | RSS or Atom feed detected. |

失败项按内容语义判断：导航/索引页不需要为了满足英文250词阈值扩写，中文摘要的字符阈值也不能直接等同英文长度；封面ghost层的空alt是装饰图语义，不改成重复说明。普通页面的可抓取、canonical、JSON-LD、OG、RSS和robots检查均通过。404与Markdown镜像的原有noindex策略保留。

## 内容审阅

审阅样本：首页、笔试复盘、作者页及两篇论文详情，依据抓取的真实正文和元数据。

- **答案可得性：** 论文摘要开头直接说明问题与方法，笔试复盘提供具体执行经验；首页和目录承担导航职责，尚非覆盖一般问题的知识库。**3/5。** 关键发现：研究摘要可直接定位，实践文章以时间线为主。
- **可引用性：** 论文摘要、方法与发表信息可以独立引用，实践复盘多段能独立阅读，部分段落依赖个人语境。**4/5。** 关键发现：摘要与方法段落提供清楚的引用单元。
- **证据密度：** 论文有DOI、作者与发表信息，复盘是作者经历；界面计数和时间线不等同外部实验证据，因此人工评分低于自动数字计数先验。**3/5。** 关键发现：研究元数据明确，个人经验不扩张为一般结论。
- **内容深度：** 研究页提供摘要、方法、引用与资源，复盘含阶段和得失；本站承担笔记/论文入口，完整论文仍由原文链接提供。**3/5。** 关键发现：作为研究入口充分，扩展专题仍取决于真实新增内容。
- **时效性：** 论文和文章保留真实2025/2026日期，没有把样式更新伪装成新研究。**3/5。** 关键发现：保留真实时间，不为分数改日期。
- **结构清晰度：** 样本均有明确H1、内容分节和结构化数据；目录与辅助标签使纯文本摘录包含一些重复。**4/5。** 关键发现：服务端正文可直接解析，导航噪声仍存在。

人工内容分：66.7/100；综合基线73/100，等级B-。这不是本轮外链效果指标。外部仓库入口与作者/论文索引覆盖不在该工具的16项二值评分里。

## 已发布的公开引用

| 位置 | 新增目标链接数 | 发布证据 |
|---|---|---|
| [Yuki-zik/Yuki-zik](https://github.com/Yuki-zik/Yuki-zik/blob/main/README.md) | 3 | [已发布提交](https://github.com/Yuki-zik/Yuki-zik/commit/9d3f4fd0ad0e8f823d326fc738804fbeb33ed647) |
| [Yuki-zik/ai-coding-assessment-toolkit](https://github.com/Yuki-zik/ai-coding-assessment-toolkit/blob/main/README.md) | 1 | [已发布提交](https://github.com/Yuki-zik/ai-coding-assessment-toolkit/commit/bca054d5594d579e4417e39d5aa717ab0ba3356c) |
| [Yuki-zik/ai-coding-assessment-toolkit-zh](https://github.com/Yuki-zik/ai-coding-assessment-toolkit-zh/blob/main/README.md) | 1 | [已发布提交](https://github.com/Yuki-zik/ai-coding-assessment-toolkit-zh/commit/5e77de554a201690ba4f6ff854ee343fc8da31c6) |
| [Yuki-zik/Better-Call-Codex](https://github.com/Yuki-zik/Better-Call-Codex/blob/main/README.md) | 2 | [已发布提交](https://github.com/Yuki-zik/Better-Call-Codex/commit/327aaf4f2d9ab5b9ec000e14a01c3def32155d81) |

共4处README增补：个人主页，以及3个相关工具项目。两个assessment版本属于同一作者的两套入口，不构成独立第三方背书。既有正文、ECC来源说明、项目网址及自动生成的个人报告区块保留。每次写入前核对原README SHA，写入后同时核对默认分支原文与无需认证的公开raw页面。GitHub个人主页HTML也已确认出现博客链接。

博客源码仓库补充主题/论文/作者入口，并设置7个与实际内容匹配的GitHub主题标签。个人资料Website字段的API写入返回404，未改动该字段；个人主页README入口已实际发布。没有向他人仓库、Issue、PR评论或社交频道投放推广内容。

## 站点修正

- Person结构化数据默认链接到本站作者页，保留已配置的外部homepage及GitHub/Scholar身份关联。
- llms.txt补齐作者与2篇非草稿论文，保留发表状态；不收录原型论文。llms.txt作为辅助检索入口，不宣称是Google排名信号。
- 网站界面、文章正文、内容日期、既有域名及爬虫/训练访问策略保持现状。

新增用例先复现2项失败；修后121项单测、9项目标站点/品牌/索引检查通过。最终发布与复测见下文。

## 搜索可见性边界

本轮公开检索找到博客源码仓库，尚不能据此确认博客本体已被Google收录。已有Search Console验证/站点地图提交记录见[search-discovery.md](search-discovery.md)；不把2026-10-16记录当作本轮实时索引状态。

自然、可抓取的相关链接帮助发现页面；实际抓取、收录与排名仍由搜索引擎决定。依据：[Google抓取与索引说明](https://developers.google.com/search/docs/fundamentals/how-search-works)、[收录FAQ](https://developers.google.com/search/help/crawling-index-faq?hl=en)。

## 正式发布与复测

站点增强随`2292de2`发布，前端Production `7153458329`与Waline `7153453726`均成功。[完整CI](https://github.com/Yuki-zik/myblog/actions/runs/39120607235)191/191通过，单测121/121，定向索引/品牌检查9/9。

公开llms索引由11个目标增加到14个，新增作者及两篇论文；结构化Person.url为本站/author，GitHub/Scholar关联保留。Google验证文件逐字节保留，六阅读页的内容/锚点/脚注与构建一致；站内搜索13项、评论errno0且原1条保留。博客仓库的新主题/论文/作者入口也已公开回读。

同样10页复测的基础启发式分数仍为79/100。该二值检查原来已经判定llms有效，不衡量新增论文/作者覆盖，也不抓取外部GitHub入口，因此不将分数不变解释为引用无效，更不据此制造排名提升数字。网站正文与日期未变，内容人工评分沿用基线。

机器可读发布记录与公开引用提交见[discovery-links.json](discovery-links.json)。实际Google收录仍未确认。
