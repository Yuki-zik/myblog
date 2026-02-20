import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { rehypeParagraphAnchors } from "./src/lib/markdown/rehypeParagraphAnchors";

export default defineConfig({
  integrations: [react()],
  markdown: {
    rehypePlugins: [rehypeParagraphAnchors]
  }
});
