import { describe, expect, it } from "vitest";
import { formatPostDisplayDate, getPostDateISO, getPostMonthKey } from "./date";

describe("post date helpers", () => {
  it("formats display dates in Asia/Shanghai even near UTC midnight boundaries", () => {
    expect(formatPostDisplayDate("2026-03-28T00:30:00+08:00")).toBe("2026/3/28");
  });

  it("derives stable ISO day and month keys from source strings", () => {
    const value = "2026-01-01T00:30:00+08:00";

    expect(getPostDateISO(value)).toBe("2026-01-01");
    expect(getPostMonthKey(value)).toBe("2026-01");
  });
});
