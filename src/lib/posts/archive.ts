import type { CollectionEntry } from "astro:content";
import { DEFAULT_POST_AUTHOR } from "../site";
import { resolvePostAuthor } from "./author";
import { getPostMonthKey } from "./date";

export interface ArchiveMonthGroup {
  monthKey: string;
  monthLabel: string;
  posts: CollectionEntry<"posts">[];
}

export interface ArchiveYearGroup {
  year: string;
  months: ArchiveMonthGroup[];
}

export { getPostDateISO, getPostMonthKey } from "./date";

export function getPostAuthor(
  post: CollectionEntry<"posts">,
  defaultAuthor = DEFAULT_POST_AUTHOR
): string {
  const resolvedAuthor = resolvePostAuthor(post);
  return resolvedAuthor.source === "site" ? defaultAuthor : resolvedAuthor.name;
}

export function buildArchiveGroups(posts: CollectionEntry<"posts">[]): ArchiveYearGroup[] {
  const sortedPosts = [...posts].sort((a, b) => {
    return new Date(b.data.date).getTime() - new Date(a.data.date).getTime();
  });

  const tree = new Map<string, Map<string, CollectionEntry<"posts">[]>>();

  sortedPosts.forEach((post) => {
    const monthKey = getPostMonthKey(post.data.date);
    const year = monthKey.slice(0, 4);

    if (!tree.has(year)) {
      tree.set(year, new Map());
    }

    const monthMap = tree.get(year)!;
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, []);
    }

    monthMap.get(monthKey)!.push(post);
  });

  return Array.from(tree.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([year, monthMap]) => {
      const months = Array.from(monthMap.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([monthKey, monthPosts]) => ({
          monthKey,
          monthLabel: `${monthKey.slice(5, 7)}\u6708`,
          posts: monthPosts
        }));

      return {
        year,
        months
      };
    });
}
