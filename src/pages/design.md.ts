import type { APIRoute } from "astro";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export const prerender = true;

const designManualSource = resolve(process.cwd(), "src/content/posts/myblog-design-manual.md");

export const GET: APIRoute = async () => {
  const markdown = await readFile(designManualSource, "utf8");

  return new Response(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate"
    }
  });
};
