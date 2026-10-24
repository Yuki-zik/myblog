---
title: "A-Znk Blog: Design Manual"
date: "2026-04-11T15:30:00+08:00"
topics:
  - knowledge-network
  - paragraph-review
concepts:
  - anchor-id
summary: How the code, runtime boundaries, and test contracts organize topic-first discovery, reading-first articles, and restrained interaction into a shared design language.
cover:
  src: ../../posts/covers/myblog-design-manual.svg
  alt: An abstract cover illustrating the blog’s paper cards, table-of-contents rail, and warm glow
---

A-Znk Blog was designed around a topic-based knowledge network and articles that remain comfortable to read at length. Borrowing the organizational approach of Apple’s Human Interface Guidelines,[^ref-hig] this manual follows Overview → Foundations → Patterns → Components. An equivalent Markdown edition is available at `/en/design.md`. The source of this document is the implemented experience, existing runtime boundaries, and design contracts captured in tests.[^note-current-source]

## Overview

Two decisions shape the blog: organize the site around topics, and make article pages primarily serve reading. The site’s design has developed around those priorities.

| Design principle | How it appears in the blog |
| --- | --- |
| Clarity | Topic-first navigation, one primary task on article pages, and supporting information placed beside the text |
| Consistency | Clear responsibilities for the `discover` and `reading` runtimes, with shared tokens and component families |
| Deference | Hover effects, animation, and comments remain subordinate to the content |

These principles are already embodied in the site’s structure. As details evolve, I want changes to happen within this framework rather than discard it.

## Foundations

### Color

The color system is organized around semantic tokens such as `page`, `surface`, `text`, `border`, `accent`, and `reading`, which are consumed by different runtimes. The shared interface starts with neutrals: a light-gray page, white cards, and dark-gray text. Blue identifies links, buttons, and status feedback, while paper, code, and notices retain the tones their roles require.

In `discover`, light-gray pages and white cards form the light-mode hierarchy; dark mode separates deep graphite backgrounds from slightly lighter cards. Static blue and amber glows and a fine dot pattern remain in the background, with the homepage’s warm glow becoming purple in dark mode. Solid cards keep text legible, while translucency is reserved for the header.

In `reading`, the article still resembles an independent sheet of paper. Light mode retains warm paper tones; dark mode preserves a distinction between paper and ink. Body text, contents, marginalia, and comments each have a place. Links, progress indicators, and buttons use blue emphasis without making reading depend on large areas of brand color.

### Typography

Fonts are assigned by task. Navigation, buttons, metadata, and discovery-page headings use system interface fonts. Apple devices favor the system font and PingFang, keeping the tool layer clear and familiar. Long-form text uses the reading-oriented serif pairing of `Source Serif 4` and `Noto Serif SC`.

The homepage and discovery pages establish hierarchy through size, weight, and spacing. I retained the code-like research signature: `research.ts` lists research tracks, paths to notes and papers, and real content counts. It uses monospace text inside one native disclosure panel, expanded on desktop and collapsed on narrow screens.

Each layer needs an appropriate voice. The body should feel steady and readable; the table of contents and rail should be light without becoming weak; the homepage needs a focal point without overpowering the content.

### Dark mode

The theme switch cycles through three states: `system → light → dark`. The preference is stored in `localStorage`, and the resolved theme is applied early in page loading to prevent a light-to-dark or dark-to-light flash.[^ref-hig]

Dark mode uses deep graphite for the page, slightly brighter cards, and adjusted text and blue interaction colors. It shares layout and semantic tokens with light mode, maintaining the same hierarchy. Article text has its own paper tones for sustained reading. Following a dark system theme and manually selecting dark mode should produce the same palette.

## Patterns

### Content architecture

The blog has four content collections: `posts`, `topics`, `concepts`, and `papers`. Articles remain the main reading material, situated within a network of topics and concepts. Topics express problem domains; concepts describe local terms or methods; articles connect them as readable nodes. Papers are presented as a separate collection of research outputs.

Accordingly, the homepage does more than list recent posts. It begins with areas of interest, then offers selected writing and recent updates. Topic pages bring introductory paths, related articles, and concepts together. Concept pages lead back to the articles and topics that reference them. Readers can move between problems, concepts, and articles instead of only proceeding by date.

Search follows the same model. Its index brings articles, topics, concepts, and papers into one result set. Readers often remember a problem domain or keyword before they remember an article’s title.

### Reading architecture

The `discover` runtime helps a reader find a useful problem domain; `reading` sustains the rhythm of an article. Article pages have three parts: the table of contents on the left, the heading and body in the center, and the scholar rail on the right. This separates navigation, the main narrative, and supplementary material by information density.

Paragraph anchors provide the infrastructure. Each eligible paragraph receives a location ID. GFM footnotes become explanatory notes or references, then appear in the right-hand rail near their first occurrence.[^ref-tufte] Supporting material follows the argument without repeatedly breaking up the body.

The current comment system uses Waline at the end of the article.[^ref-waline] Paragraph anchors continue to support the table of contents, marginalia, and footnotes, while comments provide whole-article discussion without interrupting the main reading path.

### Interaction

