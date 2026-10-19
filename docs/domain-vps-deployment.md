# a-znk.com production domain and VPS mirror — 2026-10-18

## Deployment architecture

- **Primary website:** `https://a-znk.com/`, Vercel `myblog`. The Production/Preview `SITE_URL` environment variable is set to this origin. The page canonical tags, RSS, robots and sitemap should all use the new domain.
- **Nameservers:** the Dynadot registrar delegates to `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. Vercel DNS hosts an apex ALIAS, `www` CNAME, and `vps` A record for `38.148.253.95`.
- **Mirror:** independent Ubuntu VPS, `http://vps.a-znk.com/` and `https://vps.a-znk.com:8443/`, running Nginx serving prebuilt static assets; existing Xray keeps port 443 and 24443.
- **Comments:** existing Waline Vercel deployment and existing database, no migration.

## Verified 2026-10-18

- Existing project already received both apex and www Vercel domain aliases and DNS delegation; Vercel reports both configured correctly.
- A fresh Production redeploy built the original Astro site using the new SITE_URL; HTML canonical, robots, RSS and sitemap show `a-znk.com`. CDN TLS verification passed.
- A detached worktree passed 121 unit tests and generated all 20 Astro pages with new canonical. VPS content is maintained in atomic release directories under `/var/www/a-znk-blog/releases` with `current` symlink; the first HTTP mirror received 26/26 content/routing checks.
- A Let's Encrypt cert for `vps.a-znk.com` was obtained using the existing port-80 HTTP challenge, and Nginx now listens on port 8443 with a valid certificate. The certbot.timer is enabled and a deployment hook reloads Nginx on renewal. Mainland direct HTTPS to 8443 returned 200 with valid TLS.
- Xray configuration hash remains unchanged; both original listeners remain running.

## Domain migrations and pending verification

- Vercel project-domain redirect for `www.a-znk.com` → apex was configured as HTTP 301. The Los Angeles edge confirmed query/path preservation. Different Vercel edge caches can require propagation time.
- Host-only permanent redirect rules for the two legacy `.vercel.app` aliases are versioned in `vercel.json`; they intentionally exempt the legacy Google Search Console HTML verification path. Confirm production edge activation after merge/deploy and validate a deep path with querystring.
- The owner still needs to add a new `a-znk.com` Search Console Domain property using the Vercel DNS TXT record (or use the existing Google verification HTML on a URL-prefix property) and submit `https://a-znk.com/sitemap-index.xml`, then use the Change of Address tool from the old URL-prefix property after redirect verification. This account-side step must be verified with the owner's Google account.
- The VPS mirror currently updates through the local `deploy/vps/deploy.sh` command (no automatic CI update configured yet), and does not participate in automatic Vercel failover. Public mirror URL requires `:8443` as the standard HTTPS port is owned by Xray.

## Operations / rollback

1. Rebuild and publish: `bash deploy/vps/deploy.sh`. Requires an SSH key accepted by VPS and Node/pnpm on the build machine; no Node build runs on the 453MB VPS.
2. Static VPS rollback: atomically repoint `/var/www/a-znk-blog/current` to a previously verified release. Test homepage/404 and leave Xray unchanged.
3. Nginx configuration: `/etc/nginx/sites-available/a-znk-blog.conf`; header map: `/etc/nginx/snippets/a-znk-blog-headers.conf`. Root-only pre-deployment backup: `/root/blog-deployment-20261018`.
4. Certbot renewal: `certbot.timer`, webroot `/var/lib/letsencrypt`, hook `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh`.
5. Vercel SEO rollback: change Production `SITE_URL` back, redeploy; revert hostname redirect rules if necessary. Keep both domains verified and the Google owner-verification file.

No additional domain purchases, paid add-ons, Waline database changes or Xray restarts were made.

## 2026-10-19: production mirror bandwidth guard

The Nginx-only guard on 80/8443 was deployed and checked without touching Xray 443/24443, SSH 13424, Vercel, DNS or certbot. For current route semantics, source configuration, updater cadence, testing and rollback, use [`deploy/vps/traffic-guard/README.md`](../deploy/vps/traffic-guard/README.md). The 2026-10-18 description above remains the historical baseline.

The prechange sample of mirrored Nginx logs contained roughly 440 HTTP and 140 HTTPS requests, with 389/133 requests from addresses outside APNIC CN allocations. The recorded response-body bytes for those requests were about 13.0 MB and 2.75 MB. This log sample includes deployment validation and scanners, and it does not measure Xray bandwidth; it illustrates only the avoidable *static mirror* response cost.

Live checks confirmed: Vercel apex 200; unknown HTTP Host/localhost bare-IP drop; `vps` HTTP 308; the external HTTP-01 challenge returns exact content 200; CN/local mirror 8443 200; non-CN source 8443 302 to the same path on Vercel; unknown 8443 SNI fails handshake; missing pages 404 with a 10-byte text body; excessive requests 429; gzip 200; service timer, Nginx reload and existing protected listeners all healthy.
