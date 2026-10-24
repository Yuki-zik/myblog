import { getCollection, getEntry, type CollectionKey, type CollectionEntry } from "astro:content";
import { getLocale, localizePath, type Locale } from "./index";

const aliases = { posts: "postsEn", papers: "papersEn", topics: "topicsEn", concepts: "conceptsEn" } as const;
function collectionName(key: CollectionKey, locale: Locale): CollectionKey {
  return (locale === "en" && key in aliases ? aliases[key as keyof typeof aliases] : key) as CollectionKey;
}
/** English collections share the original schemas and stable ids. Their runtime
 * collection tag is retained so Astro renders the translated Markdown. */
export function collectionReader(locale: Locale): typeof getCollection {
  const reader = async (key: CollectionKey, filter?: (entry: CollectionEntry<CollectionKey>) => unknown) => {
    const entries = await getCollection(collectionName(key, locale));
    return filter ? entries.filter(filter) : entries;
  };
  return reader as typeof getCollection;
}
export function entryReader(locale: Locale): typeof getEntry {
  const reader = async (key: CollectionKey, id: string) =>
    getEntry(collectionName(key, locale), id);
  return reader as typeof getEntry;
}
export const FIXED_ROUTES = ["/", "/author", "/papers", "/topics", "/archives", "/map"] as const;
let translatedPaths: Promise<Set<string>> | undefined;
export function getTranslatedPaths(): Promise<Set<string>> {
  return translatedPaths ??= (async () => {
    const paths = new Set<string>(FIXED_ROUTES);
    for (const [source, translated] of Object.entries(aliases)) {
      const [originals, translations] = await Promise.all([
        getCollection(source as CollectionKey), getCollection(translated as CollectionKey)
      ]);
      const published = new Set(originals.filter(e => !("draft" in e.data && e.data.draft)).map(e => e.id));
      for (const entry of translations) {
        if (published.has(entry.id) && !("draft" in entry.data && entry.data.draft)) paths.add(`/${source}/${entry.id}`);
      }
    }
    return paths;
  })();
}
export async function languageAlternates(path: string) {
  const source = localizePath(path.replace(/\/+$/, "") || "/", "zh-CN");
  if (!(await getTranslatedPaths()).has(source)) return [];
  return [
    { lang: "zh-CN", path: source },
    { lang: "en", path: localizePath(source, "en") },
    { lang: "x-default", path: source }
  ];
}
export { getLocale };
