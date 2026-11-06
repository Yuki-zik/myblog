# Blog analytics operations

## Scope

Frontend source: `src/lib/analytics/` and `src/components/analytics/`. Collector:
GoatCounter 2.7.0 (Go binary + SQLite), independent from Astro and Waline.
The existing VPS has 453 MiB RAM; do not add Node/PostgreSQL/Docker services or
change Xray 443/24443, SSH 13424, or private traffic monitor 18765.

- Binary `/opt/blog-analytics/goatcounter`; SHA-256 of the official linux-amd64
  gzip: `98d221cb9c8ef2bf76d8daa9cca647839f8d8b0bb5bc7400ff9337c5da834511`.
- Source release: https://github.com/arp242/goatcounter/releases/tag/v2.7.0
- SQLite `/var/lib/blog-analytics/analytics.sqlite3`, user `bloganalytics`.
- Internal listener `127.0.0.1:18766`; public TLS uses existing port 8443 and cert.
- Dashboard: `https://vps.a-znk.com:8443/analytics/`, private account login.
- Main site `/analytics` redirects there. No dashboard API proxy on main site.
- Credentials are NOT in Git. Author's trusted MacBook:
  `~/.config/myblog-analytics/admin-credentials.json` (0600). Server recovery copy:
  `/root/.config/blog-analytics/admin.json` (0600). Never print these in logs.
- SMTP is intentionally not configured. Password-reset emails cannot be delivered;
  recover with authenticated SSH and `goatcounter db update user`, then update the
  private local record. TOTP can be enabled by the author in the account settings.

## Installation / upgrade contract

Download the exact official release, verify its digest before execution. Create a
system user and 0750 state directory. `goatcounter db create site -createdb -vhost
vps.a-znk.com -user.email <author>` asks for a password interactively. Do not use
sample passwords or create an unauthenticated/public dashboard.

Install `blog-analytics.service` in `/etc/systemd/system`, keep SQLite ownership
`bloganalytics:bloganalytics`. Defaults are hardened, with MemoryMax=128M and
GOMEMLIMIT=80MiB. Do not change collection/storage settings during a live write:
stop collector, take a validated backup, change documented settings, restart.

Site settings used: public=private, allow_counter=true, data_retention=730,
collect=214 (referrer + browser/OS + country + language + transient session).
Screen size, regions and individual hit history are OFF. The dashboard's
`totalpages` widget uses `no-events=true`; event rows remain separately filterable.

Nginx deployment is specific to this existing mirror. Preserve the previous
configuration under `/root/.config/blog-analytics/`. Install `nginx-maps.conf` in
HTTP context and the location/proxy snippets in `/etc/nginx/snippets/`. Update the
mirror's existing geo check to `$blog_mirror_redirect` and method check to
`$blog_method_allowed`, and include `nginx-locations.conf` in its TLS server.
Public counters are restricted to article paths: TOTAL and event counts are NOT
public endpoints. Collector/admin access logs are disabled. Validate `nginx -t`
before reload. Do not use `HEAD` as a GoatCounter health probe: it returns 405.

The main Vercel rewrites expose only `/_analytics/count` and
`/_analytics/counter/:path*`. The mirror handles these paths locally. Neither
configuration forwards private administration APIs through the public prefix.

## Backup / recovery

Install `backup.py` at `/opt/blog-analytics/backup.py`, create
`/var/backups/blog-analytics` (0700), install the backup service and timer.
`systemctl enable --now blog-analytics-backup.timer`. The timer takes an online
SQLite backup daily at approximately 04:30 UTC. Each backup uses SQLite's backup
API (safe with WAL), validates `PRAGMA integrity_check`, writes 0600 files, and
retains 14 days. No unencrypted backup is published to Git, static pages, or CI.

Manual check: `systemctl start blog-analytics-backup.service` then
`journalctl -u blog-analytics-backup.service -n 10 --no-pager`.
Test backup/restore code with `pnpm analytics:check` (synthetic database only).
Recovery: stop collector, preserve the current DB and WAL/SHM privately, validate
the selected backup, restore it as `analytics.sqlite3` with owner/group
`bloganalytics` and 0640 mode, restart and verify authenticated dashboard counts.
A same-host backup protects against accidental changes, NOT loss of the VPS.
An off-host backup can be copied over the author's authenticated SSH connection;
no automatic cloud backup or third-party subscription is configured.

## Health / rollback

`systemctl show blog-analytics -p ActiveState -p MemoryCurrent -p NRestarts`
`systemctl list-timers blog-analytics-backup.timer`
GET `/analytics/` without login must redirect to `/analytics/user/new`.
Unknown article counter returns 404; frontend intentionally leaves an em dash.
GET `/analytics/counter/TOTAL.json` and event counter paths must return 404.
The mirror homepage still redirects non-mainland IP allocations to the canonical
site; existing proxy/SSH listeners must remain intact.

Frontend kill switch: `PUBLIC_ANALYTICS_ENABLED=false` and rebuild/redeploy; no
tracking requests then occur. Reverting the feature PR removes collection and
public counters while leaving original reading/Walline features unchanged.
Stop only `blog-analytics.service` to disable backend; clients fail silently.
Do not disable the unrelated private VPS traffic monitor.
