import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
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
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes("/search-index.json") && !page.includes("/design.md")
    })
  ],
  markdown: {
    remarkPlugins: [remarkGfm, remarkDirective, remarkSpoilers],
    rehypePlugins: [rehypeParagraphAnchors, rehypeTufteFootnotes]
  }
});
