#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
HOST="${BLOG_VPS_HOST:-root@38.148.253.95}"
PORT="${BLOG_VPS_SSH_PORT:-13424}"
export SITE_URL="${SITE_URL:-https://a-znk.com}"
export PUBLIC_WALINE_SERVER_URL="${PUBLIC_WALINE_SERVER_URL:-https://waline-smoky-five-24.vercel.app}"
cd "$ROOT"
pnpm test
pnpm build
RELEASE="$(date -u +%Y%m%dT%H%M%SZ)-$(git rev-parse --short HEAD)"
REMOTE="/var/www/a-znk-blog/releases/$RELEASE"
SSH=(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=10 -p "$PORT" "$HOST")
"${SSH[@]}" "install -d -m 755 '$REMOTE'"
COPYFILE_DISABLE=1 tar --no-xattrs -C dist -czf - . | "${SSH[@]}" "tar -xzf - -C '$REMOTE'"
"${SSH[@]}" "set -eu; test -s '$REMOTE/index.html'; test -s '$REMOTE/sitemap-index.xml'; chmod -R a+rX '$REMOTE'; ln -s '$REMOTE' /var/www/a-znk-blog/current.next; mv -Tf /var/www/a-znk-blog/current.next /var/www/a-znk-blog/current; curl -fsS -H 'Host: a-znk.com' http://127.0.0.1/ >/dev/null"
printf 'Published %s to %s (HTTP mirror; TLS/DNS status must be verified separately).\n' "$RELEASE" "$HOST"
