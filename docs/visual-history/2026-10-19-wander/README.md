# 漫游 / WANDER — 2026-10-19

## User goal and boundary

Replace the low-information “知识图谱” name, weak entry link and disconnected starfield styling with an inviting, useful exploration experience. Retain the accepted home hero, article reading layout, annotations, comment system, source content, /map address and /knowledge-graph.json compatibility.

## Implementation

- A consistent **漫游** destination in the primary navigation. /map stays canonical so existing bookmarks continue to work.
- Rich homepage and topic-index gateways show an actual three-stop reading path, rather than an icon-only or generic link. They are inserted after existing content and do not replace the homepage hero.
- Three reading paths built from existing nodes and validated edges. A missing node or edge removes that route; no synthetic associations or publication claims are introduced.
- Paper-based semantic network: themes, notes and concepts have distinct shapes. Deterministic placement prevents filtering from randomly rearranging the content.
- Search across titles and summaries, type filters, diagram/list views, a persistent preview with an actual reading link and adjacent content, and a “换个起点” action. Selecting a node preserves the exploration context; following the reading link opens the real article or topic.
- Shareable `?focus=` links select only existing node IDs. Mobile defaults to the readable list; users can explicitly switch to the internally scrollable diagram.
- Build-time data is server rendered into the island; the initial page no longer waits for a separate graph fetch. Real reading paths and an explicit complete link list remain available without JavaScript.
- Remove the old globally imported starfield CSS. Small-screen navigation padding accommodates the sixth destination within the existing two-row header; accepted collapse geometry is retained.

## Data and tests

The graph retains type-prefixed IDs and de-duplicated, undirected, source-defined edges. The only endpoint data addition is optional node `summary` text, sourced from existing frontmatter.

New pure tests cover normalized search, filters, incoming/outgoing adjacency, incomplete routes, stable positions and CJK title wrapping. Browser tests cover entrances, selection/deep links, empty search, mobile/dark views, readable navigation and JavaScript-free links. The previous map design test is updated to the intentionally replaced visual surface. Original article/capsule/index contracts remain active.

Local build and preview use a separate worktree with independent writable caches. Packages are shared by symlink; concurrent worktrees' generated Astro data are not shared. Production-build browser review is performed against an owned Astro preview, never against the dev server.

Release gate: unit tests, Astro check/build, focused browser checks, full PR CI and actual production page readback. Screenshots and final release evidence are retained here or in the PR review record.

## Local acceptance

139 unit tests passed; Astro check/build completed with zero errors. 33 browser regressions covering capsule geometry, index proportions, research pages and the new exploration interface passed. After visual review, reversed-card heading ink and balanced preview typography were fixed; all 15 final exploration tests passed, including 320/390/768/1440 widths, dark/light contrast, keyboard selection and JavaScript-free reading. `browser-review.json` records the inspected modes, graph/route counts and zero horizontal overflow. Workspace screenshots are cropped from full-page captures so floating navigation does not obscure the inspected interface.
