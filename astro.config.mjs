import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkDirective from "remark-directive";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { rehypeParagraphAnchors } from "./src/lib/markdown/rehypeParagraphAnchors";
import { rehypeTufteFootnotes } from "./src/lib/markdown/rehypeTufteFootnotes";
import { remarkSpoilers } from "./src/lib/markdown/remarkSpoilers";

const site = process.env.SITE_URL?.trim();
if (!site && process.env.VERCEL) {
  throw new Error(
    "SITE_URL environment variable is required for production builds. " +
    "Set it to your canonical domain, e.g. https://blog.example.com"
  );
}
const resolvedSite = site || (process.env.CI ? "https://myblog.example" : "http://localhost:4321");

export default defineConfig({
  site: resolvedSite,
  // Prefetch internal links on hover (MPA navigation, no ClientRouter). Cheap
  // for a small site and speeds up topic→post→concept hops; `hover` (the
  // prefetchAll default) avoids eager bandwidth on viewport/load.
  prefetch: { prefetchAll: true },
  integrations: [
    react(),
    sitemap({
      // Keep data endpoints (*.json), raw `.md` mirrors (incl. /design.md,
      // /posts/<slug>.md), /llms.txt and generated OG cards (/og/*) out of the
      // SERP sitemap.
      filter: (page) =>
        !page.endsWith(".json") &&
        !page.endsWith(".md") &&
        !page.endsWith("/llms.txt") &&
        !page.includes("/og/")
    })
  ],
  markdown: {
    // C1: migrated off the deprecated top-level `remarkPlugins`/`rehypePlugins`
    // arrays onto `markdown.processor`. `unified()` defaults `gfm: true` and
    // `smartypants: true`, so GFM (incl. footnotes/tables that the scholar rail
    // depends on) is preserved WITHOUT an explicit `remarkGfm` (which would
    // double-apply GFM). Plugin order: remark-math parses `$…$`; rehype-katex
    // renders math first, before paragraph-anchor / Tufte-footnote processing.
    // Shiki is applied separately by Astro via `shikiConfig` below.
    processor: unified({
      remarkPlugins: [remarkDirective, remarkSpoilers, remarkMath],
      rehypePlugins: [rehypeKatex, rehypeParagraphAnchors, rehypeTufteFootnotes]
    }),
    // Dual-theme syntax highlighting. `defaultColor: false` emits
    // `--shiki-light`/`--shiki-dark` token vars; src/styles/code.css picks the
    // right one per `:root[data-color-scheme]`. Themes are a one-line tunable.
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark-dimmed" },
      defaultColor: false,
      wrap: false
    }
  }
});
