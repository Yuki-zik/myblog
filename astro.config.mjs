import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import remarkDirective from "remark-directive";
import remarkGfm from "remark-gfm";
import { rehypeParagraphAnchors } from "./src/lib/markdown/rehypeParagraphAnchors";
import { rehypeTufteFootnotes } from "./src/lib/markdown/rehypeTufteFootnotes";
import { remarkSpoilers } from "./src/lib/markdown/remarkSpoilers";

const site = process.env.SITE_URL?.trim() || undefined;

export default defineConfig({
  site,
  integrations: [react()],
  markdown: {
    remarkPlugins: [remarkGfm, remarkDirective, remarkSpoilers],
    rehypePlugins: [rehypeParagraphAnchors, rehypeTufteFootnotes]
  }
});
