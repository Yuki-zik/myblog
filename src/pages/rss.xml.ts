import type { APIContext } from "astro";
import { collectionReader } from "../lib/i18n/content";
import { getLocale, createTranslator, localizePath } from "../lib/i18n/index";
import { SITE_AUTHOR_PROFILE, SITE_NAME } from "../lib/site";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(context: APIContext) {
  const locale = getLocale(context.url.pathname);
  const t = createTranslator(locale);
  const getCollection = collectionReader(locale);
  const site = context.site ?? new URL("http://localhost:4321/");
  const posts = await getCollection("posts", ({ data }) => !data.draft);

  const sortedPosts = posts.slice().sort((a, b) => {
    const aTime = new Date(a.data.date).getTime();
    const bTime = new Date(b.data.date).getTime();
    return bTime - aTime;
  });

  const latestModifiedMs = sortedPosts.reduce((max, post) => {
    const candidate = new Date(post.data.updated ?? post.data.date).getTime();
    return Number.isFinite(candidate) && candidate > max ? candidate : max;
  }, 0);

  const selfUrl = new URL(localizePath("/rss.xml", locale), site).toString();
  const channelLink = new URL(localizePath("/", locale), site).toString();

  const items = sortedPosts
    .map((post) => {
      const url = new URL(localizePath(`/posts/${post.id}`, locale), site).toString();
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
        `<dc:creator>${escapeXml(post.data.author ?? SITE_AUTHOR_PROFILE.name)}</dc:creator>`,
        "</item>"
      ].join("");
    })
    .join("");

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">',
    "<channel>",
    `<title>${escapeXml(t(SITE_NAME))}</title>`,
    `<description>${escapeXml(t(SITE_AUTHOR_PROFILE.tagline ?? "主题化知识网络与段落短评博客"))}</description>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<atom:link href="${escapeXml(selfUrl)}" rel="self" type="application/rss+xml" />`,
    `<language>${locale}</language>`,
    ...(latestModifiedMs > 0 ? [`<lastBuildDate>${new Date(latestModifiedMs).toUTCString()}</lastBuildDate>`] : []),
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
