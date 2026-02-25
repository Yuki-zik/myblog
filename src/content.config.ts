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
      readingTime: z.number().positive().optional(),
      annotations: z
        .array(
          z.object({
            id: z.string().min(1),
            anchorId: z.string().min(1),
            title: z.string().min(1).optional(),
            body: z.string().min(1)
          })
        )
        .optional(),
      references: z
        .array(
          z.object({
            id: z.string().min(1),
            label: z.string().min(1).optional(),
            citation: z.string().min(1),
            url: z.string().url().optional(),
            note: z.string().optional()
          })
        )
        .optional(),
      figures: z
        .array(
          z.object({
            id: z.string().min(1),
            anchorId: z.string().optional(),
            title: z.string().min(1),
            kind: z.enum(["image", "table"]),
            caption: z.string().optional(),
            summary: z.string().optional(),
            sourceRefIds: z.array(z.string()).optional(),
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
