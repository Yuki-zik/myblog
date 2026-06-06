import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const isoDate = z.string().datetime({ offset: true });

const posts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/posts" }),
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

const topics = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/topics" }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().optional(),
    summary: z.string(),
    why: z.string(),
    entryPosts: z.array(z.string()).optional(),
    relatedTopics: z.array(z.string()).optional()
  })
});

const concepts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/concepts" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).optional(),
    related: z.array(z.string()).optional()
  })
});

export const collections = {
  posts,
  topics,
  concepts
};
