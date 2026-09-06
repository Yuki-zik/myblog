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
    const directives = new Map(csp.split(";").map((directive) => {
      const [name, ...sources] = directive.trim().split(/\s+/);
      return [name, sources];
    }));
    expect(directives.get("font-src")).toEqual([
      "'self'", "data:", "https://fonts.gstatic.com"
    ]);
    expect(directives.get("script-src")).toEqual(["'self'", "'unsafe-inline'"]);
    expect(directives.get("connect-src")).toEqual([
      "'self'", "https://api.swo.moe", "https://waline.example",
      "https://comments.example.com", "https://*.vercel.app"
    ]);
  });

  it("marks raw .md mirrors as noindex (X-Robots-Tag) so they are not indexed as duplicates", () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      headers?: Array<{ source?: string; headers?: Array<{ key: string; value: string }> }>;
    };

    const mdRule = (config.headers ?? []).find((entry) => entry.source === "/(.*).md");
    expect(mdRule, "vercel.json must carry an X-Robots-Tag rule for /(.*).md").toBeDefined();

    const robotsTag = (mdRule?.headers ?? []).find(
      (header) => header.key.toLowerCase() === "x-robots-tag"
    );
    expect(robotsTag?.value).toContain("noindex");
  });

  it("gives the generated search index explicit CDN caching and MIME hardening", () => {
    const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
      headers?: Array<{ source?: string; headers?: Array<{ key: string; value: string }> }>;
    };

    const searchRule = (config.headers ?? []).find(
      (entry) => entry.source === "/search-index.json"
    );
    const headers = new Map(
      (searchRule?.headers ?? []).map((header) => [header.key.toLowerCase(), header.value])
    );

    expect(headers.get("x-content-type-options")).toBe("nosniff");
    expect(headers.get("cache-control")).toContain("s-maxage=300");
  });
});
