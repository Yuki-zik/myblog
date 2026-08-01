import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const stylesDir = path.join(process.cwd(), "src", "styles");
const tailwindCss = readFileSync(path.join(stylesDir, "tailwind.css"), "utf8");
const tokensCss = readFileSync(path.join(stylesDir, "tokens.css"), "utf8");

function readDeclaration(source: string, name: string): string | undefined {
  const pattern = new RegExp(`^\\s*${name.replace(/-/g, "\\-")}\\s*:\\s*([^;]+);`, "m");
  return pattern.exec(source)?.[1]?.trim();
}

describe("tailwind theme bridge", () => {
  it("keeps the radius scale identical in tokens.css and the Tailwind theme", () => {
    // Tailwind owns the `--radius-*` namespace, so the literals are mirrored
    // rather than aliased. This guards against the two copies drifting.
    ["--radius-sm", "--radius-md", "--radius-lg", "--radius-xl", "--radius-full"].forEach(
      (token) => {
        const fromTailwind = readDeclaration(tailwindCss, token);
        const fromTokens = readDeclaration(tokensCss, token);

        expect(fromTailwind, `${token} should be declared in tailwind.css`).toBeDefined();
        expect(fromTokens, `${token} should be declared in tokens.css`).toBeDefined();
        expect(fromTailwind, `${token} drifted between tailwind.css and tokens.css`).toBe(
          fromTokens
        );
      }
    );
  });

  it("bridges runtime-switched values by reference instead of copying them", () => {
    // `@theme inline` entries must point back at tokens.css so the tri-state
    // theme keeps working; a literal here would freeze the light palette.
    const runtimeBridges: Array<[string, string]> = [
      ["--color-page", "var(--page-bg)"],
      ["--color-surface", "var(--surface-primary)"],
      ["--color-ink", "var(--text-primary)"],
      ["--color-edge", "var(--border-default)"],
      ["--color-accent", "var(--brand-accent)"],
      ["--shadow-elev-1", "var(--shadow-sm)"],
      ["--spacing-md", "var(--space-md)"]
    ];

    runtimeBridges.forEach(([token, expected]) => {
      expect(readDeclaration(tailwindCss, token), `${token} should bridge to ${expected}`).toBe(
        expected
      );
    });
  });

  it("does not import Tailwind preflight", () => {
    // Article bodies rely on the browser default list-style; preflight would
    // strip body list markers. See src/styles/tailwind.css for the rationale.
    expect(tailwindCss).not.toMatch(/@import\s+["']tailwindcss["']\s*;/);
    expect(tailwindCss).not.toMatch(/@import\s+["']tailwindcss\/preflight/);
    expect(tailwindCss).toMatch(/@import\s+["']tailwindcss\/utilities\.css["']\s+layer\(utilities\)/);
  });
});
