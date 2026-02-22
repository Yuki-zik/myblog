import type { CollectionEntry } from "astro:content";
import { describe, expect, it } from "vitest";
import { SITE_AUTHOR_PROFILE } from "../site";
import { resolvePostAuthor } from "./author";

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

describe("resolvePostAuthor", () => {
  it("falls back to the site author profile when post author is missing", () => {
    const resolved = resolvePostAuthor(createPost("no-author", "2026-02-20T11:00:00+08:00"));

    expect(resolved).toEqual({
      name: SITE_AUTHOR_PROFILE.name,
      source: "site",
      siteProfile: SITE_AUTHOR_PROFILE
    });
  });

  it("uses a trimmed post author when provided", () => {
    const resolved = resolvePostAuthor(
      createPost("with-author", "2026-02-20T11:00:00+08:00", "  RORIRI  ")
    );

    expect(resolved).toEqual({
      name: "RORIRI",
      source: "post"
    });
  });

  it("treats blank post author as missing and falls back to the site author", () => {
    const resolved = resolvePostAuthor(
      createPost("blank-author", "2026-02-20T11:00:00+08:00", "   ")
    );

    expect(resolved.source).toBe("site");
    expect(resolved.name).toBe(SITE_AUTHOR_PROFILE.name);
  });
});
