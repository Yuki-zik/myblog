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
