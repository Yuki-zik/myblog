---
title: 段落锚点短评的最小实现
date: "2026-02-20T11:00:00+08:00"
topics:
  - paragraph-review
  - knowledge-network
concepts:
  - anchor-id
  - optimistic-ui
summary: 用 rehype 注入稳定锚点并连接 Supabase，实现可扩展段落短评。
---

段落级短评的关键不是 UI，而是可长期稳定的定位协议。

## 锚点规则

先把段落 anchor 固定成 `sectionSlug::pN`，再做任何交互扩展。

这让数据库层可以在未来无痛升级到选中文本评论。

## 交互细节

评论按钮默认只显示计数，避免正文被线程信息淹没。

点击后按需展开线程，保留阅读主线并提供即时反馈。
