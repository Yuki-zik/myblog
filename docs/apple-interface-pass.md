# Apple-inspired editorial interface pass

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
- Production status: pending release. Public target remains `https://a-znk-blog.vercel.app/`.

Design reference: https://developer.apple.com/design/human-interface-guidelines/materials
