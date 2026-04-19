import { describe, expect, it } from "vitest";
import {
  pickFeaturedHomePost,
  pickRecentHomePosts
} from "./selectors";

type TestPost = {
  slug: string;
  data: {
    date: string;
    cover?: {
      src?: string;
    };
  };
};

function createPost(slug: string, date: string, hasCover = false): TestPost {
  return {
    slug,
    data: {
      date,
      cover: hasCover ? { src: `${slug}.png` } : undefined
    }
  };
}

describe("home selectors", () => {
  it("picks the newest published post with a cover as the featured post", () => {
    const posts = [
      createPost("newest-without-cover", "2026-03-28T10:00:00+08:00"),
      createPost("newest-with-cover", "2026-03-27T10:00:00+08:00", true),
      createPost("older-with-cover", "2026-03-20T10:00:00+08:00", true)
    ];

    expect(pickFeaturedHomePost(posts)?.slug).toBe("newest-with-cover");
  });

  it("returns a recent list without the featured post and respects the five-item cap", () => {
    const posts = [
      createPost("post-1", "2026-03-28T10:00:00+08:00", true),
      createPost("post-2", "2026-03-27T10:00:00+08:00", true),
      createPost("post-3", "2026-03-26T10:00:00+08:00"),
      createPost("post-4", "2026-03-25T10:00:00+08:00"),
      createPost("post-5", "2026-03-24T10:00:00+08:00"),
      createPost("post-6", "2026-03-23T10:00:00+08:00"),
      createPost("post-7", "2026-03-22T10:00:00+08:00")
    ];

    expect(pickRecentHomePosts(posts, "post-1").map((post) => post.slug)).toEqual([
      "post-2",
      "post-3",
      "post-4",
      "post-5",
      "post-6"
    ]);
  });
});
