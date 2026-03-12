import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import remarkGfm from "remark-gfm";
import { rehypeParagraphAnchors } from "./src/lib/markdown/rehypeParagraphAnchors";
import { rehypeTufteFootnotes } from "./src/lib/markdown/rehypeTufteFootnotes";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  integrations: [react()],

  markdown: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeParagraphAnchors, rehypeTufteFootnotes]
  },

  vite: {
    plugins: [tailwindcss()]
  }
});