import { describe, expect, it } from "vitest";
import {
  LEGACY_WALINE_URL,
  resolveWalineServerURL,
} from "./walineServerURL";

describe("Waline mainland-safe API origin", () => {
  it("routes the legacy service through the public blog's same-origin proxy", () => {
    expect(resolveWalineServerURL(LEGACY_WALINE_URL, "https://a-znk.com")).toBe(
      "https://a-znk.com/_waline",
    );
    expect(resolveWalineServerURL(LEGACY_WALINE_URL, "https://www.a-znk.com")).toBe(
      "https://www.a-znk.com/_waline",
    );
  });

  it("supports Vercel preview deployments with the same rewrite", () => {
    expect(
      resolveWalineServerURL(
        LEGACY_WALINE_URL,
        "https://myblog-git-fix-waline-cn.example-team.vercel.app",
      ),
    ).toBe("https://myblog-git-fix-waline-cn.example-team.vercel.app/_waline");
  });

  it("uses the Vercel origin for the independent VPS static mirror", () => {
    expect(resolveWalineServerURL(LEGACY_WALINE_URL, "https://vps.a-znk.com:8443")).toBe(
      "https://a-znk.com/_waline",
    );
  });

  it("preserves direct endpoints for local development and future custom domains", () => {
    expect(resolveWalineServerURL(LEGACY_WALINE_URL, "http://localhost:4321")).toBe(
      LEGACY_WALINE_URL,
    );
    expect(resolveWalineServerURL("https://comments.a-znk.com", "https://a-znk.com")).toBe(
      "https://comments.a-znk.com",
    );
    expect(resolveWalineServerURL("", "https://a-znk.com")).toBe("");
    expect(resolveWalineServerURL(undefined, "https://a-znk.com")).toBe("");
  });

  it("keeps the old endpoint if the current page origin is malformed", () => {
    expect(resolveWalineServerURL(LEGACY_WALINE_URL, "malformed-origin")).toBe(
      LEGACY_WALINE_URL,
    );
  });
});
