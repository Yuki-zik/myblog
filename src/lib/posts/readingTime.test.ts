import { describe, expect, it } from "vitest";
import { estimateHybridReadingMinutes, getPostReadingMinutes } from "./readingTime";

describe("estimateHybridReadingMinutes", () => {
  it("estimates mixed CJK and Latin content with the shared hybrid heuristic", () => {
    const chineseBlock = "测".repeat(440);
    const latinBlock = Array.from({ length: 250 }, () => "word").join(" ");

    expect(estimateHybridReadingMinutes(`${chineseBlock} ${latinBlock}`)).toBe(3);
  });

  it("never returns less than one minute for short content", () => {
    expect(estimateHybridReadingMinutes("短句 mixed text")).toBe(1);
  });
});

describe("getPostReadingMinutes", () => {
  it("prefers explicit readingTime when present", () => {
    expect(
      getPostReadingMinutes({
        body: "测".repeat(880),
        data: { readingTime: 7 }
      })
    ).toBe(7);
  });

  it("falls back to the shared estimator when readingTime is missing", () => {
    expect(
      getPostReadingMinutes({
        body: "测".repeat(220),
        data: {}
      })
    ).toBe(1);
  });
});
