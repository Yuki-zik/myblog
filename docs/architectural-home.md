# Architectural drawing homepage

Status: live at https://a-znk-blog.vercel.app/. Latest update: PR #11 orange drafting accents, merge `018b53ed3b36610136e0f5e7df69ff7435f963d9`.

## Approved direction

The user approved the full-canvas architectural poster after rejecting rounded controls, red/black Soviet references, and conventional two-column or equal-card hero layouts. The homepage uses an oversized A-Znk name, a single dominant white architectural drawing, a lower-left technical annotation and thin navigation lines. The full research signature remains real content sourced from the existing author profile and collections.

Only the homepage selects `headerVariant="drawing"`. Other discover routes and scholarly reading pages retain their own shell. Search, theme resolution, native details, four-card domain carousel, featured ghost/main covers, paragraph anchors, TOC and Waline contracts remain in place.

## Asset provenance

`src/assets/home/research-architecture.webp` is an original generated conceptual architectural illustration approved in the prototype. It is fictional scenery, not a photograph of a real institution or a scientific result. The original PNG is preserved outside the repository in the task's generated-image folder.

- Original: 1586 × 992 PNG, SHA-256 `1cd1ac3a2f7816824412fcd587584306aa35249d931a299996bf84d10ce12b68`.
- Committed asset: 451430-byte WebP, SHA-256 `b46f34f46ac68a0160c6e88fb413bd6bda88372984a0c3c81486e34741db8bed`.
- Astro emits responsive widths 768/1280/1586 with `sizes="100vw"`, eager loading and high fetch priority. No remote image service or new dependency is needed.

## Rendering contract

- Desktop: full-width drawing; large upper-left identity; lower-left opaque paper annotation; flat header with 40px edge insets.
- Tablet: the research disclosure participates in normal flow at 768–1023px, so expansion increases hero height without covering the introduction.
- Mobile: identity followed by a cropped drawing and one native collapsible research note. Header navigation remains immediately available.
- Dark: the resolved color scheme controls both paper/ink tokens and drawing inversion. Explicit dark and system-on-dark must match.
- Code text is painted on an opaque surface so its contrast is independent of the image. CTAs use underlines, 44px targets and visible focus.
- The art remains behind interactive content. Content is server-rendered and usable without adding a new animation runtime.

## Verification

Evidence directory: ignored `output/architectural-home-2026-10-16/` (work began before midnight CST).

The new architectural contract was written first: the old implementation failed the expected image/header checks while the existing mobile disclosure passed. Subsequent full-suite, browser and deployment results will be recorded here after completion.

Browser inspection of the built output confirmed the 1440px light/dark composition, 390px collapsed/expanded signature, 900px expanded layout with a 32px separation, lower content indexes and an unclipped search panel. Targeted screenshots are saved in the evidence directory.

- Local unit tests: 116/116 passed. Astro check and 20-page build passed through the E2E-owned production server.
- Final full E2E attempt: 138/139 passed; the unchanged article-header compact-dwell case remained compact at its timeout. A targeted rerun with trace passed (1/1). Do not describe this local attempt as one clean full run; the exact-head cloud run is the remaining release gate.
- Architectural tests include 768/900/1023px expanded disclosure geometry. They reproduced the overlap before the fix and now pass without lowering the spacing assertions.
- Paper provenance, Waline smoke and configured audit gates passed. Existing low-severity findings and Waline audit exceptions remain unchanged.
- No dependencies, database writes or public test comments were added.

## Production acceptance — 2026-10-17

[PR #10](https://github.com/Yuki-zik/myblog/pull/10) passed all 139 E2E cases in one cloud run, plus unit/build/provenance/Waline/audit gates. The frontend and Waline previews were successful for the exact PR head `4940c64` before merging. [Post-merge CI](https://github.com/Yuki-zik/myblog/actions/runs/38931424990) also completed successfully before handoff.

- Frontend `dpl_8QQtuy9nxKangjHEX3ZwtsQXok2X` and Waline `dpl_BLERnwSaF4A6PMN38LQsEu464mn3` are Production/READY for merge `6b77d29`.
- Both branded and previous domains remain assigned and return HTTP 200. Home canonical points to the branded origin.
- The public drawing is 373140 bytes; SHA-256 `a889f90d6d8f3bb79fb80dcc09fc219279b05d193b6ea5bd81af0a2a545360f6` matches the locally built asset.
- Public homepage, topics, papers, article, search index, sitemap and Google verification file all return 200. Anonymous comments return HTTP 200 / errno 0 and preserve the original one comment.
- Fresh production browser shows drawing header, loaded artwork and the A-Znk heading; desktop and 390px mobile have no horizontal overflow. Search returns five real results for 设计. The mobile signature starts collapsed. No browser console errors were observed in the checked page.
- Production screenshots and the compact HTTP/browser reports are saved in the evidence directory. Unrelated workstation notes were preserved byte-for-byte and excluded from the release.

## Orange drafting accents — 2026-10-17

The follow-up retains the approved image and composition while tying UI elements to the drawing through one orange palette. A colored name separator, code-note title strip and leader, numbered section headings, topic IDs, cover registration corner, square article labels and footer controls form the same annotation language. All new colors live in `tokens.css`, scoped to the drawing homepage; brighter surfaces and darker small-text ink are distinct. Dark mode uses the resolved color scheme.

Four new browser checks were demonstrated red before implementation. They verify the unchanged artwork/name, orange accents and code title strip, 3:1 large-type and 4.5:1 small-type contrast, hidden index semantics and isolation from the default article header. 116 unit tests passed. The complete local E2E attempt passed 142/143; the same pre-existing article-header dwell case timed out, then the focused 11-case rerun passed, including that case. Desktop light/dark, 390px collapsed/expanded content and the content sections were visually checked. [PR #11](https://github.com/Yuki-zik/myblog/pull/11) passed all 143 E2E cases in one cloud run, along with the existing verify gates, and merged as `018b53e`. Production acceptance passed. Evidence: ignored `output/orange-drawing-2026-10-17/`.

The GitHub Vercel integration reports successful Production deployments `7135404396` (frontend) and `7135407307` (Waline) for the merge SHA. The public homepage has the new name accent and all three section indices. Browser-computed colors are `rgb(241, 92, 0)` for the name separator and `rgb(255, 106, 0)` for the note title strip; desktop/mobile have no horizontal overflow. Search returns five results and displays orange selection/focus treatment. No console errors were observed. The original illustration hash is unchanged, main routes/SEO resources return 200, and comments return HTTP 200 / errno 0 with the original one comment. [Post-merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39007009306) completed successfully before final handoff.
