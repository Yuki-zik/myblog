# Visual and interaction pass — 2026-09-06

Status: implemented and verified locally on `codex/visual-interaction-pass`; production remains unchanged. No push or deployment was performed.

## Approved direction

Preserve the warm-paper/deep-blue palette, misty cover treatment, and scholarly reader. Make content discovery earlier and mobile search a distinct, legible task. This pass does not redesign topics/archives, add reading history, replace the header animation, or change comment infrastructure.

## Work board and acceptance

| Slice | Owner | Acceptance |
|---|---|---|
| Home and contrast | Home lane | Concise intro; topics and papers CTAs; smaller research signature with native mobile disclosure; topic entrance visible earlier; measured supporting-text contrast at least 4.5:1 in light/dark. |
| Search | Search lane | Desktop dropdown retained; opaque mobile modal in the top layer; no navigation/content overlap; 44px close target; restore scroll/focus; active results remain visible; IME confirmation does not navigate. |
| Reading entrance | Reading lane | Title/summary before oversized imagery; smaller complete cover stack; first body content visible sooner; full paper titles fit a restrained mobile type scale. |
| Integration | Main | Tests fail before implementation; production-build E2E plus unit/build/audit checks; desktop/mobile light/dark screenshot review; no new dependency. |

## Invariants

- Keep paragraph anchors, footnote IDs and scholarly rail data/positioning contracts.
- Keep Waline mounting and production configuration unchanged.
- Keep desktop four-card topic carousel and existing wheel/keyboard behavior.
- Do not import Tailwind preflight or replace runtime theme tokens with literals.
- Keep one search input/results set; preserve existing loading, empty, error and shortcut behavior.
- Do not deploy or push this visual revision to production without a separate publishing step.

## Verification record

New use-case suites: `visual-home.spec.ts`, `search-polish.spec.ts`, `reading-entry.spec.ts`. Baseline production-build run failed all 11 new cases before implementation, while the original 116 unit tests passed. The 12 interaction/entry cases passed after adding the soft-keyboard viewport case and fixing the cover wrapper's inherited aspect ratio. Two additional selected-result contrast cases were added; light failed first, then both themes passed after a local semantic-color adjustment.

Final `pnpm test:all`: PASS — 116 unit tests, 106 production-build E2E tests, 19-page build, paper provenance check, Waline smoke, and configured audit gates. The first broad run exposed two old-design assertions (archive-first CTA and cover-before-title); those were updated to assert the approved new design while retaining route access, body/rail geometry, and cover-layer checks. The final full run passed without skipped E2E tests.

The local design preview is served at `http://127.0.0.1:4174`. Its final build deliberately uses a local SITE_URL and no Waline URL, so reviewing the design cannot accidentally post a test comment to production. The preview server is local/session-bound, not a deployment.

### Visual evidence

- Homepage, 390×844: topic heading moved from approximately 959px to 638px; native research disclosure remains available without requiring a second terminal copy.
- Article, 1440×1000: title/summary precede the cover, and the opening paragraph is now in the first viewport. Both image layers, caption handling, and body/rail widths remain intact.
- Paper, 390×844: full title renders at approximately 30px, with author and resource actions visible. `scrollHeight > clientHeight` alone was a false clipping signal from font ink; the test now checks full title text, visible overflow and no line clamp.
- Mobile search, 393×700: last selected result fits within the list viewport (measured bottom approximately 684px); surrounding page content is not visible through the modal.
- Selected mobile summary contrast failed at 4.39:1 in light mode before the final adjustment. Both computed-color regressions pass >=4.5:1 afterwards; targeted light-mode axe audit reports no violations (incomplete checks are not treated as passes).
- Screenshots are in ignored `output/playwright/pass-*.png`; no production browser settings or deployment were changed.

### Boundaries

- VisualViewport soft-keyboard behavior and IME events are simulated in browser tests, not physical iOS/Android certification.
- Contrast checks composite computed colors; gradient/texture backgrounds still need visual review. No blanket WCAG conformance is claimed.
- The repository has no dedicated lint or coverage command; no coverage percentage is claimed and no coverage dependency was added just for this pass.
