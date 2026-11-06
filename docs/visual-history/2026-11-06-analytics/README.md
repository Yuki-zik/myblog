# Analytics reading/privacy evidence — 2026-11-06

Exact source started from production 0940315. Production-build browser suite:
15/15 passed (analytics consent/headers/DNT/GPC/engagement/outbound + bionic +
reading accessibility), 2026-11-06. Unit tests: 187/187; synthetic WAL backup
and restore: 2/2. Astro build, sitemap and bilingual integrity checks passed.

privacy-{zh,en}-{light,dark}.png are real 390px browser captures of the new
privacy page. All analytics traffic in integration tests is intercepted and
served from localhost. Counter fixture 1,234 is used only by automated tests,
not these privacy screenshots and never as a production metric.

Full CI, backend operational restore, and live first-party route verification
remain release gates until their evidence is appended. No historical data backfill.

## Backend operational evidence

- VPS service enabled, zero restarts; approximately 41 MB current memory, 128 MiB cap.
- Nginx syntax validation passed. Existing SSH13424, Xray443/24443, mirror8443, and private monitor18765 unchanged.
- GET dashboard redirects unauthenticated users to its login page. Credentials are private on the author's MacBook; no credentials appear in this repository. Authenticated dashboard browser login was not completed.
- Vercel preview's first-party counter request reaches the collector over TLS8443.
- Daily 04:30 UTC backup timer enabled; live SQLite backup restored into an isolated temporary file, integrity_check=ok, site count=1, file permissions0600.
- Isolated ingestion test: two identical article requests yield one tracked visit; English article is counted separately; bionic event recorded as event and excluded from public counters. Production path rows remained0 before/after.
- Upstream 2.7.0 visitor counter has a fixed path-prefix assumption under /analytics; mitigated with a one-minute read-only validated aggregate exporter, not a collector fork. Four Python backup/counter tests pass.
- Public TOTAL and event counter endpoints return404; unknown article remains unavailable.
- SMTP password-reset and off-host backup are not configured. No billing plan or paid service changed.

Final full CI and production deployment status are recorded in PR60 and its merge/deployment checks.
