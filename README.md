# MyBlog v1

Astro + React + Supabase 的主题化博客首版，实现：

- Topic 优先入口（文章作为知识节点）
- 段落级短评（`post_slug + anchor_id`）
- Supabase 自有评论数据与 RLS
- 匿名身份评论（Anonymous Sign-In）

## 本地运行

```bash
pnpm install
pnpm dev
```

## 环境变量

复制 `.env.example` 为 `.env` 并填写：

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_COMMENTS_REQUIRE_APPROVAL`（可选）
- `PUBLIC_COMMENTS_MAX_LEN`（可选，默认 200）

## Supabase 初始化

1. 在 Supabase SQL Editor 执行：`supabase/migrations/20260220_000001_comments.sql`
2. 在 Auth 设置中开启 **Anonymous Sign-Ins**

## 测试

```bash
pnpm test
pnpm test:e2e
pnpm build
```

## 路由

- `/`
- `/topics`
- `/topics/[slug]`
- `/posts/[slug]`
- `/concepts/[slug]`
