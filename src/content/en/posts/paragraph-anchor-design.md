---
title: A Minimal Implementation of Paragraph Anchors and Comments
date: "2026-02-20T11:00:00+08:00"
topics:
  - paragraph-review
  - knowledge-network
concepts:
  - anchor-id
  - optimistic-ui
summary: Inject stable anchors with rehype and connect them to Supabase for extensible paragraph-level comments.
figures:
  - id: anchor-diagram
    anchorId: anchor-rules::p1
    title: Paragraph anchors and comment nodes
    kind: image
    caption: The cover serves as a schematic of the connections between paragraph anchors and comment nodes.
    sourceRefIds:
      - ref-supabase-rls
    image:
      src: ../../posts/covers/paragraph-anchor-design.svg
      alt: A schematic linking paragraph anchors to comment nodes
cover:
  src: ../../posts/covers/paragraph-anchor-design.svg
  alt: An abstract diagram connecting paragraph anchors with comment nodes
---

The foundation of paragraph-level comments is a durable location contract.[^note-anchor-contract] In a conventional blog, comments usually live at the end of an article. Their relationship to a particular paragraph is an informal “replying to that passage,” without a machine-readable anchor.[^note-stable-anchor] That loose association can break quickly as the article changes.

## Anchor rules

First establish the paragraph anchor format, `sectionSlug::pN`, then extend the interactions around it. Permission boundaries can be informed by the Supabase documentation.[^ref-supabase-rls] The format should remain transparent to editors:[^note-anchor-format] when text is rewritten or paragraphs are reordered, the rendering layer remaps anchor IDs rather than requiring authors to maintain them in Markdown.

This leaves room for the database layer to support comments on selected text later. The pair `post_slug + anchor_id` already locates a comment at paragraph level. Moving to `text_selection_offset` would only require another field on the same record, without migrating the old data.

## Interaction details

By default, comment buttons show only a count, keeping thread information from overwhelming the article.[^note-bubble-count] The counterexample is instructive: embedding every paragraph’s complete thread in the main text constantly shifts attention between the article and its comments, making both harder to read deeply.

Threads expand on demand, preserving the main reading path while providing immediate feedback. The expansion animation should be restrained, avoiding a panel that jumps out and destabilizes the layout.

A further refinement is to run `warmup anonymous session` when the component mounts. This avoids concentrating all of the network delay at the moment of the first comment submission.[^note-warmup]

Once discussion moves into a right-hand margin, the paragraph itself needs only a small note marker. This produces a steadier reading path. The design treats paragraph comments as marginalia rather than conventional inline widgets. Tufte CSS describes a similar role for sidenotes:[^ref-tufte-css] supplementary information that does not interrupt the main text’s rhythm.

### State and rollback

An optimistic update needs a corresponding failure and rollback path.[^note-optimistic][^note-optimistic-tradeoff] In this example, a temporary ID identifies the placeholder. If submission fails, that item is removed and the input is restored.

If moderation is introduced later, with `pending` as the default state, the frontend can reuse the interaction. After a successful submission, it can show “awaiting moderation” and remove the temporary item from the visible list. This state-machine design makes behavior more predictable and easier to test.

## Engineering boundaries

The minimal implementation deliberately leaves out comments on selected text. Selection comments introduce offset drift, content-version alignment, and location errors related to line wrapping across devices.[^note-selection-caveat] Getting paragraph anchors working first substantially reduces complexity.

`paragraph anchor first, selection anchor later` describes an engineering sequence. A stable contract comes first; finer-grained location can follow with a lower migration cost.

Once anchors and comment data are decoupled, the database only needs `post_slug + anchor_id`. It does not need to know whether the interface ultimately presents a footnote, sidenote, collapsed thread, or independent review panel. The value becomes clear as the system evolves: replacing a React island with a Web Component need not affect the backend.

### Frontend rendering strategy

