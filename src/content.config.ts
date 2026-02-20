import { defineCollection, z } from "astro:content";

const isoDate = z.string().datetime({ offset: true });

const posts = defineCollection({
  type: "content",
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
      readingTime: z.number().positive().optional()
    })
});

const topics = defineCollection({
  type: "content",
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
  type: "content",
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
