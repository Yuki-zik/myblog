# Waline Server for MyBlog

这个目录是 MyBlog 的独立评论服务部署单元。

目标边界很明确：

- 博客前端继续只负责 `@waline/client` 挂载
- Waline server 单独部署，不混入 Astro 前端运行时
- Supabase 只提供 PostgreSQL 存储，不再回退到自研评论 API

## 目录结构

- `package.json`: 固定 `@waline/vercel@1.39.3`
- `index.cjs`: Waline server 入口
- `vercel.json`: Vercel 路由到 Waline handler
- `env.example`: Waline server 环境变量样例
- `sql/waline.pgsql`: Waline 官方 PostgreSQL 初始化 SQL 快照

## 推荐部署模型

1. 博客前端继续部署在当前 Astro 的 Vercel 项目。
2. 再创建一个新的 Vercel 项目，仍然指向这个 GitHub 仓库。
3. 将第二个项目的 Root Directory 设为 `waline-server`。
4. 使用 Supabase PostgreSQL 作为 Waline 的存储。
5. 将该服务域名回填到博客前端的 `PUBLIC_WALINE_SERVER_URL`。

这样做的原因：

- 对博客前端零侵入，只保留现有 client 接入
- Waline server 生命周期独立，部署、回滚和排错更清晰
- 同仓库版本化，避免“主仓库改了 client，但 server 文档散落在别处”

## 一次性初始化步骤

### 1. 创建 Supabase 项目

在 Supabase 控制台创建一个新项目，然后打开 `Connect` 或 `Project Settings -> Database`，拿到 PostgreSQL 连接信息。

推荐在 Vercel 场景下使用 Supabase `Session pooler` 的主机和端口。

### 2. 初始化 Waline 表结构

在 Supabase 的 `SQL Editor` 中执行：

- [`sql/waline.pgsql`](./sql/waline.pgsql)

这会创建 Waline 所需的三张核心表：

- `wl_comment`
- `wl_counter`
- `wl_users`

### 3. 创建 Waline Vercel 项目

在 Vercel 中新建项目：

1. 选择同一个 GitHub 仓库 `Yuki-zik/myblog`
2. Root Directory 设为 `waline-server`
3. Framework Preset 保持 Other
4. Node 版本使用 20+

### 4. 配置 Waline server 环境变量

先复制样例：

```bash
cp env.example .env.local
```

本地和 Vercel 至少需要这些变量：

| 变量 | 填什么 |
|---|---|
| `SITE_NAME` | 博客名称，例如 `MyBlog` |
| `SITE_URL` | 博客站点地址，例如 `https://blog.example.com` |
| `SERVER_URL` | Waline 服务地址，例如 `https://comments.example.com` |
| `JWT_TOKEN` | 一段高强度随机字符串，用于 Waline 后台令牌 |
| `PG_HOST` | Supabase `Session pooler` host |
| `PG_PORT` | Supabase `Session pooler` port，通常是 `6543` |
| `PG_DB` | 数据库名，Supabase 默认通常是 `postgres` |
| `PG_USER` | 数据库用户名，通常形如 `postgres.<project-ref>` |
| `PG_PASSWORD` | 你的 Supabase 数据库密码 |
| `PG_SSL` | 填 `true` |
| `PG_PREFIX` | 保持 `wl_` 即可 |

Waline 也支持 `POSTGRES_*` 作为 `PG_*` 的别名，但建议只选一套命名方式，避免混用。

### 5. 建议一起配置的安全项

| 变量 | 建议值 | 说明 |
|---|---|---|
| `SECURE_DOMAINS` | `https://blog.example.com,https://comments.example.com` | 只允许来自博客域名和评论服务域名的请求 |
| `COMMENT_AUDIT` | `false` | 先保证评论可写入；后续若要审核再切到 `true` |
| `AKISMET_KEY` | `false` | 个人博客先关闭，避免依赖额外反垃圾服务 |

### 6. 部署并注册管理员

部署完成后：

1. 打开 `https://your-waline-server.example.com/ui/register`
2. 注册第一个用户
3. 第一个注册用户会成为管理员
4. 后续可在 `/ui` 进入 Waline 后台管理评论

### 7. 回填博客前端环境变量

在博客前端项目中设置：

```bash
PUBLIC_WALINE_SERVER_URL=https://your-waline-server.example.com
```

然后重新部署前端。

## Supabase 连接信息如何映射到 `PG_*`

从 Supabase 复制连接信息时，按下面映射：

| Supabase 字段 | Waline 变量 |
|---|---|
| Host | `PG_HOST` |
| Port | `PG_PORT` |
| Database name | `PG_DB` |
| User | `PG_USER` |
| Password | `PG_PASSWORD` |
| SSL / TLS required | `PG_SSL=true` |

推荐优先使用 `Session pooler`：

- 对 Vercel 这类 serverless 更稳
- 连接数压力更小
- 与 Supabase 文档推荐的连接方式一致

如果你明确使用直连数据库，也可以改成 Supabase 直连 host/port，但此时仍建议保留 `PG_SSL=true`。

## 本地 smoke 测试

```bash
cd waline-server
npm install
cp env.example .env.local
```

填写 `.env.local` 后运行：

```bash
set -a
source .env.local
set +a
npm run dev
```

然后访问终端输出的本地地址，检查：

- `/api/comment` 返回不再是 500
- `/ui/register` 可以打开

## 部署完成后的最小验收

1. 打开博客文章页，确认评论区不再显示“未启用评论服务”。
2. 发送一条评论，确认页面可刷新后继续存在。
3. 打开 Supabase Table Editor，确认 `wl_comment` 出现新记录。
4. 打开 `https://your-waline-server.example.com/ui`，确认后台可见评论。

## 参考资料

- [Waline Vercel Deployment](https://waline.js.org/en/guide/deploy/vercel.html)
- [Waline Server Environment Variables](https://waline.js.org/en/reference/server/env.html)
- [Waline official PostgreSQL schema](https://github.com/walinejs/waline/blob/main/assets/waline.pgsql)
- [Supabase: Connecting with PSQL](https://supabase.com/docs/guides/database/psql)
