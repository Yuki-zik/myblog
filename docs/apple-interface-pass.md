# Apple-inspired editorial interface pass

## User-directed correction — 2026-10-16

The initial pass removed the code introduction and flattened the atmosphere more than the user wanted. The user explicitly requested their return. The homepage now restores the original `research.ts` profile with source-backed tracks, routes and live counts, plus static colored ambient light; shared discover pages regain blue/amber layers behind readable solid cards. The single native disclosure and mobile collapse remain.

The reported TOC failure was reproduced: the reading body's `overflow-x: hidden` made its other axis compute to `auto`, creating a competing sticky scroll ancestor while the document actually scrolled. Changing it to `clip` fixes pinning without altering TOC logic. This existed before PR #7, but prior active-link tests did not detect that the whole TOC could leave the viewport.

Two new viewport-pinning tests failed before the fix, then the 65-case home/visual/theme/reading suite passed. Unit tests passed 116/116. Actual browser scroll at 960.5px and 1680.5px keeps the TOC top at 85.59px with different active headings; desktop light/dark and 390px disclosure/overflow checks passed. Evidence: `output/restore-character-2026-10-16/`. Release pending.

## Direction

A calm content application inspired by Apple Books and Notes: system UI typography, neutral surfaces, a readable research overview, precise spacing and restrained interaction feedback. Navigation may use a translucent material; article/content panels remain solid and legible.

## Scope and ownership

- Shared typography, semantic palette, header/search and discover surfaces: main agent.
- Homepage composition, research overview, home cards/footer and matching homepage tests: homepage worker.
- Keep the two runtimes, single native research disclosure, responsive search mount, four-card topic carousel, paragraph anchors, scholar rail and Waline boundary.
- No new dependencies or fabricated content.

## Acceptance

- Light and resolved dark schemes have readable supporting text and consistent controls.
- At 390px, the topic entrance remains in the first viewport and the research overview toggles natively.
- Header scroll geometry, search focus restoration and four-card carousel retain their existing behavior.
- Run unit tests and one production E2E pass for affected routes, then inspect desktop/mobile and dark screenshots.
- Publish only after concrete browser checks; retain existing unrelated workstation notes outside the release.

## Evidence

Before image: `output/apple-polish-2026-10-16/before-home.png`.

- Unit tests: 116/116 (`unit-final.log`). Build/type checks passed as part of production E2E startup.
- Full production E2E: 123 passed, 1 failed because the recent-note metadata column narrowed to 160px. Restoring it to 192px made the original test pass (`e2e-recent-fix.log`).
- Final targeted E2E: 37/37 for home/theme/cover, search/focus/IME, and the single-source design manual (`e2e-final-targeted.log`). An earlier targeted startup was interrupted by Astro's project-wide preview lock; no test executed in that attempt. Manual preview was then stopped before retrying.
- Paper provenance and Waline server smoke passed. Existing moderate-threshold dependency gates passed; low findings and pre-existing Waline advisory exclusions remain unchanged (`audit.log`).
- Real Chrome screenshots in the same output directory: desktop home light/dark, 390px home light/dark, mobile search/topics, desktop article. No new overflow or clipping observed. Browser review caught and removed unintended navigation/result underlines.
- Independent review restored the system-dark featured-cover assertions and checked release scope/content truthfulness.
- The first PR run exposed a Linux-only 274.5px sidenote body against the existing 275px minimum. The number button's `all: unset` plus `font: inherit` had overridden its own Georgia typography; restoring that typography fixed the font-dependent column width without changing the threshold. Six related reading/footnote checks passed locally; the remaining wide-layout case first timed out waiting for external fonts, then passed in isolation (`e2e-rail-fix.log`, `e2e-rail-balanced.log`).
- [PR #7](https://github.com/Yuki-zik/myblog/pull/7) merged as `16052d65182221fc1faa49191b30afd61e2630f6`. Final [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/38860391176) passed all 124 E2E cases, and [merged CI](https://github.com/Yuki-zik/myblog/actions/runs/38861792245) succeeded.
- Production checks succeeded for frontend `dpl_FoziXveEiJiR5CqC8QXGqtuUJDnM` and Waline `dpl_HAG5mpabUv7wd3rV66M9N42PEuuB`. Public target: **https://a-znk-blog.vercel.app/**.
- Public acceptance: new research overview/system font/neutral canvas rendered; desktop and 390px dark viewport have no horizontal overflow; mobile search returned 5 results. Home and 13-entry search index return HTTP 200, canonical uses the branded host, and comments return HTTP 200 / errno 0 with the existing count 1. See `production-home.png`, `production-mobile-dark.png`, `production-browser.json`, `production-http.json`, and `release-result.json`.

Design reference: https://developer.apple.com/design/human-interface-guidelines/materials
