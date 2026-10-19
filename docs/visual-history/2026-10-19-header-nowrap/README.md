# Header labels: horizontal six-link navigation (2026-10-19)

## Observed regression

After the sixth primary destination (漫游) was added, the desktop header still gave its brand and navigation equal `minmax(0, 1fr)` columns around a 352px search field. The total capsule content width stays capped at 1068px even on a large screen. Navigation could therefore shrink below the combined intrinsic width of six labels plus the theme control. CJK soft wrapping produced two lines **inside each link** without horizontal document overflow, so the previous overflow checks missed it.

The published `f2181feb` page was reproduced at 901, 1024, 1101, 1280, 1440, 1920 and 2048 CSS pixels. At 1440px, all six labels had two rendered text rectangles/lines, recorded in `before.json` and `before-header.png`.

## Targeted correction

- Allocate the desktop navigation grid column by `max-content`, at both desktop search-width breakpoints. The remaining brand column absorbs the few pixels needed. Keep the capsule width, search caps, scroll timeline and mobile two-row breakpoint.
- Set links to `white-space: nowrap; flex-shrink: 0` and keep theme tools nonshrinking. This protects each semantic label, rather than only preventing page overflow.
- Do not remove the new destination, shrink the font, hide controls, or alter article and map content.

CSS semantics: [intrinsic max-content inline sizing](https://www.w3.org/TR/css-sizing-3/#max-content-inline-size) and [white-space / nowrap](https://www.w3.org/TR/css-text-3/#white-space-property).

## Regression coverage

`tests/e2e/header-nav-nowrap.spec.ts` measures actual text-line rectangles, six links on the same row, navigation inside the shell, and no overlap with the brand/search field. Desktop widths: 901/1024/1100/1101/1280/1440/1920/2048; mobile widths: 320/375/390/768/900; top and scrolled states; light/dark; standard/reduced motion; shared home/article/paper/author routes and no-JavaScript rendering. Existing capsule and Wander interaction tests are also run.

Validation and deployment results will be recorded after completion; live baseline alone is not a release claim.
