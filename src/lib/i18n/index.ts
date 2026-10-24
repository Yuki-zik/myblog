import english from "./en.json";

export type Locale = "zh-CN" | "en";
const messages: Record<string, string> = english;
export function getLocale(path: string): Locale {
  return /^\/en(?:\/|$)/.test(path) ? "en" : "zh-CN";
}
export function createTranslator(locale: Locale) {
  return (key: string, values: readonly unknown[] = []): string => {
    const text = locale === "en" ? (messages[key] ?? key) : key;
    return text.replace(/\{(\d+)\}/g, (match, index: string) =>
      Number(index) < values.length ? String(values[Number(index)]) : match);
  };
}
/** Keep assets, external URLs, hash-only links, and API routes unchanged. */
export function localizePath(value: string, locale: Locale): string;
export function localizePath(value: undefined, locale: Locale): undefined;
export function localizePath(value: string | undefined, locale: Locale): string | undefined;
export function localizePath(value: string | undefined, locale: Locale): string | undefined {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return value;
  const splitAt = value.search(/[?#]/);
  const path = splitAt < 0 ? value : value.slice(0, splitAt);
  const suffix = splitAt < 0 ? "" : value.slice(splitAt);
  const unprefixed = path.replace(/^\/en(?=\/|$)/, "") || "/";
  if (!/^\/(?:$|(?:topics|posts|papers|concepts)(?:\/|$)|(?:author|archives|map)$|(?:rss\.xml|search-index\.json|design\.md)$)/.test(unprefixed)) return value;
  const clean = unprefixed.replace(/\/+$/, "") || "/";
  return (locale === "en" ? "/en" + (clean === "/" ? "" : clean) : clean) + suffix;
}
/** Localize structured profile/illustration labels without changing identities or assets. */
export function localizeData<T>(value: T, locale: Locale): T {
  if (locale !== "en") return value;
  const t = createTranslator(locale);
  function visit(input: unknown): unknown {
    if (typeof input === "string") return localizePath(t(input), locale);
    if (Array.isArray(input)) return input.map(visit);
    if (input && typeof input === "object") return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, visit(v)]));
    return input;
  }
  return visit(value) as T;
}
/** Shared identity @ids stay stable; page URLs and language describe the current edition. */
export function localizeStructuredData<T>(value: T, locale: Locale, site: URL): T {
  if (locale !== "en") return value;
  const t = createTranslator(locale);
  function visit(input: unknown, key?: string): unknown {
    if (key === "inLanguage") return "en";
    if (typeof input === "string") {
      if (input.startsWith(site.origin + "/")) {
        const url = new URL(input);
        if (key === "@id" && ["#website", "#person-a-znk"].includes(url.hash)) return input;
        url.pathname = localizePath(url.pathname, locale);
        return url.toString();
      }
      return t(input);
    }
    if (Array.isArray(input)) return input.map(item => visit(item));
    if (input && typeof input === "object") return Object.fromEntries(Object.entries(input).map(([k, v]) => [k, visit(v, k)]));
    return input;
  }
  return visit(value) as T;
}
