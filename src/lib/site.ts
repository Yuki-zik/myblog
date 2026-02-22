export interface SiteAuthorProfile {
  id: string;
  name: string;
  bioShort?: string;
  homepage?: string;
  avatar?: string;
  socials?: {
    x?: string;
    github?: string;
  };
}

export const SITE_AUTHOR_PROFILE: SiteAuthorProfile = {
  id: "a-znk",
  name: "A-Znk"
};

export const DEFAULT_POST_AUTHOR = SITE_AUTHOR_PROFILE.name;
