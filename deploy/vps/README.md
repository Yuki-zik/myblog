# VPS static mirror for a-znk.com

Build locally with SITE_URL=https://a-znk.com and the existing public Waline URL. Only dist/ is published. Source, secrets, dependencies and comments database stay off the static VPS. Releases live in /var/www/a-znk-blog/releases and current is an atomic symlink.

The mirror provides HTTP on port 80 and HTTPS on port 8443 (`https://vps.a-znk.com:8443/`). A valid Let's Encrypt certificate was issued on 2026-10-18 via the port 80 HTTP-01 challenge, with certbot.timer enabled and a post-renewal Nginx reload hook. Port 443 remains dedicated to Xray REALITY, so standard `https://vps.a-znk.com/` is not served by this mirror. Raw-IP and mirror hostname responses use `X-Robots-Tag: noindex` to avoid duplicate indexing. Main `https://a-znk.com/` stays hosted on Vercel. No automatic content synchronization is configured yet.

Nginx inherits the existing vercel.json security headers, serves the real 404 page with status 404, marks raw Markdown noindex, and caches hashed Astro assets. Keep public/googleb326e1b2b17b02a1.html.

Run deploy.sh from a local checkout to rebuild and atomically publish another static release. Server bootstrap, DNS and TLS configuration are documented separately; certbot certificate files stay on the VPS, not in Git. Never change Xray 443/24443 to make the mirror available.

CI also produces a `public-static-site` artifact with the canonical domain and existing public Waline URL, archive SHA-256 and source revision. After the **entire** matching run passes, it can be copied into a new release and atomically promoted without rebuilding on a memory-constrained workstation. The artifact contains only `dist/`, not source or credentials; it does not auto-deploy or alter DNS, TLS, Nginx or Xray.
