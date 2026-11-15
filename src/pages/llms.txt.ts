import type { APIContext } from "astro";
import { collectionReader } from "../lib/i18n/content";
import { getLocale, localizeData, localizePath } from "../lib/i18n/index";
import { buildLlmsTxt } from "../lib/seo/llms";
import { getPostPath } from "../lib/posts/urls";
import {
  SITE_AUTHOR_PROFILE as SOURCE_SITE_AUTHOR_PROFILE,
  SITE_NAME as SOURCE_SITE_NAME
} from "../lib/site";

export const prerender = true;

export async function GET(context: APIContext) {
  const locale = getLocale(context.url.pathname);
  const getCollection = collectionReader(locale);
  const site = context.site ?? new URL("http://localhost:4321/");
  const SITE_NAME = localizeData(SOURCE_SITE_NAME, locale);
  const SITE_AUTHOR_PROFILE = localizeData(SOURCE_SITE_AUTHOR_PROFILE, locale);

  const [posts, topics, concepts, papers] = await Promise.all([
    getCollection("posts", ({ data }) => !data.draft),
    getCollection("topics"),
    getCollection("concepts"),
    getCollection("papers", ({ data }) => !data.draft && data.status !== "prototype")
  ]);

  const sortedPosts = posts
    .slice()
    .sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  const sortedPapers = papers.slice().sort((a, b) => b.data.year - a.data.year);
  const sortedTopics = topics.slice().sort((a, b) => (a.data.order ?? 999) - (b.data.order ?? 999));

  const abs = (path: string) => new URL(localizePath(path, locale), site).toString();
  const fullCorpusUrl = abs("/llms-full.txt");
  const otherLocaleIndexUrl = new URL(
    locale === "en" ? "/llms.txt" : "/en/llms.txt",
    site
  ).toString();

  const intro =
    locale === "en"
      ? [
          `Author: ${SITE_AUTHOR_PROFILE.name} (academic name: ${SITE_AUTHOR_PROFILE.publicationName ?? "Qianli Ma"}), Master's researcher in AI Safety & LLM Systems at USTC (ORCID: https://orcid.org/0009-0005-2060-4172). Full clean-text corpus: ${fullCorpusUrl} · Chinese index: ${otherLocaleIndexUrl}`
        ]
      : [
          `作者：${SITE_AUTHOR_PROFILE.name}（学术论文署名 ${SITE_AUTHOR_PROFILE.publicationName ?? "Qianli Ma"}），中国科学技术大学（USTC）AI 安全与大模型系统方向硕士（ORCID: https://orcid.org/0009-0005-2060-4172）。全量 Markdown 语料：${fullCorpusUrl} · English index: ${otherLocaleIndexUrl}`
        ];

  const body = buildLlmsTxt({
    siteName: SITE_NAME,
    tagline: SITE_AUTHOR_PROFILE.tagline,
    intro,
    author: {
      title: SITE_AUTHOR_PROFILE.name,
      url: abs("/author"),
      summary: [
        SITE_AUTHOR_PROFILE.bioShort,
        SITE_AUTHOR_PROFILE.publicationName
          ? locale === "en"
            ? `Publications as ${SITE_AUTHOR_PROFILE.publicationName}`
            : `学术署名 ${SITE_AUTHOR_PROFILE.publicationName}`
          : undefined
      ]
        .filter(Boolean)
        .join(" · ")
    },
    papers: sortedPapers.map((paper) => ({
      title: paper.data.title,
      url: abs(`/papers/${paper.id}`),
      markdownUrl: abs(`/papers/${paper.id}.md`),
      summary: [
        paper.data.year,
        paper.data.venue?.name,
        paper.data.status,
        paper.data.identifiers?.doi ? `DOI: ${paper.data.identifiers.doi}` : undefined,
        paper.data.summary ?? paper.data.abstract
      ]
        .filter(Boolean)
        .join(" · ")
    })),
    posts: sortedPosts.map((post) => ({
      title: post.data.title,
      url: abs(post.data.canonical ?? getPostPath(post.id)),
      markdownUrl: abs(`/posts/${post.id}.md`),
      summary: [post.data.date.slice(0, 10), post.data.summary].filter(Boolean).join(" · ")
    })),
    topics: sortedTopics.map((topic) => ({
      title: topic.data.title,
      url: abs(`/topics/${topic.id}`),
      summary: topic.data.summary
    })),
    concepts: concepts.map((concept) => ({
      title: concept.data.title,
      url: abs(`/concepts/${concept.id}`),
      summary: concept.data.summary
    })),
    optional: [
      {
        title: locale === "en" ? "Full Markdown Corpus (llms-full.txt)" : "全站完整 Markdown 语料 (llms-full.txt)",
        url: fullCorpusUrl,
        summary:
          locale === "en"
            ? "Single-file Markdown bundle of author profile, published papers, posts, topics, and concepts"
            : "单文件汇总作者档案、已发表论文、技术文章、主题与概念全文"
      },
      {
        title: locale === "en" ? "Chinese LLMs Index (中文索引)" : "English LLMs Index",
        url: otherLocaleIndexUrl,
        summary:
          locale === "en"
            ? "Authoritative Chinese source index"
            : "Complete English edition index for international retrieval"
      },
      {
        title: locale === "en" ? "Agent Work Observatory" : "Agent 工作观察站",
        url: abs("/agents"),
        summary:
          locale === "en"
            ? "Interactive instruments, public field-study evidence, and reviewed agent delivery records"
            : "独立任务并发、可靠交付、人工投入与公开实证研究记录"
      },
      {
        title: locale === "en" ? "Wander · Knowledge Graph" : "漫游 · 知识关联地图",
        url: abs("/map"),
        summary:
          locale === "en"
            ? "Topic-post-concept adjacency explorer and curated reading trails"
            : "主题、文章与概念的真实关联图与阅读路径"
      },
      {
        title: "Knowledge Graph JSON",
        url: new URL("/knowledge-graph.json", site).toString(),
        summary:
          locale === "en"
            ? "Machine-readable nodes and edges connecting topics, posts, and concepts"
            : "机器可读的主题-文章-概念节点与关系边 JSON"
      },
      {
        title: `${SITE_NAME} RSS`,
        url: abs("/rss.xml"),
        summary: locale === "en" ? "RSS 2.0 feed of English articles" : "中文技术文章 RSS 2.0 订阅源"
      }
    ]
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
