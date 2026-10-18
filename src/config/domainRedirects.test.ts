import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Redirect = {
  source: string;
  destination: string;
  statusCode: number;
  has: { type: string; value: string }[];
};

const config = JSON.parse(readFileSync(join(process.cwd(), "vercel.json"), "utf8")) as {
  redirects?: Redirect[];
};

const oldHosts = ["a-znk-blog.vercel.app", "myblog-silk-one.vercel.app"];

describe("canonical-domain redirects", () => {
  for (const host of oldHosts) {
    it(`permanently redirects ${host} paths to a-znk.com while preserving the Google verification file`, () => {
      const rules = (config.redirects ?? []).filter((item) =>
        item.has?.some((condition) => condition.type === "host" && condition.value === host),
      );
      expect(rules).toHaveLength(1);
      const [rule] = rules;
      expect(rule.statusCode).toBe(301);
      expect(rule.destination).toBe("https://a-znk.com/:path");
      expect(rule.source).toContain("googleb326e1b2b17b02a1");
      // The verifier must remain readable on the old, previously verified GSC property.
      expect(rule.source).toContain("?!googleb326e1b2b17b02a1");
    });
  }

  it("does not add a catch-all redirect to the canonical host", () => {
    for (const rule of config.redirects ?? []) {
      expect(rule.has?.some((condition) => condition.type === "host" && condition.value === "a-znk.com")).toBe(false);
    }
  });
});
