import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const isoDate = z.string().datetime({ offset: true });

const definePosts = (base: string) => defineCollection({
  loader: glob({ pattern: "**/*.md", base }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: isoDate,
      updated: isoDate.optional(),
      draft: z.boolean().optional().default(false),
      topics: z.array(z.string()).min(1),
      concepts: z.array(z.string()).optional(),
      summary: z.string().optional(),
      author: z.string().min(1).optional(),
      cover: z
        .object({
          src: image(),
          alt: z.string().min(1),
          credit: z.string().optional()
        })
        .optional(),
      canonical: z.string().url().optional(),
      readingTime: z.number().positive().optional(),
      figures: z
        .array(
          z.object({
            id: z.string().min(1),
            anchorId: z.string().optional(),
            title: z.string().min(1),
            kind: z.enum(["image", "table"]),
            caption: z.string().optional(),
            summary: z.string().optional(),
            // Figure sources should point to bibliography footnotes, e.g. `ref-supabase-rls`.
            sourceRefIds: z.array(z.string().regex(/^ref-/)).optional(),
            image: z
              .object({
                src: image(),
                alt: z.string().min(1)
              })
              .optional()
          })
        )
        .optional()
    })
});

const defineTopics = (base: string) => defineCollection({
  loader: glob({ pattern: "**/*.md", base }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().optional(),
    summary: z.string(),
    why: z.string(),
    entryPosts: z.array(z.string()).optional(),
    relatedTopics: z.array(z.string()).optional()
  })
});

const defineConcepts = (base: string) => defineCollection({
  loader: glob({ pattern: "**/*.md", base }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    related: z.array(z.string()).optional()
  })
});

const definePapers = (base: string) => defineCollection({
  loader: glob({ pattern: "**/*.md", base }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1).optional(),
    authors: z
      .array(
        z.object({
          name: z.string().min(1),
          url: z.string().url().optional(),
          orcid: z.string().min(1).optional(),
          self: z.boolean().optional().default(false)
        })
      )
      .min(1),
    abstract: z.string().min(1),
    summary: z.string().min(1).optional(),
    year: z.number().int().min(1900).max(2100),
    publicationDate: isoDate.optional(),
    updated: isoDate.optional(),
    venue: z
      .object({
        name: z.string().min(1),
        short: z.string().min(1).optional(),
        type: z.enum(["conference", "journal", "workshop", "preprint", "prototype"]).optional()
      })
      .optional(),
    status: z.enum(["prototype", "preprint", "accepted", "published"]),
    keywords: z.array(z.string().min(1)).min(1),
    citation: z.string().min(1).optional(),
    identifiers: z
      .object({
        doi: z.string().min(1).optional(),
        arxiv: z.string().min(1).optional(),
        openreview: z.string().min(1).optional(),
        scholar: z.string().min(1).optional()
      })
      .optional(),
    resources: z
      .array(
        z.object({
          type: z.enum([
            "publisher",
            "pdf",
            "code",
            "project",
            "data",
            "supplement",
            "slides",
            "video",
            "demo"
          ]),
          label: z.string().min(1).optional(),
          url: z.string().url()
        })
      )
      .optional()
      .default([]),
    cover: z
      .object({
        src: image(),
        alt: z.string().min(1),
        caption: z.string().min(1),
        sourcePage: z.number().int().positive().optional(),
        figureLabel: z.string().min(1).optional()
      })
      .optional(),
    bibtex: z.string().min(1).optional(),
    relatedTopics: z.array(z.string().min(1)).optional(),
    relatedPosts: z.array(z.string().min(1)).optional(),
    featured: z.boolean().optional().default(false),
    draft: z.boolean().optional().default(false)
  })
});

const posts = definePosts("./src/content/posts");
const postsEn = definePosts("./src/content/en/posts");
const papers = definePapers("./src/content/papers");
const papersEn = definePapers("./src/content/en/papers");
const topics = defineTopics("./src/content/topics");
const topicsEn = defineTopics("./src/content/en/topics");
const concepts = defineConcepts("./src/content/concepts");
const conceptsEn = defineConcepts("./src/content/en/concepts");

export const collections = {
  postsEn, papersEn, topicsEn, conceptsEn,
  posts,
  topics,
  concepts,
  papers
};
