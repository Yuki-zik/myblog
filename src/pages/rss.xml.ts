import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { getPostUrl } from "../lib/posts/urls";
import { SITE_AUTHOR_PROFILE } from "../lib/site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(context: APIContext) {
  const site = context.site ?? new URL("http://localhost:4321/");
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  const sortedPosts = posts.slice().sort((a, b) => {
    const aTime = new Date(a.data.date).getTime();
    const bTime = new Date(b.data.date).getTime();
    return bTime - aTime;
  });

  const items = sortedPosts
    .map((post) => {
      const url = getPostUrl(post.id, site);
      const categories = post.data.topics
        .map((topic) => `<category>${escapeXml(topic)}</category>`)
        .join("");

      return [
        "<item>",
        `<title>${escapeXml(post.data.title)}</title>`,
        `<link>${escapeXml(url)}</link>`,
        `<guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `<description>${escapeXml(post.data.summary ?? "")}</description>`,
        `<pubDate>${new Date(post.data.date).toUTCString()}</pubDate>`,
        categories,
        `<author>${escapeXml(post.data.author ?? SITE_AUTHOR_PROFILE.name)}</author>`,
        "</item>"
      ].join("");
    })
    .join("");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    "<channel>",
    `<title>${escapeXml(`${SITE_AUTHOR_PROFILE.name} | MyBlog`)}</title>`,
    `<description>${escapeXml(SITE_AUTHOR_PROFILE.tagline ?? "主题化知识网络与段落短评博客")}</description>`,
    `<link>${escapeXml(new URL(".", site).toString())}</link>`,
    "<language>zh-CN</language>",
    items,
    "</channel>",
    "</rss>"
  ].join("");

  return new Response(body, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8"
    }
  });
}
