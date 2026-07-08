import { OGImageRoute } from "astro-og-canvas";
import { getCollection } from "astro:content";
import { ensureOgFonts, OG_CJK_FAMILY } from "../../lib/og/font";

/**
 * Build-time Open Graph cards (1200×630) for posts/topics/concepts at
 * `/og/<collection>/<slug>.png`. Uses the site's midnight→navy gradient + a
 * moonlight accent edge so shared links stay on-brand. Excluded from the
 * sitemap in astro.config.
 */

const [posts, topics, concepts] = await Promise.all([
  getCollection("posts", ({ data }) => !data.draft),
  getCollection("topics"),
  getCollection("concepts")
]);

interface OgPage {
  title: string;
  description: string;
}

const pages: Record<string, OgPage> = {
  ...Object.fromEntries(
    posts.map((post) => [
      `posts/${post.id}`,
      { title: post.data.title, description: post.data.summary ?? "" }
    ])
  ),
  ...Object.fromEntries(
    topics.map((topic) => [`topics/${topic.id}`, { title: topic.data.title, description: topic.data.summary }])
  ),
  ...Object.fromEntries(
    concepts.map((concept) => [
      `concepts/${concept.id}`,
      { title: concept.data.title, description: concept.data.summary }
    ])
  )
};

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getSlug: (path) => `${path}.png`,
  getImageOptions: async (_path, page: OgPage) => {
    // When the CJK font is unavailable we must NOT pass `fonts: []` or a CJK
    // `families` — astro-og-canvas throws on an empty font list. Omitting both
    // lets it fall back to its bundled Latin font so the build still succeeds.
    const fonts = await ensureOgFonts();
    const cjk = fonts.length > 0 ? { families: [OG_CJK_FAMILY] } : {};

    return {
      title: page.title,
      description: page.description,
      bgGradient: [
        [24, 37, 64],
        [52, 73, 115]
      ],
      border: { color: [255, 122, 91], width: 12, side: "inline-start" },
      padding: 72,
      font: {
        title: { weight: "Bold", color: [233, 236, 251], size: 66, lineHeight: 1.18, ...cjk },
        description: { color: [180, 192, 222], size: 30, lineHeight: 1.4, ...cjk }
      },
      ...(fonts.length > 0 ? { fonts } : {}),
      cacheDir: "./node_modules/.astro-og-canvas"
    };
  }
});
