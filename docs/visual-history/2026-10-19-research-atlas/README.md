# Research Atlas — discovery and author interface refinement (2026-10-19)

## Motivation and design boundary

User assessment: the home page and article reading page have the strongest visual identity; the author/about page is underdeveloped and not aligned to the same architectural-drawing/ruled-paper language. The other non-reading pages need clearer editorial hierarchy and meaningful information density.

**Fixed anchors:** keep the home illustration/code-note composition; keep the article sheet, margin annotations, image-viewer and paragraph/TOC mechanics. No new runtime dependencies, no synthetic publication claims, no generated portrait.

## Intervention

1. `/author`: replace the generic card hero with an indexed research dossier — large typographic identity, original avatar in a CSS graph-paper frame, author mission, three research axes, *verified* publications selected from the structured papers collection where `author.self` and status is published/accepted, real practice and current-focus content, contact and writing paths. Research content stays data-driven by `SITE_AUTHOR_PROFILE` and the site collections.
2. `/topics` and topic details: increase index title and row hierarchy; explain each topic's motivation from its existing `why` frontmatter. Topic route links and reading list remain unchanged.
3. `/papers` and `/archives`: enlarge index headings and improve record labeling; display existing publication keywords; retain chronology, scholarly status and provenance fields.
4. `/concepts`: bring the concept hero, reference counts and definition into the same ruled-paper composition without changing concept/post relations.
5. `/map`: replace the generic hero with a matching index and meaningful route navigation. The same graph nodes/edges and client-side interactions remain in use.
6. `/404`: make a bespoke wireframe-style recovery dossier with genuine route links and HTTP 404/noindex preserved.

Visual system: clean white and dark graphite paper; high-contrast text; shared orange from `--drawing-accent`; thin rules and small mono labels; larger top-level hierarchy; CSS linework instead of decorative image generation. Interactions follow original native link controls and keyboard focus.

## Review artifacts

- `before-author.png` — previous live author page at 1440×1000.
- `after-author-desktop.png` — new 1440×1000 top-fold.
- `after-author-mobile.png` — new 390×850 top-fold.
- `after-author-dark.png` — new 1440×850 dark variant.
- `after-page-overview.jpg` — author, topics, topic, archives, papers, concept, graph, 404 at 1440×1000.
- `after-map.png` and `after-404.png` — non-reading utility page results.

The screenshots are visual references; complete accessibility, actual responsive overflow, article card images and graph interactions must also be checked through Playwright. Screenshots of lazy content require scrolling the page to load deferred assets, and are not treated as evidence of broken images.

## Validation contract

- Vitest and Astro production build/check pass.
- Focused E2E: `tests/e2e/research-atlas.spec.ts`, `editorial-proportions.spec.ts`, `site-style-system.spec.ts`, `post-covers.spec.ts`.
- 1440 and 390 widths and light/dark variants have 0 document horizontal overflow; all author identity sections, 2 verified published papers, 4 practice records, 4 social platforms and real article cards remain available.
- Map graph hydrates and displays actual nodes. Missing route returns HTTP 404 with working homepage/topics/archives links.
- Full PR CI (including existing Playwright suite) must complete before merging into `main` and Vercel production publication.
