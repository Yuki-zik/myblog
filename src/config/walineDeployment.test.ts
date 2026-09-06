import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(process.cwd(), "supabase/migrations/20260429000000_waline_rls.sql"),
  "utf8"
);
const walineServerPackage = JSON.parse(
  readFileSync(join(process.cwd(), "waline-server/package.json"), "utf8")
) as {
  dependencies?: Record<string, string>;
};
const walineReadme = readFileSync(join(process.cwd(), "waline-server/README.md"), "utf8");

describe("Waline deployment contract", () => {
  it("requires a pre-created LOGIN role instead of silently creating a NOLOGIN role", () => {
    expect(migration).not.toMatch(/CREATE\s+ROLE\s+waline\s*;/i);
    expect(migration).toMatch(/rolcanlogin/i);
    expect(migration).toMatch(/RAISE\s+EXCEPTION/i);
  });

  it("keeps README dependency version aligned with waline-server package.json", () => {
    const walineVersion = walineServerPackage.dependencies?.["@waline/vercel"];
    expect(walineVersion).toBeTruthy();
    expect(walineReadme).toContain(`@waline/vercel@${walineVersion}`);
  });
});
