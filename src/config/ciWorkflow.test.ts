import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(join(process.cwd(), ".github/workflows/ci.yml"), "utf8");
const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
  scripts?: Record<string, string>;
  engines?: Record<string, string>;
};

describe("CI workflow contract", () => {
  it("provides SITE_URL to build and e2e jobs", () => {
    expect(workflow).toContain("SITE_URL: https://myblog.example");
  });

  it("runs on a Node version compatible with Astro 7", () => {
    expect(workflow).not.toContain("node-version: 20");
    expect(workflow).toContain("node-version: 22");
    expect(packageJson.engines?.node).toBe(">=22.12.0");
  });

  it("runs the standalone Waline server smoke check", () => {
    expect(packageJson.scripts?.["test:waline-server"]).toBe("pnpm --dir waline-server smoke");
    expect(workflow).toContain("pnpm --dir waline-server install --frozen-lockfile");
    expect(workflow).toContain("pnpm --dir waline-server smoke");
  });

  it("checks paper cover provenance in CI and aggregate verification", () => {
    expect(packageJson.scripts?.["papers:check"]).toBe("node scripts/papers/enrich.mjs --check");
    expect(packageJson.scripts?.["test:all"]).toContain("pnpm papers:check");
    expect(workflow).toContain("run: pnpm papers:check");
  });

  it("keeps production dependency audits in CI and the aggregate verification command", () => {
    expect(packageJson.scripts?.["audit:prod"]).toBe("pnpm audit --prod --audit-level moderate");
    expect(packageJson.scripts?.["audit:waline-server"]).toBe(
      "pnpm --dir waline-server audit --prod --audit-level moderate"
    );
    expect(packageJson.scripts?.["audit:all"]).toBe("pnpm audit:prod && pnpm audit:waline-server");
    expect(packageJson.scripts?.["test:all"]).toContain("pnpm audit:all");
    expect(workflow).toContain("pnpm audit:prod");
    expect(workflow).toContain("pnpm audit:waline-server");
  });
});
