import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { DEFAULT_POST_AUTHOR } from "../site";
import { buildArchiveGroups, getPostAuthor, getPostDateISO, getPostMonthKey } from "./archive";

function createPost(
  slug: string,
  date: string,
  author?: string
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
      draft: false,
      author
    },
    render: async () => {
      throw new Error("not needed in unit tests");
    }
  } as unknown as CollectionEntry<"posts">;
}

describe("archive helpers", () => {
  it("groups posts by year and month in descending order", () => {
    const posts = [
      createPost("post-2025-06", "2025-06-30T08:00:00+08:00"),
      createPost("post-2026-02-a", "2026-02-20T11:00:00+08:00"),
      createPost("post-2025-07", "2025-07-03T09:00:00+08:00"),
      createPost("post-2026-02-b", "2026-02-01T07:00:00+08:00")
    ];

    const groups = buildArchiveGroups(posts);

    expect(groups.map((group) => group.year)).toEqual(["2026", "2025"]);
    expect(groups[0].months.map((month) => month.monthKey)).toEqual(["2026-02"]);
    expect(groups[1].months.map((month) => month.monthKey)).toEqual(["2025-07", "2025-06"]);
    expect(groups[0].months[0].posts.map((post) => post.slug)).toEqual([
      "post-2026-02-a",
      "post-2026-02-b"
    ]);
  });

  it("uses source string for date and month key to avoid timezone drift", () => {
    const value = "2026-01-01T00:30:00+08:00";
    expect(getPostDateISO(value)).toBe("2026-01-01");
    expect(getPostMonthKey(value)).toBe("2026-01");
  });

  it("returns optional author or falls back to the site default", () => {
    const noAuthor = createPost("no-author", "2026-02-20T11:00:00+08:00");
    const withAuthor = createPost("with-author", "2026-02-20T11:00:00+08:00", "  RORIRI  ");

    expect(getPostAuthor(noAuthor)).toBe(DEFAULT_POST_AUTHOR);
    expect(getPostAuthor(withAuthor)).toBe("RORIRI");
  });
});
