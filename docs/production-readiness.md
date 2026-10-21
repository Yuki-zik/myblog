# Production readiness

## 2026-10-21 content dossier release

[PR #42](https://github.com/Yuki-zik/myblog/pull/42), merge `8ddcaae`, unifies author practice/focus, recent home notes, archives and paper records through ContentDossier. New records remain profile/collection driven; imagery is optional, core information stays visible, and secondary links/citations use native details. The approved hero, carousel, capsule and reader are preserved.

[Exact-source CI](https://github.com/Yuki-zik/myblog/actions/runs/39597722563) passed **145 unit / 279 E2E checks**. Frontend deployment `7225827546` succeeded. Live a-znk.com checks confirmed 4 projects, 2 focus notes, 3 recent covers/summaries, 4 archive records and 2 papers; keyboard disclosures, links, mobile width and no browser runtime errors passed. The first paper title is at 452.17px; the reading TOC pins at 85.59px and tracks the actual heading. Same-origin Waline readback returned errno 0 / count 1. The production SEO audit passed for 19 canonical pages and both paper OG images. Versioned before/intermediate/final/production screenshots and machine readback: `docs/visual-history/2026-10-21-content-dossiers/`. Maintenance: `docs/content-dossiers.md`.

## 2026-10-21 editorial imagery release

PR #40 (`7d4f396`) adds five sourced historical science/engineering plates across topic, author, concept and paper-reference surfaces, using the existing accessible image viewer. The original home, article/archive covers, graph and reading layout remain. Final CI passed 145 unit / 262 E2E checks. Frontend deployment `7217331052` succeeded. Live image decode, multi-image keyboard preview, focus/scroll restoration, mobile layout and the 19-page SEO audit passed on a-znk.com. Rules and attribution: `docs/editorial-imagery.md`; versioned screenshots and readback: `docs/visual-history/2026-10-21-editorial-imagery/`.

## 2026-10-20 discovery composition release

PR #37 (`2606048`) moves the real Wander graph into the first screen and recomposes the author frontispiece around the original photographic portrait, spanning name, and an early publication link. The approved home gateway, recent-label alignment, capsule and reading runtimes remain. Final CI passed 145 unit / 247 E2E checks. Frontend production deployment `7203475153` succeeded; live map/author desktop/mobile screenshots, geometry, image decode and search/preview checks passed on `https://a-znk.com`. Production SEO audit passed for 19 canonical Chinese pages and both paper OG images. Versioned evidence: `docs/visual-history/2026-10-20-composition-redesign/`.

Updated: 2026-10-18. This checklist distinguishes verified code from a verified deployment.

## Restored capsule navigation — 2026-10-18

[PR #21](https://github.com/Yuki-zik/myblog/pull/21), merge `41eda2c`, restores the existing floating capsule, content inset and scroll-driven collapse on drawing pages. Mobile surfaces now cover both rows with 8px vertical padding. Drawing palette markers, shared controller/search nodes and reader styling remain intact.

118 unit tests, 29 chrome checks, 20 final reader/search checks and three mobile TOC cases pass. PR and merge CI each pass 190 E2E cases. Production review caught an older Unicode hash lookup error in the note listener; `d5c6b87` resolves fragments by decoded ID, and the strengthened TOC error assertions and [final 190-case CI](https://github.com/Yuki-zik/myblog/actions/runs/39116964661) pass.

Final frontend `7152886266` and Waline `7152891102` deployments succeed. Live desktop capsule is 1120px wide with 26px corners. Mobile height is 91.05px with 13px bottom clearance while scrolled; search returns seven records, closes with scroll/focus restoration, theme switching works and the Chinese TOC lands at 119.98px without script errors. The article TOC, hover/deep image viewing, six reader routes, 13 search entries and original comment remain verified. [Thirty-five versioned captures and evidence](visual-history/2026-10-18-capsule-header/README.md) are retained.

## Reading typography and citations — 2026-10-18

[PR #20](https://github.com/Yuki-zik/myblog/pull/20), merge `33c75f4`, scales chapter numbers with their headings, raises note text to 15.5px, uses consistent UI numerals/labels and lightens genuine inline code. Hanging indentation keeps narrow multiline titles aligned. Prose/source names in the design manual are ordinary text with named links. The GFM extractor now recognizes empty-string data flags and removes stray return arrows while preserving note/source targets and the existing return control.

118 unit tests and related reading/typography/width cases pass. [Final PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39112664914) passes all 186 E2E cases; [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39113002250) also passes all 186 cases. The earlier 185/186 run exposed a real note-width reduction from larger numerals; the gutter is now 6px and the original 275px minimum is retained. The old h2 padding assertion now checks the equivalent hanging-indent geometry, with actual 320px text-line alignment checked independently. Tested/released trees are identical.

Frontend `7152268358` and Waline `7152275316` Production deployments succeed. Live type metrics match the intended hierarchy; source notes contain no GFM return arrows and their number buttons return focus to the first citation. TOC top is 85.59px; cover hover, full-resolution zoom and exact scroll/focus restoration pass. Six readers match built titles/anchors/footnotes, search has 13 entries and comments retain errno 0/count 1. Nine production screenshots and prior versions are archived: [design and evidence](visual-history/2026-10-18-reading-typography/README.md), [machine-readable verification](visual-history/2026-10-18-reading-typography/verification.json).

## Article cover image viewer — 2026-10-18

[PR #19](https://github.com/Yuki-zik/myblog/pull/19), merge `dc61387`, adds full-resolution cover viewing with fit/original-size modes, native panning, an original-file link and close/Escape/backdrop dismissal. Focus and exact reading scroll are restored; cover depth, TOC pinning and marginalia remain intact. No dependency or backend changes.

116 unit tests and seven targeted viewer cases pass. [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39109831429) and [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39110207475) each pass all 181 E2E cases directly, with identical tested/released Git trees. The earlier local full-suite sizing-transition failure is documented with its correction and added centering assertions.

Frontend `7151841125` and Waline `7151840199` Production deployments succeed. Public browser verification loads the 1600px original, centers 100% zoom at 129/79px, restores scroll 120→120px and cover focus on Escape, and retains TOC top 85.59px and hover lift -6px. All six readers match built titles/anchors/footnotes; search has 13 entries and comments retain errno 0/count 1. Eight production views have no horizontal overflow; 18 implementation/production screenshots and the previous-release reference are retained in the [visual archive](visual-history/2026-10-18-image-viewer/README.md). Machine-readable [verification](visual-history/2026-10-18-image-viewer/verification.json) includes deployment URLs and live readback.

## Article spacing and floating covers — 2026-10-18

[PR #17](https://github.com/Yuki-zik/myblog/pull/17) restores cover depth and breathing room, then [PR #18](https://github.com/Yuki-zik/myblog/pull/18), merge `f910599`, fixes the empty scholar rail intercepting cover hover. Wide paper clearance and the original artwork/reading tracks remain intact. Real note items retain pointer interaction.

116 unit tests, 70 initial reading checks and 20 final pointer/reading checks pass. Final [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39102400338) passes all 174 E2E cases; [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39102758477) also passes all 174 cases, with the same Git tree deployed. Frontend `7150725468` and Waline `7150730089` are successful. Live hover moves the image by -6px while the body stays at 480.859375px; note targeting and reduced motion pass. The six readers, search and comment readback remain healthy. [Versioned screenshots and verification](visual-history/2026-10-18-cover-air/README.md) retain both the visual fix and the pointer defect discovered during production acceptance.

## Discover typography and proportions — 2026-10-18

[PR #16](https://github.com/Yuki-zik/myblog/pull/16), merge `d26427c`, improves readable type and content grouping across home, topics, topic detail, papers index, archives, author and concept pages. Original artwork and the article/paper reading templates remain unchanged. Topic indexes use two columns from 1100px; the home research signature remains one native disclosure in normal flow.

116 unit tests and 18 final targeted E2E checks passed. The [exact PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39099913200) passed 171 E2E cases; [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39100270187) also passed all 171 cases, and the deployed Git tree is identical. Production deployments `7150360880` (frontend) and `7150364130` (Waline) succeeded. Fourteen production captures show no horizontal overflow; thirteen match local screenshot bytes. Six readers retain their content/anchor metadata; search has 13 records and comments return 200/errno 0 with the original comment. Design references, all iterations and machine-readable verification are in [the visual archive](visual-history/2026-10-18-discover-proportions/README.md).

## Article cover composition — 2026-10-18

[PR #15](https://github.com/Yuki-zik/myblog/pull/15), merge `6b18cb8`, preserves all cover artwork while giving the title and image a 1.45:1 composition. Desktop covers measure about 410px at 1440px (440px cap), single-column covers cap at 400px and phones fit their content width. Paper rims, offset backing and orange registration corners refine depth. The reading measure, TOC and scholar rail remain unchanged.

116 unit tests, 68 relevant local E2E tests and all 156 [PR E2E tests](https://github.com/Yuki-zik/myblog/actions/runs/39096690060) passed; the merge Git tree is identical to the tested tree and [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39096990544) also passed all 156 E2E cases. Production deployments succeeded: frontend `7149879978`, Waline `7149883314`. Five production screenshots match local geometry. Desktop TOC stays at 85.59px after 900/1600px scroll; mobile selection closes the disclosure and places the heading at 120.14px. Six public readers, 13 search records and the original comment pass readback. Twelve before/local/production screenshots plus machine-readable verification are archived in [the cover composition record](visual-history/2026-10-18-cover-composition/README.md).

## Floating article paper and covers — 2026-10-18

[PR #14](https://github.com/Yuki-zik/myblog/pull/14), merge `261dca1`, restores the whole article's floating paper surface while retaining white/dark paper and orange annotations. Covers now display the complete artwork at up to 280px with a paper rim and restrained depth. The single-column breakpoint hides the desktop TOC through 1280px so it cannot displace the title. Paper readers and reading controllers remain unchanged.

116 unit tests, a complete 155-case local E2E run, and targeted responsive/rail follow-ups passed. The final [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39050132934) and [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39050526199) each passed 155 E2E cases. Both Production deployments succeeded: frontend GitHub deployment `7142663321`, Waline `7142658377`.

Public HTTP acceptance verified all six readers, canonical URLs, titles, paragraph anchors and footnote targets, plus 13 search records and the original one comment (HTTP 200 / errno 0). The deployed CSS and representative cover match local build bytes. Six local desktop/theme/tablet/mobile screenshots, including the 1240px issue and correction, are archived. Production capture was initially blocked by the locked Mac. The follow-up above recovered old-release desktop/mobile screenshots using an independent browser, then completed the new production screenshot/interaction acceptance. Evidence: `docs/visual-history/2026-10-18-article-paper/` and ignored `output/article-paper-cover-2026-10-18/`.

## Drafting readers — 2026-10-17

[PR #13](https://github.com/Yuki-zik/myblog/pull/13), merge `d10beef`, applies the approved edge-annotation article and metadata-first paper layouts. The reading measure and scholar rail remain intact. Screenshot review caught low-contrast inline code and a mobile TOC ordering bug; the latter now closes the disclosure before measuring the scroll target, including the 1181–1280px layout.

116 unit tests and the complete local 155-case E2E suite passed. The final table-shadow refinement was rebuilt and visually checked. Both [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39020682646) and [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39020988860) passed all 155 E2E cases directly. Both Production deployments succeeded: frontend GitHub deployment `7137600044`, Waline `7137594036`.

All six public reading routes return 200 and match built titles, paragraph anchors and footnote targets, with correct canonicals. Live browser acceptance confirms the 721.59px/18.24px article measure, pinned TOC at 85.59px after scrolling, corrected mobile heading landing at 119.77px, full paper authors and working Cite focus. Search still has 13 records; comments return HTTP 200 / errno 0 with the original one comment. No database/configuration changes or comment writes were made. See `docs/reading-drawing.md`, the 29-image versioned archive under `docs/visual-history/`, and ignored `output/reading-drawing-2026-10-17/`.

## Drawing discovery entries — 2026-10-17

[PR #12](https://github.com/Yuki-zik/myblog/pull/12), merge `0bf8296`, extends the white-paper/orange annotation language to the topic directory, topic detail entries, article archive and publication index. Compact headings, numbered rows and smaller supporting covers move real content into the first screen. Reading routes remain unchanged; their separate design comparison is review-only and is not deployed.

116 unit tests and the complete 148-case local E2E suite passed. After screenshot-driven refinements, 25 targeted cases passed again. Both [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/39014419627) and [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/39014791429) passed all 148 E2E cases directly. Both Production deployments succeeded: frontend GitHub deployment `7136628664`, Waline `7136620000`.

Public acceptance verified all eight changed entries and two reading routes return 200 with correct canonicals, 13 search-index records, and comment HTTP 200 / errno 0 with the original one comment. Desktop topic/publication and 390px archive screenshots were reviewed; archive covers are square and no horizontal overflow was observed. The original article still measures 721.59px wide at 18.24px/1.88; after scrolling 1056px the TOC remains pinned at 85.59px. Nine reading source files retain their baseline hashes. See `docs/drawing-discover-design.md` and ignored `output/drawing-discover-2026-10-17/` for rationale, previews and evidence.

## Orange drafting refinement — 2026-10-17

[PR #11](https://github.com/Yuki-zik/myblog/pull/11), merge `018b53e`, unifies homepage components with the architectural illustration using orange annotation bars, readable ink, section/topic indices and square controls. The palette remains scoped to the drawing homepage; article headers preserve their default theme.

116 unit tests, 143 PR E2E cases, post-merge CI and both previews passed. Local full-suite timing history is recorded in `docs/architectural-home.md`. Both Production deployments succeeded through the existing GitHub integration. Live desktop/mobile computed colors, original image hash, search, primary routes and comment reads were verified. Evidence: ignored `output/orange-drawing-2026-10-17/`.

## Architectural drawing homepage — 2026-10-17

[PR #10](https://github.com/Yuki-zik/myblog/pull/10), merge `6b77d29`, publishes the user-approved full-canvas architectural cover, oversized author name, opaque research.ts annotation and homepage-only flat drawing header. Tablet expansion now grows in normal flow; mobile disclosure, dark mode and the existing reading runtime remain functional.

116 unit tests, all 139 PR E2E cases and post-merge CI passed; local browser checks cover desktop light/dark, 390px mobile, 900px expanded notes and search. The local full E2E attempt had one unchanged header-timing timeout, followed by a successful targeted rerun; the exact-head cloud run passed all cases directly. Both Production deployments are READY, the public asset matches the local build hash, main routes/SEO files return 200, and comments retain HTTP 200 / errno 0 with the original one comment. See `docs/architectural-home.md` and ignored `output/architectural-home-2026-10-16/` for evidence.

## Personal research workspace refinement — 2026-10-16

[PR #9](https://github.com/Yuki-zik/myblog/pull/9), merge `edd1b8a`, implements the approved author-led homepage composition, thin code window, localized ambient light, larger featured cover and ruled recent-note list. The original research.ts content, native disclosure, carousel, cover stack and TOC fix remain intact.

116 unit tests, 80 targeted production E2E and 133 PR E2E cases passed. Real desktop light/dark and 390px visual checks passed. Frontend `dpl_AGAHe44tVBp3CJ4En3AYWBH2MHfW` and Waline `dpl_8uQL9bFZpGws21WFDF8memJANpnL` are Production/READY. Public homepage checks confirm the new composition and no horizontal overflow. Evidence: `docs/apple-interface-pass.md` and ignored `output/research-workspace-2026-10-16/`.

## User-feedback repair — 2026-10-16

[PR #8](https://github.com/Yuki-zik/myblog/pull/8), merged as `1e2db3d`, restores the user's original `research.ts` introduction and colored ambient layers, and fixes the reading body's scroll-root conflict so the article TOC remains pinned. 116 unit tests, 65 targeted production E2E and all 131 PR E2E cases passed. Both new pinning tests were demonstrated failing before the fix.

Frontend `dpl_3izh33KfJS139YWJKCXjyX4tgZkn` and Waline `dpl_3hShoMpgFUhrtAFx5hqpQMo2Acec` are Production/READY for the merge SHA. Public browser checks confirm viewport pinning and chapter changes at two scroll positions, restored profile code and colored home layers. Details and screenshots: `docs/apple-interface-pass.md`, ignored `output/restore-character-2026-10-16/`.

## Current interface release — 2026-10-16

[PR #7](https://github.com/Yuki-zik/myblog/pull/7) merged as `16052d6`: system UI typography, neutral solid content panels, blue interaction accents and a real homepage research overview. The single responsive search mount, topic carousel, scholarly reader and Waline boundary remain intact. A pre-existing number-button reset was corrected after Linux CI exposed its effect on sidenote width.

116 unit tests, build/type checks, paper provenance, Waline smoke and existing dependency gates passed. Final PR E2E passed 124/124; merged CI also succeeded. Frontend `dpl_FoziXveEiJiR5CqC8QXGqtuUJDnM` and Waline `dpl_HAG5mpabUv7wd3rV66M9N42PEuuB` production checks succeeded. Fresh public Chrome confirms the new home, branded canonical, 390px dark layout and working search. Anonymous comments return HTTP 200 / errno 0 with the existing count 1. Evidence and earlier failed checks are recorded in `docs/apple-interface-pass.md` and ignored `output/apple-polish-2026-10-16/`.

## Current production hostname — 2026-10-16 branded URL

Primary address: **https://a-znk-blog.vercel.app/**. The former address remains an HTTP-200 alias. Frontend and Waline `SITE_URL` values now use the branded origin; README and GitHub homepage were updated. Commit `1a05291` produced READY frontend deployment `dpl_6w5iDwjPCATnRjQKLwB2tpF1L73w` and Waline deployment `dpl_H8W3Mq2YkCKnJekC4VqmRSiv6uF2`.

- 116 unit tests and a 20-page build with the new origin passed. All 19 production sitemap pages return 200 and the new canonical origin. RSS/robots/sitemap and the Google verification file match the new address; real Chrome access succeeded. Application runtime code is unchanged from the preceding release that passed 124 E2E cases.
- Anonymous comments: HTTP 200, errno 0, original count 1, with the new Origin header. No database data or credential changes were needed.
- New-host Search Console ownership is verified. The sitemap's initial fetch error resolved to “成功”; Google's homepage live test passed. A manual new-homepage indexing request hit the daily quota and was not accepted. Indexing remains pending; see `docs/search-discovery.md`.
- Evidence: ignored `output/domain-branding-2026-10-16/`, including public-setting backups and production/sitemap/quota checks.

## Earlier production release — 2026-10-16 site identity

[PR #5](https://github.com/Yuki-zik/myblog/pull/5) merged as `d895679c0e1dc1bfae8dbfd9cb6f6d4592f2f82e`. The public name is **A-Znk的blog**, consistently rendered in the header/footer, document/social titles, existing WebSite JSON-LD, RSS/llms, favicon, design-manual references and repository entry point. Author identity and existing content URLs remain intact. GitHub repository description/homepage were updated to the real site.

- 116 unit tests, 14 targeted E2E tests, and desktop/mobile/icon review passed. [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/38766871780) succeeded with 123 direct passes and one retry-recovered breakpoint-search case; [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/38768245221) passed all 124 cases without a retry-recovered case.
- Both Production deployments succeeded: frontend GitHub deployment `7098152924`, Waline `7098151558`.
- Fresh production checks verified all 19 indexable pages: HTTP 200, branded title, one correctly named WebSite node, consistent canonical, and no accidental noindex. RSS/llms match the new name, and the mobile header fits 390px.
- Google indexing remains **unconfirmed**. Direct Google search hit a CAPTCHA; a separate public site: query had no confirmed result. No owned Search Console property was accessed and no indexing request was submitted. See `docs/search-discovery.md` for the remaining owner step.
- Evidence: ignored `output/branding-search-2026-10-15/`, including before/after heuristic audits. Those scores are not Google ranking or indexing measurements.

## Earlier production release — 2026-10-15 not-found recovery

[PR #4](https://github.com/Yuki-zik/myblog/pull/4) merged as `e4af54c1ac5fdb8c66ab991fffe2de6def397f88`. Missing routes now show a discover-style recovery page with home/topic actions and the existing search. They retain HTTP 404, declare `noindex, follow`, and stay outside the sitemap; ordinary article indexing remains unchanged. Topic entry copy now describes the reading task.

- 116 unit tests, 20-page build, paper provenance, and 7 targeted browser tests passed. [PR CI](https://github.com/Yuki-zik/myblog/actions/runs/38728896478) passed all 120 E2E tests; [merge CI](https://github.com/Yuki-zik/myblog/actions/runs/38731575258) also succeeded.
- Both Production deployments succeeded: frontend GitHub deployment `7091987290`, Waline `7091977538`.
- Fresh production checks confirmed the branded page at a missing article path returns 404 and noindex; searching from it navigates to a real article, which retains normal indexing. Desktop dark/mobile light screenshots and actual home/topic actions were reviewed.
- Evidence: ignored `output/not-found-2026-10-15/`. No dependency, database or paid-service changes were introduced.

## Earlier production release — 2026-10-15 accessibility follow-up

[PR #3](https://github.com/Yuki-zik/myblog/pull/3) merged as `3994b115cb71a23f18052a408a3c15571e6dbe62` and is live on the existing domain. It preserves the GFM footnote description label without adding a TOC heading, gives reading controls distinct landmarks, exposes meaningful metadata/social/carousel semantics, and improves small-text contrast in both themes. Builds refresh Astro's content cache to avoid stale Markdown output after plugin helper changes.

- Verification: 116 unit tests, 19-page build, paper provenance, related interaction/contrast tests, and a complete [117/117 cloud E2E run](https://github.com/Yuki-zik/myblog/actions/runs/38719438726).
- Both Production deployments succeeded: frontend GitHub deployment `7090160875`, Waline `7090170509`.
- Fresh production checks find one valid `footnote-label`, a reading progress landmark, a single named comment region, a named carousel group and social navigation. Light/dark reading axe checks report zero violations; gradient-related incomplete checks remain and were reviewed with screenshots. This is not a blanket WCAG certification.
- Anonymous comments still return HTTP 200 / errno 0 and retain the original one comment. No database/settings changes or public comment writes were part of this follow-up.
- Local evidence is in ignored `output/followup-2026-10-15/`.

## Earlier production release — 2026-10-15

The user authorized updating the existing production domain, `https://myblog-silk-one.vercel.app`. This release includes the previously local discovery/mobile-search/reading pass plus fixes for hidden keyboard search, sticky discover navigation, blocked storage, remote-font loading, RSS discovery/creator metadata, and sitemap/canonical consistency. Archive/topic/map descriptions now speak to readers instead of describing implementation details.

- Local verification: 116 unit tests, 19-page build, paper provenance, Waline smoke, both frozen installs, and both configured audit gates passed. All 114 distinct E2E cases passed locally across interrupted and follow-up runs, then all 114 passed in one complete cloud run. [Release CI](https://github.com/Yuki-zik/myblog/actions/runs/38698416332) and [production merge CI](https://github.com/Yuki-zik/myblog/actions/runs/38699991576) both succeeded.
- Astro is locked to 7.2.8 with its compatible Markdown package. Vulnerable dependency ranges were updated without adding any audit exclusions. Low-severity findings and the original Waline exceptions remain.
- Original comment database restored from INACTIVE to ACTIVE_HEALTHY. Anonymous comment reading returns `errno: 0` and retains the existing one comment. No test comment, schema change, credential change, paid service, or keepalive automation was introduced.
- Vercel CLI login expired; publication uses the existing GitHub integration. Previous frontend production target: `https://myblog-9nb4bzvcp-qianlimaxai-5994s-projects.vercel.app`, GitHub deployment `6289900515`, SHA `762826e7c2dbd8bef6349b137b4d802744549aff`; its successful state was refreshed before this release.
- Evidence: ignored `output/release-2026-10-15/`, including `verification.json`, E2E logs, dependency gate logs, and targeted desktop/mobile light/dark screenshots.
- [PR #2](https://github.com/Yuki-zik/myblog/pull/2) merged as `93364ad41e5ebd996cd2407e17d449a2195e985d`. Both Production deployments succeeded: frontend GitHub deployment `7086757979` (`https://myblog-bl28sigq3-qianlimaxai-5994s-projects.vercel.app`) and Waline `7086768269` (`https://waline-lj6yw3ksq-qianlimaxai-5994s-projects.vercel.app`).
- Fresh anonymous production browser: all 19 sitemap pages return 200 and match their canonical URLs; RSS contains 4 items and 4 Dublin Core creators; scrolled desktop search is visible; the mobile dark paper page fits 390px without horizontal overflow; comment read returns HTTP 200 / errno 0 with the existing one comment. A transient local proxy timeout was followed by successful page and API requests.
- Vercel previews require account login; browser acceptance was performed on the public production domain after the successful exact-SHA preview builds and CI. No preview protection was disabled.

## Previous production record — 2026-09-06

- Website: https://a-znk-blog.vercel.app
- PR #1 merged as `d35c831`; application hotfix `df5e4677a067667a329192a92a4245bcaae37d6b` is on `main` and passed [GitHub CI](https://github.com/Yuki-zik/myblog/actions/runs/34016014007).
- Verified application deployments: frontend `dpl_9YAb7V8y4Uf7RkvM8PenD4TjViHQ`, Waline `dpl_LEs8TzA4ZfPEVZaMowwLnV71R2ne`, both Production/READY for that SHA. Later documentation-only commits may create equivalent deployments; use current Vercel state for operational actions.
- Supabase original project restored to ACTIVE_HEALTHY. No new project, schema migration, comment deletion, or password change was performed.
- Fresh anonymous browser: home, paper index, DUAP detail, search and canonical URLs pass; article comment request returns HTTP 200 / `errno: 0` and preserves the existing one comment. No browser console/page errors observed. No test comment was submitted.
- Embedded font CSP works in a fresh context. An already-open browser retained the prior response policy; do not mistake that cached response for the new deployment.

## Release scope

- Existing discover/reading runtimes, search, SEO, and Waline integration.
- Two published paper entries, year-grouped index and standalone scholarly details.
- Optional PDF enrichment. No author-owned PDFs or generated covers are currently present; missing covers do not prevent publication.
- Unknown publication dates must remain unknown, not synthesized as January 1.

## Verification and release sequence

1. `pnpm install --frozen-lockfile` and `pnpm --dir waline-server install --frozen-lockfile`.
2. `pnpm test:all`; this includes provenance, build/type checks, Waline smoke, dependency audits, and E2E against a production build. No separate lint script is defined.
3. Review targeted desktop/mobile paper screenshots and search/header behavior. Test fixtures use placeholder domains and do not validate production services.
4. Push the reviewed release branch; require fresh GitHub checks and successful frontend preview for the exact release SHA.
5. Confirm existing Vercel project configuration before promoting/merging. Never create a replacement temporary project as a substitute for repairing this production project.
6. Verify production deployment state and domain assignment; inspect the rendered home, paper index/detail, article comments, search, and canonical URLs before declaring live.

## Production configuration

| Setting | Required evidence |
|---|---|
| `SITE_URL` | Actual canonical HTTPS domain of the existing blog, configured in Production and Preview; not a test/example domain. |
| `PUBLIC_WALINE_SERVER_URL` | Actual independently deployed Waline service, configured for both frontend environments. |
| Build settings | Root frontend project, Node compatible with `package.json`, frozen pnpm install, `pnpm build`, output `dist`. |
| CSP | Actual comment origin permitted by `connect-src` in `vercel.json`; do not widen it to all HTTPS origins. |
| Waline | Existing database and origin settings retained; no database migrations or credential changes are part of this release. |

Do not store tokens, database credentials, or exported environment files in Git. Use the existing account's Vercel login/settings. Smoke tests prove module loading, not live database connectivity or successful comment submission.

## Initial deployment evidence

- PR: https://github.com/Yuki-zik/myblog/pull/1 (open when inspected).
- Inspected head: `4940899808d606c19162479bb99e159c62671ff8`.
- GitHub Verify and E2E succeeded for that head.
- Frontend preview `dpl_8SmjTcsdWsPEzGouEvhx5rgS1jzE` failed; Waline preview succeeded.
- Vercel CLI authentication subsequently succeeded. The failed build log explicitly reports missing `SITE_URL` while loading `astro.config.mjs`.
- Vercel confirms `myblog-silk-one.vercel.app` is the project's verified production domain. `SITE_URL=https://myblog-silk-one.vercel.app` has now been added to Production and Preview; the existing frontend install command is hardened to `pnpm install --frozen-lockfile`.
- The existing `PUBLIC_WALINE_SERVER_URL` is `https://waline-smoky-five-24.vercel.app` in Development, Preview, and Production. The current CSP permits this origin; no CSP broadening or credential change was needed.
- GitHub deployment `5689811245` records a successful Production frontend deployment for `619e97428f73fc07a38a78708ea56756c4cf3d7c` on 2026-07-31, with URL `https://myblog-2og6jdyw8-qianlimaxai-5994s-projects.vercel.app`. Confirm it in Vercel before using it as a rollback target.
- Previous frontend production target confirmed in Vercel: `dpl_7ti2Ewm8uKuf7Q66iz7AbR3ycx8F`, state READY; retained as historical rollback evidence.

## Release verification progress

- `d4da940`: GitHub Verify and full E2E succeeded; both Vercel previews READY.
- Local: 116 unit tests and 19-page build passed. Initial full E2E passed 91/92, exposing a stale search type assertion; corrected search suite passed 13/13, followed by the successful full cloud E2E.
- Desktop paper index and mobile dark paper detail screenshots reviewed under `output/playwright/` (ignored local evidence).
- Anonymous production comment loading exposed HTTP 500 from the Supabase pooler. Management API confirmed INACTIVE; the original project was restored and now reads successfully. A second, independent business error (`errno: 1001`) was fixed with upstream `think-validator@1.7.0`; regression tests accept valid input and still reject invalid page, oversized pageSize, and unknown sorting.
- The font policy now allows `data:` only in `font-src`; script/connect policies were not widened.
- PostgreSQL adapter defaults logged connection URIs. The Waline entry now disables connection/SQL logging using supported config keys; smoke exercises the installed adapter without a database connection. Existing historical logs may contain credentials: do not copy raw logs; credential rotation requires a coordinated database/Vercel change.

## Rollback boundary

Retain the previous known-good production deployment in Vercel. If a new production deployment fails functional checks, restore that verified deployment through the existing project; do not delete deployments, change the database, or force-push branch history. The prior known-good deployment ID must be obtained from Vercel before promotion.

## Ongoing operation

- This Supabase organization is on the Free plan. Low database activity may cause pausing again; restoring once is not an uptime guarantee. Review [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) before promising continuous availability. No paid plan, keepalive workaround, or recurring automation was enabled by this release.
- Preserve audit exceptions as explicit debt: the current gates pass, but low-severity findings and pre-existing Waline exceptions remain. Do not describe this as zero vulnerabilities.
- Historical runtime logs may contain the old database credential. Coordinate rotation across all consumers and Vercel before changing it; do not publish, copy, or retain raw connection logs in this repository.
- A successful anonymous comment read proves the read/database path. It does not prove moderation or a new comment submission; no synthetic public comment should be published merely to claim coverage.

## 2026-10-19 — Mainland Waline connectivity repair (candidate, verify before marking production accepted)

Mainland clients can fetch article HTML/static assets from `a-znk.com`, but fail direct DNS/TLS to `waline-smoky-five-24.vercel.app`; the existing backend returns HTTP 200/errno 0 and count 1 from a US VPS. The proposed first-party Vercel rewrite at `/_waline/api/*` and scoped runtime URL selection let CN browsers use the working canonical origin without migrating the Waline service/database. Keep the API rewrite uncached. Record preview and production checks, including comment readback and final browser network routing, in [the dedicated runbook](waline-mainland-access.md).