Interactions should provide feedback without becoming intrusive. The header changes between `top`, `compact`, and `hidden` states as the reader scrolls. Search is accessible by keyboard shortcut, the theme control stays in place, and the back-to-top button appears when useful. Tools remain available while generally staying out of the way.

The homepage’s areas-of-interest section adds rhythm to browsing without turning content into an advertising carousel. On desktop, a four-card viewport can move using buttons, arrow keys, or the mouse wheel. Mobile layouts return to a more direct one- or two-column arrangement. The effect comes from movement through content rather than elaborate animation.

All movement must respect `prefers-reduced-motion`. With reduced motion enabled, the page should remain complete, stable, and readable. This applies to reveals, header transitions, card feedback, and the research-signature cursor. Background glows remain static and serve only to establish color layers.

## Components

### Discover shell

The discovery component family gives non-article pages a shared language. `DiscoverShell` owns the environmental layer and main container. `PageHero` provides the opening for each page. `SectionHead` establishes recurring points of rhythm within the content.

Topics, concepts, author pages, and archives contain different material, yet should feel like parts of the same site. The pages vary while their family resemblance remains stable.

### Cards and covers

Cards organize information into units that readers can scan, pause over, and open. Hover feedback is largely confined to edges, shadows, and a slight lift, keeping attention on the material.

`PostCover` handles both manually supplied and fallback covers, with a shared `ghost + main` image structure. The main image provides clear boundaries; the ghost layer spreads color and atmosphere around it. Homepage features, article cards, and archive tiles can therefore share one visual family without reinventing their cover treatment.

### Table of contents and scholar rail

The table of contents is part of the reading instrument. On desktop, `TocSidebar` emphasizes section hierarchy and the reader’s current location. On mobile, the same heading data becomes a lighter collapsible list.

`PostScholarRail` moves figures, notes, citations, and references beside the body while keeping their relationships traceable. It adapts the marginalia of scholarly writing to the browser. For long-form knowledge writing, this can be more effective than repeatedly inserting large explanatory panels into the text.

### Waline comments

`WalineComments` places the third-party commenting system behind a clear boundary. Article pages provide a path and a mounting point. The wrapper handles theme integration, error fallback, missing configuration, and initialization failures.

The comment system can then be replaced, extended, or temporarily unavailable without becoming part of the article’s essential rendering chain. Comments add to the reading experience without putting access to the text at risk.

### Spoilers

Spoilers let authors hide material until a reader chooses to reveal it. They can contain answers, Easter eggs, implementation details, or a supplementary conclusion that would otherwise interrupt the reading sequence.

A block spoiler in Markdown looks like this:

```md
:::spoiler[Ending spoiler]
A whole block of hidden content.
:::
```

For a short phrase, use `:spoiler[Hide this sentence for now]`. Without a title, a block spoiler becomes a black mask without visible label text, while retaining an accessible label.

Stating :spoiler[the conclusion often lies in how boundaries are designed] immediately would change the rhythm of this passage. Hiding it lets the reader choose when to reveal it.

:::spoiler[Ending spoiler]
> One of this blog’s most consequential decisions is the explicit separation between `discover` and `reading`. The former helps readers find a problem domain; the latter maintains a steady reading experience.

- Spoiler blocks can contain paragraphs, lists, quotations, and code.
- Version 1 does not allow headings, footnotes, or nested spoilers inside them.
:::

## Guidelines

Do:

- Respect runtime boundaries before refining individual pages. `discover` and `reading` have different responsibilities.
- Express colors, surfaces, borders, and emphasis through semantic tokens before adding local styles.
- Keep the table of contents, anchors, footnotes, and scholar rail on the same location chain.
- Make interaction serve browsing and reading rather than create another competition for attention.
- Encapsulate third-party capabilities behind boundaries, as with Waline, so their failure does not affect the article itself.

Don’t:

- Bypass shared tokens or runtime constraints for an isolated page effect.
- Fill article bodies with comment threads and explanatory panels again.
- Loosen heading, anchor, or footnote rules casually: the contracts for both the table of contents and rail would drift.
- Copy the homepage’s visual language everywhere without considering content density and reading tasks.

## Looking ahead

The next refinements follow the same direction: make `discover` a more navigable knowledge map and `reading` a page worth staying with. Whether the work strengthens search, expands author and archive pages, or improves the experience around Waline, the priorities remain content organization, reading rhythm, and clear boundaries.

## References

The following sources influenced this manual’s organization, approach to reading, and comment-system boundaries.

[^note-current-source]: This document describes design decisions implemented in the repository. Its sources are the runtime boundaries, article structure, component implementations, and test contracts rather than descriptions of historical design mockups.
[^ref-hig]: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/). The manual borrows the principles of clarity, consistency, and deference, together with the organization from foundations to patterns.
[^ref-tufte]: [Tufte CSS](https://edwardtufte.github.io/tufte-css/). The blog’s treatment of marginalia, footnotes, and the primacy of the main text draws on this kind of paper-oriented reading design.
[^ref-waline]: [Waline](https://waline.js.org/). The current comment system integrates Waline into article pages through a dedicated wrapper.
[^ref-misty-shadows]: Misty Shadows UI Gallery. A reference for the homepage’s background glows, code-like research signature, and editorial hero. The interface combines those features with system UI fonts and solid content cards while retaining the site’s existing architectural responsibilities.
