import type { CollectionEntry } from "astro:content";
import { SITE_AUTHOR_PROFILE, type SiteAuthorProfile } from "../site";

export interface ResolvedPostAuthor {
  name: string;
  source: "post" | "site";
  siteProfile?: SiteAuthorProfile;
}

export function resolvePostAuthor(post: CollectionEntry<"posts">): ResolvedPostAuthor {
  const author = post.data.author?.trim();

  if (author && author.length > 0) {
    return {
      name: author,
      source: "post"
    };
  }

  return {
    name: SITE_AUTHOR_PROFILE.name,
    source: "site",
    siteProfile: SITE_AUTHOR_PROFILE
  };
}
