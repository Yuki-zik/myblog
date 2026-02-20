import type { CollectionEntry } from "astro:content";
import { DEFAULT_POST_AUTHOR } from "../site";

export interface ArchiveMonthGroup {
  monthKey: string;
  monthLabel: string;
  posts: CollectionEntry<"posts">[];
}

export interface ArchiveYearGroup {
  year: string;
  months: ArchiveMonthGroup[];
}

export function getPostDateISO(dateValue: string): string {
  const direct = dateValue.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) {
    return direct;
  }

  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return "0000-00-00";
  }

  return parsed.toISOString().slice(0, 10);
}

export function getPostMonthKey(dateValue: string): string {
  return getPostDateISO(dateValue).slice(0, 7);
}

export function getPostAuthor(
  post: CollectionEntry<"posts">,
  defaultAuthor = DEFAULT_POST_AUTHOR
): string {
  const author = post.data.author?.trim();
  return author && author.length > 0 ? author : defaultAuthor;
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
