/** Resolve the legacy public Waline URL through the blog's first-party API gateway. */
export const LEGACY_WALINE_URL = "https://waline-smoky-five-24.vercel.app";
export const WALINE_PROXY_PATH = "/_waline";

export function resolveWalineServerURL(
  configuredURL: string | undefined,
  pageOrigin: string | undefined,
): string {
  const base = (configuredURL ?? "").trim().replace(/\/+$/, "");
  // Do not override future custom domains or local test/preview backends.
  if (base !== LEGACY_WALINE_URL || !pageOrigin) return base;

  let origin: URL;
  try {
    origin = new URL(pageOrigin);
  } catch {
    return base;
  }

  const host = origin.hostname.toLowerCase();
  if (host === "vps.a-znk.com") {
    // The static VPS mirror has no API proxy and should not spend VPS traffic.
    return `https://a-znk.com${WALINE_PROXY_PATH}`;
  }
  if (host === "a-znk.com" || host === "www.a-znk.com" || host.endsWith(".vercel.app")) {
    return `${origin.origin}${WALINE_PROXY_PATH}`;
  }
  return base;
}
