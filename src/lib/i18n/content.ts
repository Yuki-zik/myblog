import { getCollection, type CollectionKey, type CollectionEntry } from "astro:content";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getLocale, localizePath, type Locale } from "./index";
import { deriveTranslationState, type TranslationRecord, type TranslationState } from "./translationState";

const aliases = { posts: "postsEn", papers: "papersEn", topics: "topicsEn", concepts: "conceptsEn" } as const;
type SourceCollection = keyof typeof aliases;
const published = (entry: {data: unknown}) => !(entry.data && typeof entry.data === "object" && "draft" in entry.data && entry.data.draft);

/** English entries retain their Astro collection tag for render(). Source
 * publication status is authoritative even before the background worker runs. */
export function collectionReader(locale: Locale): typeof getCollection {
  const reader = async (key: CollectionKey, filter?: (entry: CollectionEntry<CollectionKey>) => unknown) => {
    let entries: CollectionEntry<CollectionKey>[];
    if (locale === "en" && key in aliases) {
      const [originals, translations] = await Promise.all([
        getCollection(key), getCollection(aliases[key as SourceCollection])
      ]);
      const sourceIds = new Set(originals.filter(published).map(entry => entry.id));
      entries = translations.filter(entry => sourceIds.has(entry.id) && published(entry));
    } else entries = await getCollection(key);
    return filter ? entries.filter(filter) : entries;
  };
  return reader as typeof getCollection;
}
export function entryReader(locale: Locale) {
  return async <K extends SourceCollection>(key: K, id: string): Promise<CollectionEntry<K> | undefined> =>
    (await collectionReader(locale)(key)).find(entry => entry.id === id);
}
export const FIXED_ROUTES = ["/", "/author", "/papers", "/topics", "/archives", "/map", "/agents"] as const;
export async function getTranslatedPaths(): Promise<Set<string>> {
  const paths = new Set<string>(FIXED_ROUTES);
  for (const source of Object.keys(aliases) as SourceCollection[]) {
    for (const entry of await collectionReader("en")(source)) paths.add(`/${source}/${entry.id}`);
  }
  return paths;
}

/** Untranslated links fall back to real source pages instead of invented /en URLs. */
export async function createPageLocalizer(locale: Locale) {
  const available = locale === "en" ? await getTranslatedPaths() : new Set<string>();
  return (value: string | undefined): string | undefined => {
    const localized = localizePath(value, locale);
    if (locale !== "en" || !localized?.startsWith("/en")) return localized;
    const url = new URL(localized, "https://local.invalid");
    if (/\.(?:md|xml|json)$/.test(url.pathname)) return localized;
    const source = localizePath(url.pathname, "zh-CN");
    return available.has(source) ? localized : localizePath(value, "zh-CN");
  };
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
export interface PageTranslationStatus {
  state: TranslationState;
  sourcePath: string;
  translatedAt?: string;
}
export async function pageTranslationStatus(path: string): Promise<PageTranslationStatus | undefined> {
  const sourcePath = localizePath(path.replace(/\/+$/, "") || "/", "zh-CN");
  const match = /^\/(posts|papers|topics|concepts)\/([^?#]+)$/.exec(sourcePath);
  if (!match || match[2].split("/").some(part => !part || part === "." || part === "..")) return undefined;
  const key = `${match[1]}/${match[2]}.md`;
  const read = async (file: string) => {
    try { return await readFile(resolve(process.cwd(), file), "utf8"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
  };
  const [source, target, manifestText] = await Promise.all([
    read(`src/content/${key}`), read(`src/content/en/${key}`), read("src/data/translation-state.json")
  ]);
  if (!source) return undefined;
  const manifest = manifestText ? JSON.parse(manifestText) as {entries: Record<string, TranslationRecord>} : {entries:{}};
  const entry = manifest.entries[key];
  const hash = (text: string) => createHash("sha256").update(text).digest("hex");
  const sourceHash = hash(source.replace(/^\uFEFF/, "").replace(/\r\n?/g,"\n"));
  return {state: deriveTranslationState(sourceHash,target ? hash(target) : undefined,entry),sourcePath,translatedAt:entry?.translatedAt};
}
export { getLocale };