Markdown rendering generates the stable anchors, `p[data-anchor]`. A React island scans them and mounts the comment entry points. Separating content compilation from interaction logic allows the interface to change without modifying the anchor contract.

Explanatory notes and references now use standard GFM footnotes. Write explanatory notes as `[^note-example]` / `[^note-example]: ...`, and references as `[^ref-example]` / `[^ref-example]: ...`. The right-hand rail places each note near its first occurrence in the article. Figure descriptions remain in the `figures` frontmatter, with source links pointing to `ref-*` footnotes.

For a paper-like reading experience, the body and margin notes share a serif type system, while the table of contents and buttons use lighter interface typography. This keeps the tools useful without competing with the text. The principle follows Tufte’s emphasis on content: decoration that communicates nothing becomes noise.

## Observation checklist for style debugging

The following paragraphs introduce no new features. They help inspect proportions, type sizes, and the rhythm of margin notes during scrolling.

When Chinese paragraphs contain English terms such as `optimistic update`, `RLS`, and `rehype plugin`, does the line spacing remain comfortable? Do long reference URLs wrap naturally in a narrow column? Does the left-hand table of contents remain visually quiet during scrolling?

In a knowledge blog, reading rhythm often matters more than component polish. A reader may not remember a button’s corner radius, but will notice immediately whether the page is tiring to read. In a three-column layout, body width, margin-note density, table-of-contents type size, and the visibility of footnote markers need to be tuned together.

The Chinese source includes an additional long paragraph to inspect the relationship between line wrapping and a note marker at the paragraph’s end. Ideally, the marker appears as lightly as a printed footnote number, without changing the visual rhythm. Selecting it should immediately reveal the corresponding material in the margin, creating a main-text-and-annotation structure. This is more restrained than inserting a complete comment panel into the middle of the article, and suits long-form reading.

The implementation remains progressively enhanced. Even when the comment API is unavailable, the body, table of contents, footnotes, and references remain readable. A comment entry point can fail or show an error without affecting the article’s rendering. This failure isolation is important for a content site.

[^note-anchor-contract]: Establishing a stable location contract before interaction styling is a prerequisite for later support for comments on selected text.
[^note-stable-anchor]: “Stable anchors first” means fixing the location protocol, then adding comment interfaces, moderation, or selection comments. Once the protocol is stable, replacing higher-level interfaces becomes inexpensive.
[^ref-supabase-rls]: Supabase Documentation — Row Level Security (RLS) for Postgres. <https://supabase.com/docs/guides/database/postgres/row-level-security> A reference for permission boundaries on the comments table.
[^note-anchor-format]: The anchor format is `sectionSlug::pN`. `sectionSlug` is the slug of an H2/H3 heading, and `pN` is the paragraph’s ordinal within that section, starting at 1. Paragraphs at the root use `root::pN`.
[^note-bubble-count]: Count-only bubble buttons accommodate small screens: expanding complete threads causes substantial displacement. A count gives readers control over whether to open the discussion.
[^note-warmup]: Warming a Supabase anonymous session generally takes one POST to `/auth/v1/signup`—around 200–400 ms in the original implementation’s estimate. It runs alongside React island hydration without blocking rendering.
[^ref-tufte-css]: Tufte CSS — Dave Liepmann. A CSS library inspired by Edward Tufte’s book typography, including sidenotes, margin notes, and data presentation. <https://edwardtufte.github.io/tufte-css/> A reference for this project’s marginalia.
[^note-optimistic]: Immediate feedback gives users a sense that the system has acknowledged their intent. Rolling back and restoring the input on failure prevents the action from simply disappearing.
[^note-optimistic-tradeoff]: Optimistic updates improve perceived speed, but incomplete rollback can introduce inconsistent data and greater confusion.
[^note-selection-caveat]: Selection comments are particularly difficult in mixed scripts such as CJK and Latin. Character offsets can drift across rendering engines, font stacks, and CSS text transformations, making location unreliable.
