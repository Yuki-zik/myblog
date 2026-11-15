import type { APIContext } from "astro";
import { collectionReader } from "../lib/i18n/content";
import { getLocale, localizeData, localizePath } from "../lib/i18n/index";
import { buildLlmsFullTxt } from "../lib/seo/llms";
import { resolvePostAuthor } from "../lib/posts/author";
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
  const topicTitleBySlug = new Map(topics.map((topic) => [topic.id, topic.data.title]));

  const abs = (path: string) => new URL(localizePath(path, locale), site).toString();

  const body = buildLlmsFullTxt({
    siteName: SITE_NAME,
    tagline: SITE_AUTHOR_PROFILE.tagline,
    canonicalSiteUrl: abs("/"),
    locale,
    author: {
      name: SITE_AUTHOR_PROFILE.name,
      publicationName: SITE_AUTHOR_PROFILE.publicationName,
      bio: SITE_AUTHOR_PROFILE.bioShort,
      intro: SITE_AUTHOR_PROFILE.intro,
      profileUrl: abs("/author"),
      orcid: SITE_AUTHOR_PROFILE.socials?.orcid,
      github: SITE_AUTHOR_PROFILE.socials?.github,
      scholar: SITE_AUTHOR_PROFILE.socials?.scholar,
      researchTracks: SITE_AUTHOR_PROFILE.researchTracks
    },
    papers: sortedPapers.map((paper) => ({
      title: paper.data.title,
      subtitle: paper.data.subtitle,
      authors: paper.data.authors.map((author) => ({
        name: author.name,
        orcid: author.orcid
      })),
      year: paper.data.year,
      publicationDate: paper.data.publicationDate,
      venue: paper.data.venue?.name,
      status: paper.data.status,
      doi: paper.data.identifiers?.doi,
      arxiv: paper.data.identifiers?.arxiv,
      canonicalUrl: abs(`/papers/${paper.id}`),
      summary: paper.data.summary,
      abstract: paper.data.abstract,
      keywords: paper.data.keywords,
      citation: paper.data.citation,
      bibtex: paper.data.bibtex,
      body: paper.body
    })),
    posts: sortedPosts.map((post) => ({
      title: post.data.title,
      summary: post.data.summary,
      author: resolvePostAuthor(post).name,
      date: post.data.date,
      updated: post.data.updated,
      canonicalUrl: abs(post.data.canonical ?? getPostPath(post.id)),
      topics: post.data.topics.map((slug) => topicTitleBySlug.get(slug) ?? slug),
      body: post.body
    })),
    topics: sortedTopics.map((topic) => ({
      title: topic.data.title,
      url: abs(`/topics/${topic.id}`),
      summary: topic.data.summary,
      why: topic.data.why
    })),
    concepts: concepts.map((concept) => ({
      title: concept.data.title,
      url: abs(`/concepts/${concept.id}`),
      summary: concept.data.summary,
      body: concept.body
    }))
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
}
