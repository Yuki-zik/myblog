# Waline reading-width alignment — 2026-10-19

The user's screenshot showed the article comments significantly narrower than the reading/related-note body on desktop. The source of the discrepancy is the `.post-waline-comments-section` CSS grid item's combination of `margin-inline: auto` and `max-width`, without a specified `width`: it shrinks to the editor's intrinsic width rather than filling the established reading measure.

## Minimal fix

Set `width: 100%` on the outer comments section in `src/styles/article.css`. Preserve its existing `max-width: 49rem` (and the `52rem` ultra-wide adjustment), centering rules, Waline component/style, post-body typography and the article grid. The adjacent `.post-pager` uses the same content measure. No Waline API or database changes are required.

## Measured visual comparison

Screenshots were made with headless Chromium on the actual public article `https://a-znk.com/posts/paragraph-anchor-design`, first unchanged, then with the *exact candidate CSS declaration* injected into the live DOM (the candidate screenshot is a preview, **not** evidence that production has deployed the fix). Waline was hydrated; its editor and the existing comment were present. Measurements in `measurements.json`.

| Viewport | Before: comments | Candidate: comments | Before: editor | Candidate: editor | Pager | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1493px | 446.4px | 784px | 431.2px | 768.8px | 784px | 0px |
| 390px | 358px | 358px | 342.8px | 342.8px | 358px | 0px |

Visual snapshots:
- `before-1493.png`, `candidate-1493.png` — desktop related-notes + comment editor/list context.
- `before-390.png`, `candidate-390.png` — mobile, unchanged established width.

## Regression contract

`tests/e2e/waline-reading-width.spec.ts` asserts at 390 / 900 / 1180 / 1493 / 1920px that the outer comments section has the same x-position and width as the existing article pager and the Waline mount fills its parent; document width does not overflow the viewport. This guards against reintroducing shrink-to-fit, unintended mobile growth or unrelated reading-layout changes.
