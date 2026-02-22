export interface TocHeadingLike {
  depth: number;
  slug: string;
  text: string;
}

export interface PostTocItem {
  depth: 2 | 3;
  slug: string;
  text: string;
  index: number;
  numberLabel: string;
}

export function buildPostToc(headings: TocHeadingLike[]): PostTocItem[] {
  const items: PostTocItem[] = [];
  let sectionIndex = 0;
  let h2Index = 0;
  let h3Index = 0;

  headings.forEach((heading) => {
    const depth = heading.depth === 2 || heading.depth === 3 ? heading.depth : null;
    const slug = heading.slug?.trim();
    const text = heading.text?.trim();

    if (!depth || !slug || !text) {
      return;
    }

    sectionIndex += 1;

    if (depth === 2) {
      h2Index += 1;
      h3Index = 0;

      items.push({
        depth,
        slug,
        text,
        index: sectionIndex,
        numberLabel: String(h2Index)
      });
      return;
    }

    if (h2Index === 0) {
      h2Index = 1;
    }
    h3Index += 1;

    items.push({
      depth,
      slug,
      text,
      index: sectionIndex,
      numberLabel: `${h2Index}.${h3Index}`
    });
  });

  return items;
}
