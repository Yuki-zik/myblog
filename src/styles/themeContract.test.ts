import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const stylesDir = path.join(process.cwd(), "src", "styles");
const tokensFile = path.join(stylesDir, "tokens.css");
const tokensCss = readFileSync(tokensFile, "utf8");
const cssFiles = readdirSync(stylesDir).filter((file) => file.endsWith(".css"));

const requiredTokens = [
  "--c-midnight",
  "--c-navy",
  "--c-lace",
  "--c-ivory",
  "--c-moonlight",
  "--page-bg",
  "--page-bg-ambient",
  "--surface-primary",
  "--surface-elevated",
  "--surface-strong",
  "--text-primary",
  "--text-secondary",
  "--text-on-dark",
  "--text-meta",
  "--border-default",
  "--border-strong",
  "--divider",
  "--divider-strong",
  "--state-hover",
  "--state-active",
  "--focus-ring",
  "--selected-bg",
  "--selected-border",
  "--disabled-bg",
  "--disabled-border",
  "--disabled-text",
  "--brand-accent",
  "--accent-soft",
  "--link",
  "--link-hover",
  "--progress-track",
  "--progress-fill",
  "--button-primary-bg",
  "--button-primary-text",
  "--button-primary-border",
  "--button-primary-hover-bg",
  "--button-secondary-bg",
  "--button-secondary-text",
  "--button-secondary-border",
  "--button-secondary-hover-bg",
  "--input-bg",
  "--input-border",
  "--input-focus-bg",
  "--input-placeholder",
  "--tag-bg",
  "--tag-border",
  "--tag-text",
  "--tag-selected-bg",
  "--tag-selected-border",
  "--code-bg",
  "--code-border",
  "--code-text",
  "--blockquote-bg",
  "--blockquote-border",
  "--notice-bg",
  "--notice-border",
  "--notice-text",
  "--empty-bg",
  "--empty-border",
  "--empty-text",
  "--empty-icon",
];

const bannedVarRefs = [
  "--text",
  "--bg-layer",
  "--color-midnight",
  "--color-navy",
  "--color-lace",
  "--color-ivory",
  "--color-moonlight",
  "--edge-soft",
  "--surface-soft",
  "--primary",
  "--secondary",
  "--shadow-soft",
];

function hasTokenDefinition(source: string, token: string): boolean {
  const pattern = new RegExp(`^\\s*${token.replace(/[-]/g, "\\-")}\\s*:`, "m");
  return pattern.test(source);
}

function hasBannedVarRef(source: string, token: string): boolean {
  const escaped = token.replace(/[-]/g, "\\-");
  const pattern = new RegExp(`var\\(${escaped}(?![-\\w])`, "g");
  return pattern.test(source);
}

describe("theme token contract", () => {
  it("defines the semantic token contract in tokens.css", () => {
    requiredTokens.forEach((token) => {
      expect(hasTokenDefinition(tokensCss, token), `${token} should be defined`).toBe(true);
    });
  });

  it("does not reference banned legacy variables from style modules", () => {
    cssFiles.forEach((file) => {
      const source = readFileSync(path.join(stylesDir, file), "utf8");
      bannedVarRefs.forEach((token) => {
        expect(
          hasBannedVarRef(source, token),
          `${file} still references legacy variable ${token}`,
        ).toBe(false);
      });
    });
  });

  it("keeps private reading and article comment palettes out of component styles", () => {
    const articleCss = readFileSync(path.join(stylesDir, "article.css"), "utf8");
    const walineCss = readFileSync(path.join(stylesDir, "waline.css"), "utf8");

    expect(articleCss.match(/^\s*--reading-paper-/m), "article.css should not define private reading-paper tokens").toBeNull();
    expect(walineCss.match(/^\s*--wlc-/m), "waline.css should not define private Waline wrapper tokens").toBeNull();
  });

  it("keeps the five foundation hex colors in tokens.css only", () => {
    const fiveHexes = ["#182540", "#344973", "#E6ECFB", "#EACBB0", "#FF7A5B"];

    cssFiles
      .filter((file) => file !== "tokens.css")
      .forEach((file) => {
        const source = readFileSync(path.join(stylesDir, file), "utf8");
        fiveHexes.forEach((hex) => {
          expect(source.includes(hex), `${file} should not use foundation hex ${hex} directly`).toBe(false);
        });
      });
  });
});
