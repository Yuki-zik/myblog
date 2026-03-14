import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { getPostSiblings, sortPostsByDateDesc } from "./navigation";

function createPost(
  slug: string,
  date: string
): CollectionEntry<"posts"> {
  return {
    id: slug,
    slug,
    body: "",
    collection: "posts",
    data: {
      title: slug,
      date,
      topics: ["knowledge-network"],
      draft: false
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"posts">;
}

describe("post navigation helpers", () => {
  const older = createPost("older-post", "2026-02-18T09:00:00+08:00");
  const current = createPost("current-post", "2026-02-19T09:00:00+08:00");
  const newer = createPost("newer-post", "2026-02-20T09:00:00+08:00");
  const posts = [current, older, newer];

  it("sorts posts by published date descending", () => {
    expect(sortPostsByDateDesc(posts).map((post) => post.slug)).toEqual([
      "newer-post",
      "current-post",
      "older-post"
    ]);
  });

  it("returns newer and older siblings around the current post", () => {
    expect(getPostSiblings(posts, "current-post")).toMatchObject({
      newerPost: { slug: "newer-post" },
      olderPost: { slug: "older-post" }
    });
  });

  it("returns null at the boundaries", () => {
    expect(getPostSiblings(posts, "newer-post")).toMatchObject({
      newerPost: null,
      olderPost: { slug: "current-post" }
    });

    expect(getPostSiblings(posts, "older-post")).toMatchObject({
      newerPost: { slug: "current-post" },
      olderPost: null
    });
  });

  it("returns empty siblings when the slug is missing", () => {
    expect(getPostSiblings(posts, "missing-post")).toEqual({
      newerPost: null,
      olderPost: null
    });
  });
});
