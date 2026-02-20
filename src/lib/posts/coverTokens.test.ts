import { describe, expect, it } from "vitest";
import { getPostCoverTokens } from "./coverTokens";

describe("getPostCoverTokens", () => {
  it("returns deterministic tokens for the same slug", () => {
    const once = getPostCoverTokens("paragraph-anchor-design");
    const twice = getPostCoverTokens("paragraph-anchor-design");

    expect(once).toEqual(twice);
  });

  it("normalizes slug case and spacing", () => {
    const lower = getPostCoverTokens("why-topic-first");
    const upper = getPostCoverTokens("  WHY-TOPIC-FIRST  ");

    expect(upper).toEqual(lower);
  });

  it("returns valid token ranges", () => {
    const token = getPostCoverTokens("knowledge-network");

    expect(token.palette).toHaveLength(3);
    token.palette.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    expect(token.accent).toMatch(/^#[0-9a-f]{6}$/i);
    expect(["grid", "stripes", "beams"]).toContain(token.pattern);
    expect(token.badge.length).toBeGreaterThan(0);
    expect(token.tilt).toBeGreaterThanOrEqual(-15);
    expect(token.tilt).toBeLessThanOrEqual(15);
  });
});
