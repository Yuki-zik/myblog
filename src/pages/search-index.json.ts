import type { APIRoute } from "astro";
import { buildBilingualSearchIndex } from "../lib/search/build";
export const prerender = true;
export const GET: APIRoute = async () => new Response(JSON.stringify(await buildBilingualSearchIndex("zh-CN")), {
  headers: { "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=60, s-maxage=300, must-revalidate" }
});
