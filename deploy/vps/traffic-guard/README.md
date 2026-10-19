# VPS blog mirror traffic guard (deployed 2026-10-19)

This is the **versioned source** of the separately managed Nginx guard on the mirror VPS. The main site `https://a-znk.com/` stays on Vercel. The static mirror `https://vps.a-znk.com:8443/` runs on the VPS; existing Xray 443/24443, SSH 13424, Waline, DNS and certbot ownership must not be changed. `deploy/vps/deploy.sh` still publishes only static `dist/` releases and must not overwrite this Nginx config.

## Inbound policy

| Request | Outcome |
| --- | --- |
| HTTP 80, unknown hostname or bare IP | Nginx 444 (drop, no HTML body). |
| HTTP 80, `vps.a-znk.com/.well-known/acme-challenge/*` | Serves certbot `webroot` tokens, preserving HTTP-01 renewal. |
| HTTP 80, `vps.a-znk.com` other paths | 308 to `https://vps.a-znk.com:8443$request_uri`. |
| HTTPS 8443, unknown TLS SNI | Reject handshake. |
| HTTPS 8443, valid SNI/Host, outside APNIC CN allocated/assigned CIDRs | 302 to `https://a-znk.com$request_uri`; no static content transfer. |
| HTTPS 8443, CN IPv4/IPv6 allocations or localhost | Serves Astro static content; 5 requests/s/IP (burst 40), max 12 concurrent connections/IP; 429 above threshold. |
| Invalid mirror route | Tiny text/plain 404; actual status 404 and `X-Robots-Tag: noindex, nofollow` retained. |

This is **registration-country IP filtering**, not a precise physical-location service. Clients exiting through overseas VPNs/CDNs, or from Hong Kong/Macau/Taiwan, get redirected to the always-available Vercel site. The rule applies to the *blog only*, never to Xray or SSH.

## Installation and safe update

The deployed configuration and state were tested in place on 2026-10-19. For fresh deployments, install only after making backups and confirming the exact live Nginx setup, ports, and certbot webroot. Do not blindly overwrite other machines' configs.

```bash
# On the VPS as root; in the cloned repo, after inspecting local differences:
install -m 755 deploy/vps/traffic-guard/update-blog-cn-cidrs.py /usr/local/sbin/update-blog-cn-cidrs
/usr/local/sbin/update-blog-cn-cidrs --bootstrap  # seeds /etc/nginx/blog-cn-cidrs.conf
cp -a /etc/nginx/sites-available/a-znk-blog.conf /root/a-znk-blog.conf.pre-traffic-guard
install -m 644 deploy/vps/traffic-guard/a-znk-blog.conf /etc/nginx/sites-available/a-znk-blog.conf
nginx -t && systemctl reload nginx
install -m 644 deploy/vps/traffic-guard/a-znk-blog-cn-update.service /etc/systemd/system/
install -m 644 deploy/vps/traffic-guard/a-znk-blog-cn-update.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now a-znk-blog-cn-update.timer
systemctl start a-znk-blog-cn-update.service
```

Only one existing Nginx site file is replaced; its `sites-enabled` symlink must already point to it. The example commands assume the original HTTP-01 webroot at `/var/lib/letsencrypt` and a valid cert at `/etc/letsencrypt/live/vps.a-znk.com/`. Always check both before reload. `nginx -t` must pass. For the 2026-10-19 production rollout, old config and a dedicated rollback script are stored privately at `/root/blog-traffic-guard-20261019/rollback.sh` (SSH required). This directory is **not** tracked in Git; never commit private certs or Xray data.

The updater downloads APNIC's public delegated report over HTTPS every Sunday at 03:40 UTC with up to one-hour systemd jitter, parses allocated/assigned CN IPv4 and IPv6, validates sufficient blocks and a known CN/non-CN sample, coalesces CIDRs, and atomically switches the include. If `nginx -t` or reload fails, the prior table is restored. In a network outage the previous CIDRs remain active. It does not perform automatic DNS changes or install an iptables rule.

## Offline parser tests

From the repository root, run `python3 -m unittest discover -s deploy/vps/traffic-guard/tests -v`. This synthetic fixture checks that IPv4/IPv6 CN rows are parsed, other countries are omitted, and a truncated feed fails closed. Production additionally requires `nginx -t` and external endpoint probes.

## Validation and troubleshooting

```bash
sudo nginx -t
systemctl is-active nginx
systemctl list-timers a-znk-blog-cn-update.timer
journalctl --no-pager -u a-znk-blog-cn-update.service -n 30
curl -I https://a-znk.com/
curl -I https://vps.a-znk.com:8443/
curl -I http://vps.a-znk.com/
```

Validates normal mirror access only from CN/allocation IPs; from other sources a 302 to Vercel is expected. Verify the *actual* Let's Encrypt challenge file through external HTTP before considering HTTP-01 renewals preserved. The 2026-10-19 rollout tested the token end to end (200 and exact content), local 8443 200, non-CN route 302, unknown SNI denial, bare-IP HTTP denial, tiny 404, rate-limit 429, compression and the updater's systemd one-shot. Read logrotate-managed `/var/log/nginx/a-znk-blog-{denied,http,tls}.access.log` if a future change affects traffic. Do not interpret mirrored-blog egress as total VPS/Xray egress.
