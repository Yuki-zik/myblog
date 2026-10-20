# 中文搜索收录与 SEO 运行手册

正式站点：**https://a-znk.com/**；以它作为唯一 canonical。旧 `.vercel.app` 域名保持 301，原 Google 验证文件继续保留。本文记录技术可爬取性和搜索收录，两种状态分别验证。

## 2026-10-20 搜索可见性基线

- 网页及文章在普通请求、模拟 Baiduspider 请求下返回 HTTP 200；这是抓取可行性的技术检查，不能代替真实中国大陆网络和真实爬虫抓取。
- 搜狗对 `site:a-znk.com` 公开查询返回 0；360 返回无相关结果。
- 百度公开查询触发验证，未确认是否已收录；Bing 公开结果混杂，未确认；应以各站长平台的索引报告为准。
- 主站有中文 `lang` / title / description、canonical、文章 JSON-LD 和 RSS；没有必要新增 `meta keywords`。

## 自动化和验收

- `/robots.txt` 指向 `https://a-znk.com/sitemap.xml`。
- `/sitemap.xml` 是直接 URL-set；文章更新时间优先使用 frontmatter 的 `updated`，否则使用 `date`。论文只在提供 `updated` 时输出 `lastmod`；其他没有可信更新时间的页面不伪造日期。保留 Astro 原有 `/sitemap-index.xml` 和 `/sitemap-0.xml`。构建检查必须验证两者 URL 一致。
- CI：`pnpm test`、`pnpm build`、`pnpm seo:check-build`、`node --test scripts/seo/indexnow-utils.test.mjs`。
- 部署后：`pnpm seo:audit` 检查站点地图、robots、canonical 和 Baiduspider UA 可访问性。真实中国大陆 IP、DNS、TLS 和站长后台的抓取诊断另行测量。
- `IndexNow` 静态验证文件放在站点根目录，内容与文件名一致。成功的 production `deployment_status` 触发 GitHub Action 按源码变更筛选 URL；可从 Actions → IndexNow submission → Run workflow 手动运行，默认 dry-run。POST 的 HTTP 200/202 只代表接收通知，**不代表已经收录**。
- IndexNow 主要覆盖 Bing 及其他参与协议的搜索引擎，**不能替代百度、搜狗或 360 的站长平台提交**。不要把 IndexNow 当作百度推送接口。

## 站长平台的账号操作（需要域名所有者授权）

| 平台 | 官方入口 | 操作 |
|---|---|---|
| 百度 | https://ziyuan.baidu.com/ | 添加站点并验证 `a-znk.com`；提交 `https://a-znk.com/sitemap.xml`；查看抓取异常、索引量、搜索展现 |
| Bing | https://www.bing.com/webmasters/ | 添加站点/验证 DNS 或文件；提交 Sitemap；查看 IndexNow 与 URL inspection |
| 搜狗 | https://zhanzhang.sogou.com/ | 检查平台当前是否开放站点添加；支持时验证所有权和提交站点 |
| 360 | https://info.so.360.cn/site_submit.html | 提交网站收录申请；后续关注站长渠道反馈 |
| Google | https://search.google.com/search-console | 添加顶级域名属性/URL 前缀属性，校验所有权，提交 sitemap |

域名验证应使用控制台实际生成的 TXT/CNAME/HTML 文件值；不能预填或猜测。百度官方文档支持标准 XML urlset 与索引 sitemap；直接 urlset 的作用是增强兼容性。确认一次有效提交后，观察抓取、已索引页面数、曝光、查询词和点击；反复提交同一个 URL 不会直接提升排名。

## 内容发现优先级

每篇原创技术文章确保独立标题、摘要和明确的研究问题，可靠的参考来源、图示/公式、内部主题链接及与相关 GitHub README 的交叉引用。研究中的工作标识为未正式发表；不伪造论文状态、成果和更新时间。重点关注 LLM 安全、hidden-state probe、模型表征对齐、Agent 安全等现有实际研究方向。

## 跨地域与镜像

主站由 Vercel 提供服务。模拟 Baiduspider UA 访问成功只能证明 User-Agent 没被屏蔽；实际中国大陆节点要分别测 TCP/TLS/DNS、HTML 200 与页面完整性。VPS 镜像保持对主域名的 canonical 或 noindex，避免两份内容争夺收录。不得通过 robots.txt Disallow 来实现 canonical。

## 第二阶段：论文发现与百度提交安全边界（2026-10-20）

PR #34 已合并并发布：正式 `/sitemap.xml`、`/sitemap-index.xml`、`/robots.txt` 以及 IndexNow 密钥文件均返回 200；GitHub Actions [39439737841](https://github.com/Yuki-zik/myblog/actions/runs/39439737841) 实际通知 19 URL，IndexNow 返回 HTTP 202。此状态是通知已被接收，不代表已经索引。

针对真实已发表论文，站点新生成精确的 Highwire `citation_title`、逐个作者、发表日期（只有年份时仅填年份）、期刊/会议、DOI 以及用户提供的明确 PDF URL。中文检索标题来自真实副标题及缩写；论文原始英文题名继续用于 H1、JSON-LD 和正式引用。原型和草稿不发布书目假信息。Google Scholar 官方规范： https://scholar.google.com/intl/en/scholar/inclusion.html 。

**百度普通收录接口**：官方文档 https://ziyuan.baidu.com/college/courseinfo?id=267&page=2 给出的 API 为 `http://data.zz.baidu.com/urls`，其 Token 必须从已验证的百度资源平台领取。2026-10-20 实测 `https://data.zz.baidu.com` 的 TLS 证书主机名不匹配，使用 HTTP 会明文传输 Token，因此当前阶段不配置不安全的自动提交。优先在百度站长平台手动提交 `https://a-znk.com/sitemap.xml`；搜狗、360 分别走其站长提交渠道。Token 和平台收录数据均尚未获取。
