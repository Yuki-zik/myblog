# Production readiness

Updated: 2026-09-06. This checklist distinguishes verified code from a verified deployment.

## Current result: live

- Website: https://myblog-silk-one.vercel.app
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
