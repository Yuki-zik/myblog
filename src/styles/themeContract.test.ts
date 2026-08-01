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

function extractBalanced(source: string, openIndex: number): string {
  // openIndex points at the "(" of the call. Returns the argument text.
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    if (source[i] === "(") depth += 1;
    if (source[i] === ")") {
      depth -= 1;
      if (depth === 0) return source.slice(openIndex + 1, i);
    }
  }
  return "";
}

function splitTopLevel(args: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of args) {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

function findOverloadedColorMix(source: string): string[] {
  const offenders: string[] = [];
  const needle = "color-mix(";
  let index = source.indexOf(needle);

  while (index !== -1) {
    const args = extractBalanced(source, index + needle.length - 1);
    // First top-level argument is the <color-interpolation-method>; the rest
    // are colour stops. CSS Color 5 allows exactly two colour stops.
    const colorStops = splitTopLevel(args).length - 1;
    if (colorStops > 2) {
      offenders.push(`color-mix(${args})`);
    }
    index = source.indexOf(needle, index + needle.length);
  }

  return offenders;
}

// The five foundation colours, paired with their decimal rgb() triplet. The hex
// ban below only catches the hex spelling; the same colour written as
// rgb(24, 37, 64) or rgba(24 37 64 / .5) slips through, yet a decimal literal
// can no more follow html[data-color-scheme="dark"] than a hex one can.
const foundationRgb = [
  { name: "--c-midnight (#182540)", r: 24, g: 37, b: 64 },
  { name: "--c-navy (#344973)", r: 52, g: 73, b: 115 },
  { name: "--c-lace (#E6ECFB)", r: 230, g: 236, b: 251 },
  { name: "--c-ivory (#EACBB0)", r: 234, g: 203, b: 176 },
  { name: "--c-moonlight (#FF7A5B)", r: 255, g: 122, b: 91 },
];

function stripCssComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "");
}

function findFoundationRgb(source: string): string[] {
  // Comments are stripped first so historical bug notes that quote the old
  // literal (e.g. back-to-top.css) are not treated as live violations.
  const clean = stripCssComments(source);
  // A component separator inside rgb()/rgba() is either a comma (with optional
  // surrounding whitespace) or one-or-more whitespace characters — this covers
  // both `24, 37, 64` and the space-separated `24 37 64 / 0.5` form.
  const sep = "(?:\\s*,\\s*|\\s+)";
  const offenders: string[] = [];

  for (const { name, r, g, b } of foundationRgb) {
    const pattern = new RegExp(
      `rgba?\\(\\s*${r}${sep}${g}${sep}${b}(?:${sep}[^)]*)?\\)`,
      "gi",
    );
    const matches = clean.match(pattern);
    if (matches) {
      for (const literal of matches) {
        offenders.push(`${literal.replace(/\s+/g, " ")}  (${name})`);
      }
    }
  }

  return offenders;
}

describe("theme token contract", () => {
  it("never passes more than two colours to color-mix()", () => {
    // A three-colour color-mix() is invalid, so the whole declaration becomes
    // invalid at computed-value time and silently falls back to transparent /
    // inherited. Seven light-mode tokens shipped this way for months; verified
    // in-browser that CSS.supports() returns false and the computed value is
    // rgba(0, 0, 0, 0). Nest two-colour mixes instead.
    cssFiles.forEach((file) => {
      const source = readFileSync(path.join(stylesDir, file), "utf8");
      expect(findOverloadedColorMix(source), `${file} has an invalid color-mix()`).toEqual([]);
    });
  });

  it("does not let scroll-reveal animations retain their end transform", () => {
    // `animation-fill-mode: both` keeps the `to` frame after the reveal ends,
    // and the animation origin outranks author declarations — which silently
    // kills every :hover transform on a revealed element. `backwards` still
    // covers the stagger delay without pinning the settled state.
    const baseCss = readFileSync(path.join(stylesDir, "base.css"), "utf8");
    const revealRules = baseCss.match(/\[data-ux-reveal[^\]]*\][^{]*\{[^}]*\}/g) ?? [];

    expect(revealRules.length, "reveal rules should exist in base.css").toBeGreaterThan(0);
    revealRules
      .filter((rule) => rule.includes("animation:"))
      .forEach((rule) => {
        expect(rule, "reveal animation must not use fill-mode both").not.toMatch(
          /animation:[^;]*\bboth\b/
        );
      });
  });

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

  it("keeps the five foundation colors out of rgb()/rgba() spellings", () => {
    // Companion to the hex ban: a foundation colour written as rgb()/rgba() —
    // including comma, whitespace, and the "R G B / A" space-separated form —
    // is just as unable to follow html[data-color-scheme="dark"] as a hex is.
    // That is exactly how the back-to-top button went nearly invisible in dark
    // mode. tokens.css is exempt (it is the source of truth and legitimately
    // holds these triplets in its shadow and progress gradients).
    cssFiles
      .filter((file) => file !== "tokens.css")
      .forEach((file) => {
        const source = readFileSync(path.join(stylesDir, file), "utf8");
        const offenders = findFoundationRgb(source);
        expect(
          offenders,
          `${file} spells a foundation color as an rgb()/rgba() literal: ${offenders.join("; ")}`,
        ).toEqual([]);
      });
  });
});
