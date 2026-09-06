export function getPostPath(slug: string): string {
  return `/posts/${slug}`;
}

export function getPostUrl(slug: string, site: URL | string): string {
  return new URL(getPostPath(slug), site).toString();
}
