import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { LEGACY_WALINE_URL } from "./walineServerURL";

interface VercelJSON {
  rewrites?: { source: string; destination: string }[];
  headers?: { source: string; headers: { key: string; value: string }[] }[];
}

const config = JSON.parse(readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")) as VercelJSON;

describe("first-party Waline API gateway config", () => {
  it("proxies only API requests to the existing Waline backend", () => {
    expect(config.rewrites).toEqual([
      {
        source: "/_waline/api/:path*",
        destination: `${LEGACY_WALINE_URL}/api/:path*`,
      },
    ]);
  });

  it("allows the canonical origin for users reading the independent VPS mirror", () => {
    const headers = config.headers?.find((entry) => entry.source === "/(.*)")?.headers;
    const csp = headers?.find((entry) => entry.key === "Content-Security-Policy")?.value;
    expect(csp).toContain("connect-src 'self' https://api.swo.moe https://a-znk.com ");
  });
});
