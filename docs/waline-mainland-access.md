# Waline mainland access repair — 2026-10-19

## Problem and evidence

A mainland campus MacBook and Mac mini can load `https://a-znk.com/`, including a full article's CSS and JS. Both fail to resolve `waline-smoky-five-24.vercel.app` over normal direct DNS and reset TLS when dialing known provider IPs. The independent Los Angeles VPS can fetch the same Waline deployment and read the existing comment (`/api/comment?path=%2Fposts%2Fparagraph-anchor-design`, HTTP 200, `errno:0`, count 1). This isolates the problem to mainland clients reaching the old public Waline origin. It does not indicate a Waline database failure.

## Architecture

Frontend on the canonical Vercel site → same-origin `https://a-znk.com/_waline/api/*` → fixed external rewrite to the **same existing** `https://waline-smoky-five-24.vercel.app/api/*` → original Waline deployment and unchanged database.

- Source: `vercel.json`, **only** `/_waline/api/:path*` (not a general-purpose reverse proxy). Vercel rewrites retain incoming API methods, query strings and request bodies. No rewrite CDN caching is enabled, to avoid serving one user's state to others or stale comments.
- `src/components/comments/walineServerURL.ts` transforms only the configured legacy Waline origin. On `a-znk.com` or Vercel preview domains it uses the page's own origin; on `vps.a-znk.com` it uses the main `a-znk.com` proxy to avoid an unavailable static VPS API. On localhost or when the environment points to a future custom comment domain, it leaves the original configuration unchanged.
- The existing Waline `path=/posts/<slug>` identity, comment IDs and original database remain unchanged. The Waline admin interface continues to use the original backend address from a reachable environment, since this rewrite intentionally exposes only `/api`.
- The top-level content security policy now permits `https://a-znk.com` under `connect-src` so a reader on the independent HTTPS VPS mirror can contact the canonical proxy. This does not relax scripts, frames, uploads or general destinations.
- Vercel automatically deploys this source through the existing GitHub integration. This change needs **no registrar DNS record, new Vercel project, paid add-on, new port or VPS/Xray edit**. It does not change `PUBLIC_WALINE_SERVER_URL` production environment variables; the known old value is migrated client-side.

## Acceptance criteria

1. Run `pnpm test`, `pnpm build` and `pnpm test:e2e` against the candidate branch, with the existing CI secrets/variables; the new resolver/config-contract tests are included.
2. On an actual Vercel **preview** deployment, probe `/_waline/api/comment?path=%2Fposts%2Fparagraph-anchor-design` and ensure JSON `errno=0`, count=1. Check an unrelated URL still returns the site's normal 404. Avoid posting test comments to the production database.
3. After merging and production deployment, from a direct China mainland client **without** proxy:

   ```bash
   curl -4fsS --noproxy '*' --connect-timeout 5 --max-time 15 'https://a-znk.com/_waline/api/comment?path=%2Fposts%2Fparagraph-anchor-design'
   curl -4sSI --noproxy '*' 'https://a-znk.com/posts/paragraph-anchor-design'
   ```

   The first response must have `errno=0` and preserve the existing comment(s); the second must return 200 with valid HTTPS. In a real browser, confirm the actual Waline widget requests `a-znk.com/_waline/api/...`, displays the existing comment, and shows no CSP/CORS errors. A valid comment submission would require consent to publish; use API rejection checks or separate review to test POST without adding data.
4. On `https://vps.a-znk.com:8443/posts/...` from CN, the runtime should call the canonical `a-znk.com/_waline` and honor CSP/CORS. The static mirror need not have an API route.
5. Verify legacy Waline backend is still healthy separately from a non-CN source, and that no existing comments were modified.

## Security / rollback

The proxy path is deliberately restricted to the Waline API. Keep the rewrite uncached; do not add `/admin` or wildcard `/:path*`, and avoid a shared service proxy that accepts caller-provided destinations. If the proxy malfunctions, revert the `vercel.json` rewrite and the front-end URL resolver in GitHub, and redeploy. The old `.vercel.app` backend continues to serve as the fallback; no database rollback is needed. This reintroduces mainland connectivity limitations while returning to the previous known topology.

## Sources

- Vercel official [rewrites to external origins](https://vercel.com/docs/routing/rewrites) and [project configuration](https://vercel.com/docs/project-configuration/vercel-json).
- Waline [server/client configuration](https://waline.js.org/en/guide/get-started/).
- Blog source `src/components/comments/WalineComments.tsx`, `vercel.json` and Waline API readback tested from CN vs VPS on 2026-10-19.
