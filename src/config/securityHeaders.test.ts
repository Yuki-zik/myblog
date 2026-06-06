import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("deployment security headers", () => {
  it("defines baseline browser security headers", () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      headers?: Array<{ source?: string; headers?: Array<{ key: string; value: string }> }>;
    };

    const allHeaders = new Map(
      (config.headers ?? []).flatMap((entry) =>
        (entry.headers ?? []).map((header) => [header.key.toLowerCase(), header.value])
      )
    );

    expect(allHeaders.get("x-content-type-options")).toBe("nosniff");
    expect(allHeaders.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(allHeaders.get("x-frame-options")).toBe("DENY");
    expect(allHeaders.get("permissions-policy")).toContain("geolocation=()");
    const csp = allHeaders.get("content-security-policy") ?? "";
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("connect-src 'self' https://api.swo.moe");
    expect(csp).not.toMatch(/connect-src[^;]*\shttps:\s*(?:;|$)/);
  });
});
