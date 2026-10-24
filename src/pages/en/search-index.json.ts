import type { APIRoute } from "astro";
import { collectionReader } from "../../lib/i18n/content";
import { localizePath } from "../../lib/i18n/index";
import { buildSearchIndex } from "../../lib/search/index";
export const prerender = true;
export const GET: APIRoute = async () => {
  const getCollection = collectionReader("en");
  const [posts, papers, topics, concepts] = await Promise.all([
    getCollection("posts", ({data}) => !data.draft),
    getCollection("papers", ({data}) => !data.draft),
    getCollection("topics"), getCollection("concepts")
  ]);
  const index = buildSearchIndex(posts, papers, topics, concepts).map(item => ({...item, url: localizePath(item.url, "en")}));
  return new Response(JSON.stringify(index), {headers: {"Content-Type":"application/json; charset=utf-8", "X-Content-Type-Options":"nosniff", "X-Robots-Tag":"noindex", "Cache-Control":"public, max-age=60, s-maxage=300, must-revalidate"}});
};
