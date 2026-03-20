import type { PostTocItem } from "../../lib/posts/toc";

export type TocItem = {
  id: string;
  title: string;
  level: 2 | 3;
  children?: TocItem[];
};

export function buildTocTree(items: PostTocItem[]): TocItem[] {
  const tree: TocItem[] = [];
  let currentSection: TocItem | null = null;

  items.forEach((item) => {
    if (item.depth === 2) {
      currentSection = {
        id: item.slug,
        title: item.text,
        level: 2,
        children: []
      };
      tree.push(currentSection);
      return;
    }

    if (!currentSection) {
      return;
    }

    currentSection.children ??= [];
    currentSection.children.push({
      id: item.slug,
      title: item.text,
      level: 3
    });
  });

  return tree;
}

export function flattenTocTree(items: TocItem[]): TocItem[] {
  return items.flatMap((item) => [item, ...(item.children ?? [])]);
}
