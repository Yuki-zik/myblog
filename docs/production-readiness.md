# Production readiness

Updated: 2026-09-06. This checklist distinguishes verified code from a verified deployment.

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
- Previous frontend production target confirmed in Vercel: `dpl_7ti2Ewm8uKuf7Q66iz7AbR3ycx8F`, state READY. New release deployment and live comment service are still pending verification.

## Rollback boundary

Retain the previous known-good production deployment in Vercel. If a new production deployment fails functional checks, restore that verified deployment through the existing project; do not delete deployments, change the database, or force-push branch history. The prior known-good deployment ID must be obtained from Vercel before promotion.
