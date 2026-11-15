import { collectionReader } from "../../lib/i18n/content";
import { createTranslator, localizeData } from "../../lib/i18n/index";
import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { ensureOgFonts, OG_CJK_FAMILY } from "../../lib/og/font";
import { SITE_AUTHOR_PROFILE, SITE_DESCRIPTION, SITE_NAME } from "../../lib/site";

/**
 * Build-time Open Graph cards (1200×630) for top-level routes and
 * posts/topics/concepts/papers at `/og/<route>.png` (and `/og/en/<route>.png`).
 * Uses the site's midnight→navy gradient + a moonlight accent edge so shared
 * links stay on-brand. Excluded from the sitemap in astro.config.
 */

const [posts, topics, concepts, papers] = await Promise.all([
  getCollection("posts", ({ data }) => !data.draft),
  getCollection("topics"),
  getCollection("concepts"),
  getCollection("papers", ({ data }) => !data.draft && data.status !== "prototype")
]);

interface OgPage {
  title: string;
  description: string;
}

const tEn = createTranslator("en");
const authorEn = localizeData(SITE_AUTHOR_PROFILE, "en");
const siteNameEn = localizeData(SITE_NAME, "en");
const siteDescEn = localizeData(SITE_DESCRIPTION, "en");

const fixedZhPages: Record<string, OgPage> = {
  home: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION
  },
  author: {
    title: `${SITE_AUTHOR_PROFILE.name} · ${SITE_AUTHOR_PROFILE.publicationName ?? "Researcher"}`,
    description: SITE_AUTHOR_PROFILE.intro ?? SITE_AUTHOR_PROFILE.bioShort ?? SITE_DESCRIPTION
  },
  papers: {
    title: "论文与研究成果",
    description: "汇总已公开研究论文，查看研究摘要、发表期刊、DOI 与引用信息。"
  },
  topics: {
    title: "主题列表",
    description: "按主题组织大模型系统、模型安全、Agent 工程与知识网络技术笔记。"
  },
  archives: {
    title: "文章归档",
    description: "按年月倒序浏览 A-Znk 的全部原创技术文章与工程复盘。"
  },
  map: {
    title: "漫游 · 想法之间的路径",
    description: "沿着笔记、主题与概念之间的真实关联探索技术知识网络。"
  },
  agents: {
    title: "Agent 工作观察站",
    description: "观察独立任务并行、可靠交付、人工注意力投入与公开实证研究。"
  },
  privacy: {
    title: "隐私与访问统计",
    description: "说明站内匿名聚合访问统计的边界、数据保留策略与自主退出机制。"
  }
};

const fixedEnPages: Record<string, OgPage> = {
  "en/home": {
    title: siteNameEn,
    description: siteDescEn
  },
  "en/author": {
    title: `${authorEn.name} · ${authorEn.publicationName ?? "Researcher"}`,
    description: authorEn.intro ?? authorEn.bioShort ?? siteDescEn
  },
  "en/papers": {
    title: tEn("论文与研究成果"),
    description: "Published research papers on speech privacy, adversarial robustness, and machine learning sensing."
  },
  "en/topics": {
    title: tEn("主题列表"),
    description: "Browse research notes and engineering fieldnotes organized by topic, entry paths, and concepts."
  },
  "en/archives": {
    title: tEn("文章归档"),
    description: "Chronological archive of original technical articles, engineering notes, and retrospectives."
  },
  "en/map": {
    title: tEn("漫游 · 想法之间的路径"),
    description: "Explore real connections across topics, technical articles, and core concepts."
  },
  "en/agents": {
    title: tEn("Agent 工作观察站"),
    description: "Interactive instruments, reviewed deliveries, and empirical studies on human-agent work."
  },
  "en/privacy": {
    title: "Privacy & analytics",
    description: "How A-Znk Blog handles privacy-preserving aggregate statistics and browser opt-out controls."
  }
};

const pages: Record<string, OgPage> = {
  ...fixedZhPages,
  ...fixedEnPages,
  ...Object.fromEntries(
    posts.map((post) => [
      `posts/${post.id}`,
      { title: post.data.title, description: post.data.summary ?? "" }
    ])
  ),
  ...Object.fromEntries(
    topics.map((topic) => [`topics/${topic.id}`, { title: topic.data.title, description: topic.data.summary }])
  ),
  ...Object.fromEntries(
    concepts.map((concept) => [
      `concepts/${concept.id}`,
      { title: concept.data.title, description: concept.data.summary }
    ])
  ),
  ...Object.fromEntries(
    papers.map((paper) => [
      `papers/${paper.id}`,
      { title: paper.data.subtitle ?? paper.data.title, description: paper.data.summary ?? paper.data.abstract }
    ])
  )
};

const english = collectionReader("en");
for (const collection of ["posts", "topics", "concepts", "papers"] as const) {
  for (const entry of await english(collection)) {
    if ("draft" in entry.data && entry.data.draft) continue;
    if ("status" in entry.data && entry.data.status === "prototype") continue;
    pages[`en/${collection}/${entry.id}`] = {
      title: entry.data.title,
      description: entry.data.summary ?? ("abstract" in entry.data ? entry.data.abstract : "")
    };
  }
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => `${path}.png`,
  getImageOptions: async (_path, page: OgPage) => {
    // When the CJK font is unavailable we must NOT pass `fonts: []` or a CJK
    // `families` — astro-og-canvas throws on an empty font list. Omitting both
    // lets it fall back to its bundled Latin font so the build still succeeds.
    const fonts = await ensureOgFonts();
    const cjk = fonts.length > 0 ? { families: [OG_CJK_FAMILY] } : {};

    return {
      title: page.title,
      description: page.description,
      bgGradient: [
        [24, 37, 64],
        [52, 73, 115]
      ],
      border: { color: [255, 122, 91], width: 12, side: "inline-start" },
      padding: 72,
      font: {
        title: { weight: "Bold", color: [233, 236, 251], size: 66, lineHeight: 1.18, ...cjk },
        description: { color: [180, 192, 222], size: 30, lineHeight: 1.4, ...cjk }
      },
      ...(fonts.length > 0 ? { fonts } : {}),
      cacheDir: "./node_modules/.astro-og-canvas"
    };
  }
});
